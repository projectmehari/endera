
-- Create tracks table
CREATE TABLE public.tracks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL DEFAULT 'Unknown',
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  file_url TEXT NOT NULL,
  play_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS (public read, no public write)
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;

-- Anyone can read tracks
CREATE POLICY "Tracks are publicly readable"
  ON public.tracks FOR SELECT
  USING (true);

-- Create station_config table
CREATE TABLE public.station_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  station_name TEXT NOT NULL DEFAULT 'My Radio Station',
  playlist_started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.station_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Station config is publicly readable"
  ON public.station_config FOR SELECT
  USING (true);

-- Insert default config
INSERT INTO public.station_config (station_name) VALUES ('Internet Radio');

-- Create storage bucket for MP3 files
INSERT INTO storage.buckets (id, name, public) VALUES ('tracks', 'tracks', true);

-- Storage policies: anyone can read, no public upload
CREATE POLICY "Track files are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'tracks');

-- Allow uploads via service role (edge function will handle admin upload)
CREATE POLICY "Service role can upload tracks"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'tracks');

CREATE POLICY "Service role can delete tracks"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'tracks');
