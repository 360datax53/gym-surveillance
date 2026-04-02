-- Create heatmap_data table for aggregated person-count data by zone/camera
-- Populated every 10 minutes by the /api/analytics/heatmap-aggregate cron endpoint

CREATE TABLE IF NOT EXISTS public.heatmap_data (
  id              uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid          NOT NULL,
  camera_id       text          NOT NULL,
  zone            text          NOT NULL DEFAULT 'full_frame',
  time_bucket     timestamptz   NOT NULL,
  person_count    integer       NOT NULL DEFAULT 0,
  peak_count      integer       NOT NULL DEFAULT 0,
  avg_confidence  numeric(5,4)  DEFAULT 0,
  created_at      timestamptz   DEFAULT now()
);

-- Efficient lookups by org + time window (used by the GET heatmap API)
CREATE INDEX IF NOT EXISTS idx_heatmap_data_org_time
  ON public.heatmap_data (organization_id, time_bucket DESC);

-- Efficient lookups by org + zone for zone-level analytics
CREATE INDEX IF NOT EXISTS idx_heatmap_data_org_zone_time
  ON public.heatmap_data (organization_id, zone, time_bucket DESC);
