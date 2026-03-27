-- Cleanup and Synchronization for all 14 SNAP Dartford Cameras
-- This script replaces the mixed cam-00x / CAM_XX IDs into a clean 1-14 set.

-- 1. First, ensure the 8 original CAM_XX records have the right URLs
UPDATE cameras SET rtsp_url = 'rtsp://operator:smart1976@snap-dartford.dyndns.org:554/Streaming/Channels/101' WHERE camera_id = 'CAM_01';
UPDATE cameras SET rtsp_url = 'rtsp://operator:smart1976@snap-dartford.dyndns.org:554/Streaming/Channels/201' WHERE camera_id = 'CAM_02';
UPDATE cameras SET rtsp_url = 'rtsp://operator:smart1976@snap-dartford.dyndns.org:554/Streaming/Channels/301' WHERE camera_id = 'CAM_03';
UPDATE cameras SET rtsp_url = 'rtsp://operator:smart1976@snap-dartford.dyndns.org:554/Streaming/Channels/401' WHERE camera_id = 'CAM_04';
UPDATE cameras SET rtsp_url = 'rtsp://operator:smart1976@snap-dartford.dyndns.org:554/Streaming/Channels/501' WHERE camera_id = 'CAM_05';
UPDATE cameras SET rtsp_url = 'rtsp://operator:smart1976@snap-dartford.dyndns.org:554/Streaming/Channels/601' WHERE camera_id = 'CAM_06';
UPDATE cameras SET rtsp_url = 'rtsp://operator:smart1976@snap-dartford.dyndns.org:554/Streaming/Channels/701' WHERE camera_id = 'CAM_07';
UPDATE cameras SET rtsp_url = 'rtsp://operator:smart1976@snap-dartford.dyndns.org:554/Streaming/Channels/801' WHERE camera_id = 'CAM_08';

-- 2. Add the missing 6 cameras (9-14)
-- Replace YOUR_ORG_ID with the actual organization_id from your CAM_01 record
INSERT INTO cameras (camera_id, name, rtsp_url, camera_type, zone, status, organization_id)
SELECT 'CAM_09', 'Camera 9', 'rtsp://operator:smart1976@snap-dartford.dyndns.org:554/Streaming/Channels/901', 'hikvision', 'gym', 'online', organization_id FROM cameras WHERE camera_id = 'CAM_01' 
ON CONFLICT (camera_id) DO UPDATE SET rtsp_url = EXCLUDED.rtsp_url;

INSERT INTO cameras (camera_id, name, rtsp_url, camera_type, zone, status, organization_id)
SELECT 'CAM_10', 'Camera 10', 'rtsp://operator:smart1976@snap-dartford.dyndns.org:554/Streaming/Channels/1001', 'hikvision', 'gym', 'online', organization_id FROM cameras WHERE camera_id = 'CAM_01' 
ON CONFLICT (camera_id) DO UPDATE SET rtsp_url = EXCLUDED.rtsp_url;

INSERT INTO cameras (camera_id, name, rtsp_url, camera_type, zone, status, organization_id)
SELECT 'CAM_11', 'Camera 11', 'rtsp://operator:smart1976@snap-dartford.dyndns.org:554/Streaming/Channels/1101', 'hikvision', 'gym', 'online', organization_id FROM cameras WHERE camera_id = 'CAM_01' 
ON CONFLICT (camera_id) DO UPDATE SET rtsp_url = EXCLUDED.rtsp_url;

INSERT INTO cameras (camera_id, name, rtsp_url, camera_type, zone, status, organization_id)
SELECT 'CAM_12', 'Camera 12', 'rtsp://operator:smart1976@snap-dartford.dyndns.org:554/Streaming/Channels/1201', 'hikvision', 'gym', 'online', organization_id FROM cameras WHERE camera_id = 'CAM_01' 
ON CONFLICT (camera_id) DO UPDATE SET rtsp_url = EXCLUDED.rtsp_url;

INSERT INTO cameras (camera_id, name, rtsp_url, camera_type, zone, status, organization_id)
SELECT 'CAM_13', 'Camera 13', 'rtsp://operator:smart1976@snap-dartford.dyndns.org:554/Streaming/Channels/1301', 'hikvision', 'gym', 'online', organization_id FROM cameras WHERE camera_id = 'CAM_01' 
ON CONFLICT (camera_id) DO UPDATE SET rtsp_url = EXCLUDED.rtsp_url;

INSERT INTO cameras (camera_id, name, rtsp_url, camera_type, zone, status, organization_id)
SELECT 'CAM_14', 'Camera 14', 'rtsp://operator:smart1976@snap-dartford.dyndns.org:554/Streaming/Channels/1401', 'hikvision', 'gym', 'online', organization_id FROM cameras WHERE camera_id = 'CAM_01' 
ON CONFLICT (camera_id) DO UPDATE SET rtsp_url = EXCLUDED.rtsp_url;

-- 3. Delete the redundant duplicate 'cam-00x' records
DELETE FROM cameras WHERE camera_id LIKE 'cam-00%';
