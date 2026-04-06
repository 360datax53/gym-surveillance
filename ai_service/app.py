import os
import threading
import cv2
import requests
import json
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

print(f"Supabase URL configured: {'Yes' if supabase_url else 'No'}", flush=True)
if not supabase_url or not supabase_key:
    print("FATAL ERROR: Supabase credentials missing from .env", flush=True)

supabase: Client = create_client(supabase_url, supabase_key)

def update_ai_host():
    """Detect local IP (or use public tunnel) and update Supabase for zero-config connectivity."""
    import socket
    try:
        # 1. Prioritize a manually set public URL (e.g. from Ngrok)
        public_url = os.environ.get("PUBLIC_AI_URL")
        
        replit_domain = os.environ.get("REPLIT_DEV_DOMAIN")
        if replit_domain:
            host_to_save = replit_domain
            print(f"Using Replit Domain: {host_to_save}", flush=True)
        elif public_url:
            host_to_save = public_url.replace("http://", "").replace("https://", "").split(":")[0]
            print(f"Using Public Tunnel Host: {host_to_save}", flush=True)
        else:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            host_to_save = s.getsockname()[0]
            s.close()
            print(f"Auto-detected Local IP: {host_to_save}", flush=True)
        
        # Update Supabase (requires system_configs table)
        supabase.table('system_configs').upsert({
            'key': 'ai_service_host',
            'value': host_to_save,
            'updated_at': datetime.now(timezone.utc).isoformat()
        }).execute()
        print(f"Successfully updated AI host ({host_to_save}) in Supabase.", flush=True)
    except Exception as e:
        print(f"Note: Could not auto-update AI host in Supabase: {e}", flush=True)

# Run auto-discovery on startup
update_ai_host()

def migrate_encodings_on_startup():
    """
    On startup, detect any stored face encodings that are incompatible with
    the current InsightFace model (buffalo_sc produces 512-dim ArcFace vectors).
    Stale encodings (e.g. 128-dim from old DeepFace Facenet) are cleared so
    members can be re-enrolled via the dashboard instead of silently never matching.
    """
    EXPECTED_DIM = 512
    try:
        res = supabase.table('members').select('id, name, face_encoding').not_.is_('face_encoding', 'null').execute()
        if not res.data:
            print("No stored face encodings found — nothing to migrate.", flush=True)
            return

        stale_ids = []
        import json as _json
        for m in res.data:
            raw_enc = m.get('face_encoding')
            try:
                if isinstance(raw_enc, str) and raw_enc.strip():
                    if raw_enc.startswith('\\x'):
                        hex_data = raw_enc[2:]
                        enc = _json.loads(bytes.fromhex(hex_data).decode('utf-8'))
                    else:
                        enc = _json.loads(raw_enc)
                else:
                    enc = raw_enc
                if isinstance(enc, list) and len(enc) != EXPECTED_DIM:
                    stale_ids.append(m['id'])
                    print(
                        f"⚠ Member '{m['name']}' has a {len(enc)}-dim encoding "
                        f"(expected {EXPECTED_DIM}-dim). Clearing for re-enrollment.",
                        flush=True
                    )
            except Exception:
                pass

        if stale_ids:
            for member_id in stale_ids:
                supabase.table('members').update({'face_encoding': None}).eq('id', member_id).execute()
            print(
                f"Migration complete: cleared {len(stale_ids)} stale encoding(s). "
                "Affected members must be re-enrolled via the dashboard.",
                flush=True
            )
        else:
            print(f"All stored encodings are {EXPECTED_DIM}-dim — no migration needed.", flush=True)
    except Exception as e:
        print(f"Note: Could not run encoding migration on startup: {e}", flush=True)

