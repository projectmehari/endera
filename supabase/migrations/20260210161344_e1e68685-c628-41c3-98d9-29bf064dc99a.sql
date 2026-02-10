
-- Create mixes table
CREATE TABLE public.mixes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  artist text NOT NULL DEFAULT 'Unknown',
  artwork_url text NOT NULL,
  file_url text NOT NULL,
  duration_seconds integer NOT NULL DEFAULT 0,
  description text,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mixes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mixes are publicly readable"
  ON public.mixes FOR SELECT
  USING (true);

-- Create mix_tracklists table
CREATE TABLE public.mix_tracklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mix_id uuid NOT NULL REFERENCES public.mixes(id) ON DELETE CASCADE,
  position integer NOT NULL,
  track_title text NOT NULL,
  track_artist text NOT NULL DEFAULT 'Unknown',
  timestamp_label text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mix_tracklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mix tracklists are publicly readable"
  ON public.mix_tracklists FOR SELECT
  USING (true);

-- Index for efficient tracklist lookups
CREATE INDEX idx_mix_tracklists_mix_id ON public.mix_tracklists(mix_id);
