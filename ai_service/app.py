from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from face_detector import FaceDetector

app = Flask(__name__)
# Enable CORS for Next.js (port 3000)
CORS(app)

# Initialize the detector once at startup
detector = FaceDetector()

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "service": "face-detector"})

@app.route('/detect', methods=['POST'])
def detect():
    """
    Endpoint for YOLOv8 face detection
    Expects: {"image": "base64_string" or "url"}
    """
    try:
        data = request.json
        if not data or 'image' not in data:
            return jsonify({"success": False, "error": "Missing image data"}), 400
        
        results = detector.detect_faces(data['image'])
        return jsonify(results)
    
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/verify', methods=['POST'])
def verify():
    """
    Endpoint for DeepFace verification
    Expects: {"image": "base64", "member_encoding": [128_floats]}
    """
    try:
        data = request.json
        if not data or 'image' not in data or 'member_encoding' not in data:
            return jsonify({"success": False, "error": "Missing image or member_encoding"}), 400
        
        # 1. Detect face first
        detection_result = detector.detect_faces(data['image'])
        if not detection_result['success'] or detection_result['face_count'] == 0:
            return jsonify({"success": False, "error": "No face detected in provided image"}), 400
        
        # 2. Extract encoding from the first face detected
        encoding_result = detector.extract_face_encoding(data['image'], detection_result['detections'][0])
        if not encoding_result['success']:
            return jsonify({"success": False, "error": "Failed to extract encoding"}), 500
        
        # 3. Compare with member encoding
        compare_result = detector.compare_faces(encoding_result['encoding'], data['member_encoding'])
        
        return jsonify({
            "success": True,
            "match": compare_result['match'],
            "distance": compare_result['distance'],
            "face_count": detection_result['face_count']
        })
    
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    # Run AI service on port 5001 to avoid conflicts with Next.js (3000)
    port = int(os.environ.get("PORT", 5001))
    app.run(host='0.0.0.0', port=port, debug=False)