# Migrate stale encodings on startup (incompatible DeepFace -> InsightFace transition)
migrate_encodings_on_startup()

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
        self.organization_id = None
        self.zone = None
        self.current_bucket_str = None
        self.current_bucket_max = 0

    def start(self):
        if self.is_running:
            return

        self.is_running = True
        self.thread = threading.Thread(target=self._connect_and_process, daemon=True)
        self.thread.start()
        print(f"Queued RTSP processor for camera {self.camera_id}")

    def _connect_and_process(self):
        import time
        try:
            cam_data = supabase.table('cameras').select('organization_id, zone').eq('id', self.camera_id).single().execute()
            if cam_data.data:
                self.organization_id = cam_data.data.get('organization_id')
                self.zone = cam_data.data.get('zone')
        except Exception as e:
            print(f"Error fetching camera metadata for {self.camera_id}: {e}")

        os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp|hwaccel;none|probesize;5000000|analyzeduration;5000000"

        # Retry RTSP connection up to 3 times (network may be slow)
        for attempt in range(3):
            self.cap = cv2.VideoCapture(self.rtsp_url, cv2.CAP_FFMPEG)
            if self.cap.isOpened():
                break
            print(f"RTSP connect attempt {attempt + 1} failed for {self.camera_id}, retrying...")
            time.sleep(2)

        if not self.cap or not self.cap.isOpened():
            print(f"FAILED to connect to RTSP after retries: {self.camera_id}")
            self.is_running = False
            return

        self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        print(f"Connected to RTSP for camera {self.camera_id}")
        self._process_loop()

    def _process_loop(self):
        frame_count = 0
        last_member_fetch = 0
        known_members = []
        import time

        while self.is_running:
            try:
                # Refresh known members every 60 seconds
                current_time = time.time()
                if current_time - last_member_fetch > 60:
                    try:
                        res = supabase.table('members').select('id, name, face_encoding').not_.is_('face_encoding', 'null').execute()
                        print(f"Fetch results: {len(res.data)} records found in Supabase with encodings.", flush=True)
                        if res.data:
                            import json
                            known_members = []
                            for m in res.data:
                                try:
                                    raw_enc = m['face_encoding']
                                    if isinstance(raw_enc, str) and raw_enc.strip():
                                        # Handle hex-encoded strings from Supabase (starts with \x)
                                        if raw_enc.startswith('\\x'):
                                            try:
                                                # Convert hex to bytes, then to string
                                                hex_data = raw_enc[2:]
                                                enc_str = bytes.fromhex(hex_data).decode('utf-8')
                                                enc = json.loads(enc_str)
                                            except Exception as hex_err:
                                                print(f"Hex decode failed for {m['name']}: {hex_err}", flush=True)
                                                enc = raw_enc
                                        else:
                                            enc = json.loads(raw_enc)
                                    else:
                                        enc = raw_enc
                                        
                                    if isinstance(enc, list):
                                        known_members.append({
                                            'member_id': m['id'],
                                            'name': m['name'],
                                            'encoding': enc
                                        })
                                    else:
                                        print(f"Warning: face_encoding for {m['name']} is not a list: {type(enc)}", flush=True)
                                except Exception as e:
                                    print(f"Error parsing face_encoding for {m['name']}: {e}", flush=True)
                            print(f"Refreshed known members: {len(known_members)} members with encodings loaded.", flush=True)
                        last_member_fetch = current_time
                    except Exception as e:
                        print(f"Error fetching members: {e}", flush=True)

                if not self.cap or not self.cap.isOpened():
                    time.sleep(1)
                    continue

                ret, frame = self.cap.read()
                if not ret:
                    self.cap.release()
                    self.cap = cv2.VideoCapture(self.rtsp_url, cv2.CAP_FFMPEG)
                    time.sleep(1)
                    continue
                
                self.latest_frame = frame
                
                if frame_count % 10 == 0:
                    results = detector.detect_faces(frame)
                    if results['success']:
                        dets = results['detections']
                        
                        # Process face recognition
                        for det in dets:
                            if det.get('type') == 'face' and known_members:
                                print(f"Attempting encoding for face in camera {self.camera_id}...", flush=True)
                                enc_res = detector.extract_face_encoding(frame, det)
                                if enc_res.get('success'):
                                    match = detector.match_member(enc_res['encoding'], known_members, threshold=0.50)
                                    if match:
                                        print(f"MATCH FOUND: {match['name']} in camera {self.camera_id} (conf: {match['confidence']})", flush=True)
                                        det['matched_name'] = match['name']
                                        det['match_confidence'] = match['confidence']
                                    else:
                                        print(f"No match found for detected face in camera {self.camera_id} (distance above threshold)", flush=True)
                                else:
                                    print(f"Encoding failed for face in camera {self.camera_id}: {enc_res.get('error')}", flush=True)

                        self.latest_detections = dets if results['face_count'] > 0 else []
                        if results['face_count'] > 0:
                            self._handle_detections(dets, frame)
                
                frame_count += 1
            except Exception as e:
                print(f"Error in process loop: {e}")
                time.sleep(1)

    def _handle_detections(self, detections, frame):
        try:
            for det in detections:
                # Prepare payload for the Next.js auto-alert API
                # This handles both DB insertion and real-time broadcasting
                payload = {
                    'organization_id': self.organization_id,
                    'camera_id': self.camera_id,
                    'person_name': det.get('matched_name', 'Unauthorized Subject'),
                    'member_id': det.get('member_id'),
                    'is_member': 'matched_name' in det,
                    'alert_type': 'staff_detected' if 'matched_name' in det else 'unknown_person',
                    'confidence': det['confidence'],
                    'location': self.zone or 'Gym Floor'
                }
                
                try:
                    resp = requests.post(
                        'http://localhost:5000/api/detections/auto-alert',
                        json=payload,
                        timeout=2
                    )
                    if not resp.ok:
                        print(f"Auto-alert API error: {resp.status_code} - {resp.text}", flush=True)
                except Exception as e:
                    print(f"Failed to call auto-alert API: {e}", flush=True)
            
            # Keep in-memory for the polling endpoint
            self.latest_detections = detections
            
        except Exception as e:
            print(f"Error handling detections for {self.camera_id}: {e}", flush=True)

        # Heatmap update logic
        try:
            if self.organization_id and self.zone:
                current_time = datetime.now(timezone.utc)
                minute = (current_time.minute // 15) * 15
                bucket_time = current_time.replace(minute=minute, second=0, microsecond=0)
                bucket_str = bucket_time.isoformat()
                
                current_faces = len(detections)
                
                if self.current_bucket_str != bucket_str:
                    self.current_bucket_str = bucket_str
                    self.current_bucket_max = current_faces
                    self._upsert_heatmap_data(bucket_str, current_faces)
                elif current_faces > self.current_bucket_max:
                    self.current_bucket_max = current_faces
                    self._upsert_heatmap_data(bucket_str, current_faces)
        except Exception as e:
            print(f"Error updating heatmap for {self.camera_id}: {e}")

    def _upsert_heatmap_data(self, bucket_str, count):
        if not self.organization_id:
            print(f"DEBUG: Skipping heatmap update for {self.camera_id} - missing organization_id", flush=True)
            return
        if not self.zone:
            print(f"DEBUG: Skipping heatmap update for {self.camera_id} - missing zone", flush=True)
            return
            
        try:
            print(f"DEBUG: Syncing heatmap for {self.camera_id} (Zone: {self.zone}, Count: {count}, Bucket: {bucket_str})", flush=True)
            # Check if bucket exists for this zone and org
            res = supabase.table('heatmap_data').select('id, person_count').eq('organization_id', self.organization_id).eq('zone', self.zone).eq('time_bucket', bucket_str).execute()
            
            if res.data and len(res.data) > 0:
                existing_id = res.data[0]['id']
                existing_count = res.data[0]['person_count'] or 0
                # Only update if the new count is a new peak for this bucket
                if count > existing_count:
                    print(f"DEBUG: Updating existing bucket {existing_id} with new peak: {count}", flush=True)
                    supabase.table('heatmap_data').update({'person_count': count}).eq('id', existing_id).execute()
                else:
                    print(f"DEBUG: Current count {count} is not higher than peak {existing_count}. Skipping update.", flush=True)
            else:
                # Create new bucket entry
                print(f"DEBUG: Creating new heatmap entry for {bucket_str} with count {count}", flush=True)
                supabase.table('heatmap_data').insert({
                    'organization_id': self.organization_id,
                    'zone': self.zone,
                    'time_bucket': bucket_str,
                    'person_count': count,
                    'camera_id': self.camera_id
                }).execute()
        except Exception as e:
            print(f"FAILED to upsert heatmap data for {self.camera_id}: {e}", flush=True)

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

@app.route('/api/encode-face', methods=['POST'])
def encode_face_endpoint():
    try:
        data = request.json if request.is_json else None
        
        if data and 'image' in data:
            # Handle base64 from Next.js API
            image_source = data.get('image')
            import base64, io
            from PIL import Image
            import numpy as np
            base64_data = image_source.split(',')[1] if ',' in image_source else image_source
            image_data = base64.b64decode(base64_data)
            
            import tempfile
            import os
            with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_file:
                temp_file.write(image_data)
                temp_path = temp_file.name
        elif 'image' in request.files:
            file = request.files['image']
            img_bytes = file.read()
            import tempfile
            import os
            with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_file:
                temp_file.write(img_bytes)
                temp_path = temp_file.name
        else:
            return jsonify({'error': 'No image provided'}), 400
            
        try:
            import cv2
            img_bgr = cv2.imread(temp_path)
            if img_bgr is None:
                return jsonify({'error': 'Could not decode image'}), 400

            faces = detector.face_analysis.get(img_bgr) if detector.face_analysis else []
            if not faces:
                return jsonify({'error': 'No face embedding could be generated'}), 400

            embedding = faces[0].embedding.tolist()
            return jsonify({
                'success': True,
                'encoding': embedding
            })
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)
                
    except Exception as e:
        import traceback
        traceback.print_exc()
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
    app.run(host='0.0.0.0', port=8000, threaded=True, debug=False)

