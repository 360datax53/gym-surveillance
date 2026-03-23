from flask import Flask, request, jsonify
from flask_cors import CORS
from face_detector import FaceDetector
import os

app = Flask(__name__)
CORS(app)

# Initialize face detector
detector = FaceDetector()

@app.route('/api/detect-face', methods=['POST'])
def detect_face():
    """
    Detect faces in image
    Expects: {"image": "base64_string" or "file_path"}
    """
    try:
        data = request.json
        image_source = data.get('image')
        
        if not image_source:
            return jsonify({'error': 'No image provided'}), 400
        
        result = detector.detect_faces(image_source)
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/extract-encoding', methods=['POST'])
def extract_encoding():
    """
    Extract face encoding for member matching
    """
    try:
        data = request.json
        image_source = data.get('image')
        detection = data.get('detection')
        
        result = detector.extract_face_encoding(image_source, detection)
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'AI service running'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5005, debug=True)
