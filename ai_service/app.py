import os
import threading
import cv2
from datetime import datetime, timezone
from flask import Flask, request, jsonify
from flask_cors import CORS
from face_detector import FaceDetector
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize face detector
detector = FaceDetector()

# Supabase configuration
supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

# RTSP credentials - loaded from .env, never from the database
RTSP_USERNAME = os.environ.get("RTSP_USERNAME", "")
RTSP_PASSWORD = os.environ.get("RTSP_PASSWORD", "")
RTSP_HOST = os.environ.get("RTSP_HOST", "")
RTSP_PORT = os.environ.get("RTSP_PORT", "554")

def secure_rtsp_url(rtsp_url: str) -> str:
    """
    Inject credentials from .env into an RTSP URL.
    Strips any existing credentials from the DB first for safety.
    e.g. rtsp://snap-dartford.dyndns.org:554/Streaming/Channels/102
      -> rtsp://operator:smart1976@snap-dartford.dyndns.org:554/Streaming/Channels/102
    """
    if not rtsp_url:
        return rtsp_url
    # Strip any existing embedded credentials
    import re
    clean = re.sub(r'rtsp://[^@]+@', 'rtsp://', rtsp_url)
    # Inject from env
    if RTSP_USERNAME and RTSP_PASSWORD:
        clean = clean.replace('rtsp://', f'rtsp://{RTSP_USERNAME}:{RTSP_PASSWORD}@', 1)
    return clean

# Global dictionary to track active processors
active_processors = {}

class RTSPStreamProcessor:
    def __init__(self, camera_id, rtsp_url):
        self.camera_id = camera_id
        self.rtsp_url = rtsp_url
        self.is_running = False
        self.cap = None
        self.thread = None

    def start(self):
        if self.is_running:
            return
        
        # On Mac ARM, hardware acceleration can cause SIGABRT crashes with HEVC RTSP
        # We force software decoding and TCP transport to prevent "PPS id out of range"
        os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp|hwaccel;none|probesize;5000000|analyzeduration;5000000"
        
        self.cap = cv2.VideoCapture(self.rtsp_url, cv2.CAP_FFMPEG)
        if not self.cap.isOpened():
            print(f"FAILED to connect to RTSP: {self.rtsp_url}")
            return
            
        self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1) # Minimize latency
        
        self.is_running = True
        self.thread = threading.Thread(target=self._process_loop, daemon=True)
        self.thread.start()
        print(f"Started RTSP processor for {self.camera_id}")

    def _process_loop(self):
        frame_count = 0
        while self.is_running:
            try:
                if not self.cap or not self.cap.isOpened():
                    import time
                    time.sleep(1)
                    continue

                ret, frame = self.cap.read()
                if not ret:
                    # Silent reconnect logic
                    self.cap.release()
                    self.cap = cv2.VideoCapture(self.rtsp_url, cv2.CAP_FFMPEG)
                    import time
                    time.sleep(1)
                    continue
                
                # Store the latest frame for the streaming endpoint
                self.latest_frame = frame
                
                # Process every 20th frame for AI
                if frame_count % 20 == 0:
                    results = detector.detect_faces(frame)
                    if results['success']:
                        # Always update — clears boxes when person moves away
                        self.latest_detections = results['detections'] if results['face_count'] > 0 else []
                        if results['face_count'] > 0:
                            self._handle_detections(results['detections'], frame)
                
                frame_count += 1
            except Exception as e:
                print(f"Error in process loop: {e}")
                import time
                time.sleep(1)

    def _handle_detections(self, detections, frame):
        try:
            db_entries = []
            for det in detections:
                db_entries.append({
                    'camera_id': self.camera_id,
                    'confidence': det['confidence'],
                    'x': det['x'],
                    'y': det['y'],
                    'width': det['width'],
                    'height': det['height'],
                    'created_at': datetime.now(timezone.utc).isoformat()
                })
            
            # Store detections for the polling endpoint (OUTSIDE the loop)
            self.latest_detections = db_entries
            
            if db_entries:
                supabase.table('detections').insert(db_entries).execute()
        except Exception as e:
            print(f"Error storing detections for {self.camera_id}: {e}")

    def stop(self):
        self.is_running = False
        if self.cap:
            self.cap.release()

@app.route('/api/detect-face', methods=['POST'])
def detect_face():
    try:
        data = request.json
        image_source = data.get('image')
        if not image_source:
            return jsonify({'error': 'No image provided'}), 400
        result = detector.detect_faces(image_source)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/process-rtsp', methods=['POST'])
