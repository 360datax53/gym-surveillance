from ultralytics import YOLO
import cv2
import numpy as np
from PIL import Image
import io
import base64
from deepface import DeepFace
import os

class FaceDetector:
    def __init__(self):
        # Load YOLOv8 face detection model
        model_path = os.path.join(os.path.dirname(__file__), 'yolov8n-face.pt')
        self.model = YOLO(model_path)
        self.confidence_threshold = 0.5
        # Pre-load DeepFace model to avoid delay during first request
        self.encoding_model = "Facenet" # Options: VGG-Face, Facenet, OpenFace, DeepFace
        
    def detect_faces(self, image_source):
        """
        Detect faces in image
        image_source: file path, URL, or base64 string
        Returns: list of face detections with coordinates
        """
        try:
            # Convert image to numpy array
            if isinstance(image_source, str) and image_source.startswith('data:'):
                # Base64 image
                base64_data = image_source.split(',')[1]
                image_data = base64.b64decode(base64_data)
                image = Image.open(io.BytesIO(image_data))
                image = np.array(image)
            else:
                # File path or URL
                image = cv2.imread(image_source)
            
            # Run detection
            results = self.model(image, conf=self.confidence_threshold)
            
            # Parse results
            detections = []
            for result in results:
                for box in result.boxes:
                    x1, y1, x2, y2 = box.xyxy[0]
                    confidence = box.conf[0]
                    detections.append({
                        'x': int(x1),
                        'y': int(y1),
                        'width': int(x2 - x1),
                        'height': int(y2 - y1),
                        'confidence': float(confidence)
                    })
            
            return {
                'success': True,
                'face_count': len(detections),
                'detections': detections
            }
        
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def extract_face_encoding(self, image_source, detection):
        """
        Extract high-fidelity face embedding using DeepFace
        """
        try:
            if isinstance(image_source, str) and image_source.startswith('data:'):
                base64_data = image_source.split(',')[1]
                image_data = base64.b64decode(base64_data)
                image = Image.open(io.BytesIO(image_data))
                image = np.array(image)
            else:
                image = cv2.imread(image_source)
            
            # Crop face region with 10% padding for better feature extraction
            x, y, w, h = detection['x'], detection['y'], detection['width'], detection['height']
            img_h, img_w = image.shape[:2]
            
            pad_w = int(w * 0.1)
            pad_h = int(h * 0.1)
            
            x1 = max(0, x - pad_w)
            y1 = max(0, y - pad_h)
            x2 = min(img_w, x + w + pad_w)
            y2 = min(img_h, h + h + pad_h)
            
            face_crop = image[y1:y2, x1:x2]
            
            # Generate actual facial embedding
            # align=True ensures the face is normalized before encoding
            results = DeepFace.represent(
                img_path=face_crop, 
                model_name=self.encoding_model, 
                enforce_detection=False,
                align=True
            )
            
            if results and len(results) > 0:
                encoding = results[0]["embedding"]
                return {
                    'success': True,
                    'encoding': encoding,
                    'model': self.encoding_model
                }
            
            return {'success': False, 'error': 'No face features extracted'}
        
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    def compare_faces(self, encoding_a, encoding_b, threshold=0.4):
        """
        Compare two encodings using Cosine similarity
        A lower distance means more similarity
        """
        try:
            # DeepFace uses 1 - cosine_similarity for distance
            # For Facenet, 0.4 is a common threshold for Cosine distance
            from scipy.spatial.distance import cosine
            
            distance = cosine(encoding_a, encoding_b)
            is_match = distance < threshold
            
            return {
                'success': True,
                'distance': float(distance),
                'match': bool(is_match),
                'threshold': threshold
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
