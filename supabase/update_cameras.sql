-- 1. Ensure camera_id has a unique constraint so ON CONFLICT works in the future
-- This might fail if you already have a constraint, which is fine.
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cameras_camera_id_key') THEN
        ALTER TABLE cameras ADD CONSTRAINT cameras_camera_id_key UNIQUE (camera_id);
    END IF;
END $$;

-- 2. Update existing cameras with their RTSP URLs
UPDATE cameras 
SET rtsp_url = 'rtsp://operator:smart1976@snap-dartford.dyndns.org:554/Streaming/Channels/101'
WHERE camera_id = 'CAM_01';

UPDATE cameras 
SET rtsp_url = 'rtsp://operator:smart1976@snap-dartford.dyndns.org:554/Streaming/Channels/201'
WHERE camera_id = 'CAM_02';

UPDATE cameras 
SET rtsp_url = 'rtsp://operator:smart1976@snap-dartford.dyndns.org:554/Streaming/Channels/301'
WHERE camera_id = 'CAM_03';

UPDATE cameras 
SET rtsp_url = 'rtsp://operator:smart1976@snap-dartford.dyndns.org:554/Streaming/Channels/401'
WHERE camera_id = 'CAM_04';

UPDATE cameras 
SET rtsp_url = 'rtsp://operator:smart1976@snap-dartford.dyndns.org:554/Streaming/Channels/501'
WHERE camera_id = 'CAM_05';

UPDATE cameras 
SET rtsp_url = 'rtsp://operator:smart1976@snap-dartford.dyndns.org:554/Streaming/Channels/601'
WHERE camera_id = 'CAM_06';

-- 3. Insert or Update cameras 7 and 8
-- Using a data-safe way that doesn't rely on the constraint immediately
INSERT INTO cameras 
(id, organization_id, camera_id, name, rtsp_url, camera_type, zone, status, enable_face_recognition, created_at, updated_at)
VALUES 
(gen_random_uuid(), '4f5a3104-f5ea-44e5-88be-0ebe205b0a37', 'CAM_07', 'Camera 7', 
'rtsp://operator:smart1976@snap-dartford.dyndns.org:554/Streaming/Channels/701', 'hikvision', 'zone7', 'online', true, NOW(), NOW()),
(gen_random_uuid(), '4f5a3104-f5ea-44e5-88be-0ebe205b0a37', 'CAM_08', 'Camera 8', 
'rtsp://operator:smart1976@snap-dartford.dyndns.org:554/Streaming/Channels/801', 'hikvision', 'zone8', 'online', true, NOW(), NOW())
ON CONFLICT (camera_id) DO UPDATE 
SET rtsp_url = EXCLUDED.rtsp_url, 
    status = EXCLUDED.status,
    updated_at = NOW();
