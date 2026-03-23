from ultralytics import YOLO
import cv2
import numpy as np
from PIL import Image
import io
import base64

class FaceDetector:
    def __init__(self):
        # Load YOLOv8 face detection model
        self.model = YOLO('yolov8n-face.pt')
        self.confidence_threshold = 0.5
    
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
        Extract face embedding for comparison
        """
        try:
            if isinstance(image_source, str) and image_source.startswith('data:'):
                base64_data = image_source.split(',')[1]
                image_data = base64.b64decode(base64_data)
                image = Image.open(io.BytesIO(image_data))
                image = np.array(image)
            else:
                image = cv2.imread(image_source)
            
            # Crop face region
            x, y, w, h = detection['x'], detection['y'], detection['width'], detection['height']
            face_crop = image[y:y+h, x:x+w]
            
            # Generate embedding (simplified - use actual face encoding in production)
            encoding = np.mean(face_crop.flatten())
            
            return {
                'success': True,
                'encoding': float(encoding)
            }
        
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
