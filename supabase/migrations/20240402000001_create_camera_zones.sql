-- camera_zones: stores named polygon zones drawn on camera frames
-- Coordinates stored as JSONB array of {x, y} normalized to 0.0–1.0

CREATE TABLE IF NOT EXISTS public.camera_zones (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid        NOT NULL,
  camera_id       uuid        NOT NULL REFERENCES public.cameras(id) ON DELETE CASCADE,
  zone_name       text        NOT NULL,
  polygon_coords  jsonb       NOT NULL DEFAULT '[]',
  color           text        NOT NULL DEFAULT '#3b82f6',
  is_active       boolean     NOT NULL DEFAULT true,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_camera_zones_camera
  ON public.camera_zones (camera_id);

CREATE INDEX IF NOT EXISTS idx_camera_zones_org
  ON public.camera_zones (organization_id);
