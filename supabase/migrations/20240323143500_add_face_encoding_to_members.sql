ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS face_encoding TEXT;

COMMENT ON COLUMN public.members.face_encoding IS 'DeepFace vector embedding stored as stringified JSON for identity matching.';