def process_rtsp():
    try:
        data = request.json
        camera_id = data.get('camera_id')
        rtsp_url = data.get('rtsp_url')
        
        if not camera_id or not rtsp_url:
            return jsonify({'error': 'camera_id and rtsp_url are required'}), 400
        
        if camera_id in active_processors and active_processors[camera_id].is_running:
            return jsonify({'status': 'already_processing', 'camera_id': camera_id})
        
        processor = RTSPStreamProcessor(camera_id, secure_rtsp_url(rtsp_url))
        processor.start()
        active_processors[camera_id] = processor
        
        return jsonify({
            'status': 'started',
            'camera_id': camera_id,
            'message': f'Started processing stream for {camera_id}'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stop-rtsp', methods=['POST'])
def stop_rtsp():
    try:
        data = request.json
        camera_id = data.get('camera_id')
        
        if not camera_id:
            return jsonify({'error': 'camera_id is required'}), 400
        
        if camera_id in active_processors:
            active_processors[camera_id].stop()
            del active_processors[camera_id]
            return jsonify({'status': 'stopped', 'camera_id': camera_id})
        
        return jsonify({'error': 'No active processor for this camera'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/detections/<camera_id>', methods=['GET'])
def get_detections(camera_id):
    # The frontend might send either the UUID (camera.id) or the cam-00x (camera.camera_id)
    # We should look in our processors to see which one we have
    proc = active_processors.get(camera_id)
    
    # If not found, try searching by camera_id property in objects
    if not proc:
        for p in active_processors.values():
            if p.camera_id == camera_id:
                proc = p
                break

    if proc:
        return jsonify({
            'camera_id': camera_id,
            'detections': getattr(proc, 'latest_detections', []),
            'timestamp': datetime.now(timezone.utc).isoformat()
        })
    return jsonify({'error': 'No active processor', 'detections': [], 'id_searched': camera_id}), 404

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'AI service running',
        'active_streams': len(active_processors)
    })

@app.route('/api/snapshot/<camera_id>')
def snapshot_camera(camera_id):
    """Return a single JPEG frame - no persistent connection needed"""
    from flask import Response
    
    if camera_id not in active_processors:
        # Try to auto-start from database
        try:
            camera_data = supabase.table('cameras').select('rtsp_url').eq('id', camera_id).single().execute()
            if camera_data.data and camera_data.data['rtsp_url']:
                rtsp_url = secure_rtsp_url(camera_data.data['rtsp_url'])
                processor = RTSPStreamProcessor(camera_id, rtsp_url)
                processor.start()
                active_processors[camera_id] = processor
                # Give it a moment to capture first frame
                import time
                time.sleep(0.5)
            else:
                return Response(status=404)
        except Exception as e:
            return Response(str(e), status=500)

    processor = active_processors.get(camera_id)
    if processor and hasattr(processor, 'latest_frame') and processor.latest_frame is not None:
        ret, buffer = cv2.imencode('.jpg', processor.latest_frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
        if ret:
            return Response(buffer.tobytes(), mimetype='image/jpeg', 
                          headers={'Cache-Control': 'no-cache, no-store'})
    
    # Return a 1x1 transparent pixel if no frame yet
    return Response(status=204)

@app.route('/api/stream/<camera_id>')
def stream_camera(camera_id):
    if camera_id not in active_processors:
        # Try to start it if it's not running but we have the URL in the database
        try:
            camera_data = supabase.table('cameras').select('rtsp_url').eq('id', camera_id).single().execute()
            if camera_data.data and camera_data.data['rtsp_url']:
                processor = RTSPStreamProcessor(camera_id, camera_data.data['rtsp_url'])
                processor.start()
                active_processors[camera_id] = processor
            else:
                return "Camera not found or no RTSP URL", 404
        except Exception as e:
            return str(e), 500

    def generate():
        processor = active_processors[camera_id]
        import time
        while True:
            # Use the latest frame captured by the background thread
            if hasattr(processor, 'latest_frame') and processor.latest_frame is not None:
                # Encode frame as JPEG
                ret, buffer = cv2.imencode('.jpg', processor.latest_frame)
                if not ret:
                    time.sleep(0.03)
                    continue
                
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
                
                # Limit to ~30 FPS
                time.sleep(0.03)
            else:
                time.sleep(0.1)

    return app.response_class(generate(), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5005, threaded=True, debug=False)

