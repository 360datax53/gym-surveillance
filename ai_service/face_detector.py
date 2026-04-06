from ultralytics import YOLO
import cv2
import numpy as np
from PIL import Image
import io
import base64
import os
import logging
logging.getLogger('ultralytics').setLevel(logging.WARNING)

# InsightFace import with graceful fallback
try:
    import insightface
    from insightface.app import FaceAnalysis
    INSIGHTFACE_AVAILABLE = True
    print("✓ InsightFace loaded — member recognition enabled")
except ImportError:
    INSIGHTFACE_AVAILABLE = False
    print("⚠ InsightFace not installed — running in detection-only mode")


class FaceDetector:
    def __init__(self):
        # YOLOv8 face detection model
        model_path = os.path.join(os.path.dirname(__file__), 'yolov8n-face.pt')
        self.face_model = YOLO(model_path)
        
        # YOLOv8 general object detection — used for person/body detection
        # from overhead angles where faces aren't visible
        person_model_path = os.path.join(os.path.dirname(__file__), 'yolov8n.pt')
        self.person_model = YOLO(person_model_path)
        
        # Higher threshold = fewer false positives (like gym weights)
        self.confidence_threshold = 0.45
        self.min_face_size = 20  # Minimum width/height in pixels to consider a face
        self.encoding_model = "buffalo_sc"

        # Initialize InsightFace for face embedding extraction
        self.face_analysis = None
        if INSIGHTFACE_AVAILABLE:
            try:
                self.face_analysis = FaceAnalysis(name='buffalo_sc', providers=['CPUExecutionProvider'])
                self.face_analysis.prepare(ctx_id=0, det_size=(640, 640))
                print("✓ InsightFace buffalo_sc model ready")
            except Exception as e:
                print(f"⚠ InsightFace model init failed: {e}")
        
    def detect_faces(self, image_source):
        """
        Detect faces AND people in image.
        Falls back to body detection when camera is overhead (face not visible).
        Returns NORMALIZED coordinates (0.0 - 1.0) for frontend scaling.
        """
        try:
            # Convert to numpy array
            if isinstance(image_source, np.ndarray):
                image = image_source
            elif isinstance(image_source, str) and image_source.startswith('data:'):
                base64_data = image_source.split(',')[1]
                image_data = base64.b64decode(base64_data)
                image = np.array(Image.open(io.BytesIO(image_data)))
            else:
                image = cv2.imread(image_source)

            if image is None:
                return {'success': False, 'error': 'Could not load image', 'face_count': 0, 'detections': []}

            img_h, img_w = image.shape[:2]
            detections = []

            # --- Step 1: Try face detection first ---
            face_results = self.face_model(image, conf=self.confidence_threshold, verbose=False)
            for result in face_results:
                for box in result.boxes:
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    confidence = float(box.conf[0])
                    w_abs = int(x2 - x1)
                    h_abs = int(y2 - y1)
                    
                    if w_abs < self.min_face_size or h_abs < self.min_face_size:
                        continue
                        
                    detections.append({
                        'x': x1 / img_w,
                        'y': y1 / img_h,
                        'width': (x2 - x1) / img_w,
                        'height': (y2 - y1) / img_h,
                        'confidence': confidence,
                        'type': 'face',
                        'x_abs': int(x1), 'y_abs': int(y1),
                        'w_abs': w_abs, 'h_abs': h_abs,
                    })

            # --- Step 2: If no faces found, fall back to person/body detection ---
            # (handles overhead camera angles where faces are not visible)
            if len(detections) == 0:
                person_results = self.person_model(
                    image, conf=self.confidence_threshold, 
                    classes=[0],  # class 0 = person in COCO
                    verbose=False
                )
                for result in person_results:
                    for box in result.boxes:
                        x1, y1, x2, y2 = box.xyxy[0].tolist()
                        confidence = float(box.conf[0])
                        detections.append({
                            'x': x1 / img_w,
                            'y': y1 / img_h,
                            'width': (x2 - x1) / img_w,
                            'height': (y2 - y1) / img_h,
                            'confidence': confidence,
                            'type': 'person',  # shown as yellow box
                            'x_abs': int(x1), 'y_abs': int(y1),
                            'w_abs': int(x2 - x1), 'h_abs': int(y2 - y1),
                        })

            return {
                'success': True,
                'face_count': len(detections),
                'detections': detections
            }

        except Exception as e:
            return {'success': False, 'error': str(e), 'face_count': 0, 'detections': []}

    def extract_face_encoding(self, image: np.ndarray, detection: dict):
        """Extract face embedding using InsightFace (ArcFace, 512-dim)."""
        if not INSIGHTFACE_AVAILABLE or self.face_analysis is None:
            return {'success': False, 'error': 'InsightFace not available', 'encoding': None}
        if detection.get('type') == 'person':
            return {'success': False, 'error': 'Body detection — no face to encode', 'encoding': None}
        
        try:
            img_h, img_w = image.shape[:2]
            x = detection.get('x_abs', int(detection['x'] * img_w))
            y = detection.get('y_abs', int(detection['y'] * img_h))
            w = detection.get('w_abs', int(detection['width'] * img_w))
            h = detection.get('h_abs', int(detection['height'] * img_h))
            
            pad_w = int(w * 0.1)
            pad_h = int(h * 0.1)
            face_crop = image[max(0,y-pad_h):min(img_h,y+h+pad_h), max(0,x-pad_w):min(img_w,x+w+pad_w)]
            if face_crop.size == 0:
                return {'success': False, 'error': 'Empty face crop'}

            # InsightFace expects BGR (OpenCV native format)
            if len(face_crop.shape) == 3 and face_crop.shape[2] == 3:
                bgr_crop = face_crop if face_crop.dtype == np.uint8 else (face_crop * 255).astype(np.uint8)
            else:
                return {'success': False, 'error': 'Unexpected image format'}

            faces = self.face_analysis.get(bgr_crop)
            if faces:
                embedding = faces[0].embedding.tolist()
                return {'success': True, 'encoding': embedding, 'model': self.encoding_model}
            return {'success': False, 'error': 'No face embedding returned by InsightFace'}
        except Exception as e:
            return {'success': False, 'error': str(e), 'encoding': None}

    def match_member(self, encoding: list, member_encodings: list, threshold=0.4):
        """Compare a face encoding against known member encodings."""
        if not encoding or not member_encodings:
            return None
        try:
            from scipy.spatial.distance import cosine
            best_match = None
            best_distance = float('inf')
            current_dim = len(encoding)
            for member in member_encodings:
                stored = member.get('encoding')
                if not stored:
                    continue
                if len(stored) != current_dim:
                    print(
                        f"⚠ Skipping member '{member.get('name')}' — stored encoding "
                        f"has {len(stored)} dims but current model produces {current_dim} dims. "
                        "Member needs to be re-encoded via the dashboard.",
                        flush=True
                    )
                    continue
                distance = cosine(encoding, stored)
                if distance < best_distance:
                    best_distance = distance
                    best_match = member
            if best_match and best_distance < threshold:
                return {
                    'member_id': best_match['member_id'],
                    'name': best_match['name'],
                    'confidence': round((1 - best_distance) * 100, 1),
                    'distance': round(best_distance, 4),
                    'match': True
                }
            return None
        except Exception as e:
            print(f"Error in match_member: {e}", flush=True)
            return None
