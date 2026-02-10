
-- Add artwork_url column to tracks table
ALTER TABLE public.tracks ADD COLUMN artwork_url text DEFAULT NULL;

-- Create artwork storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('artwork', 'artwork', true);

-- Allow public read access to artwork bucket
CREATE POLICY "Artwork images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'artwork');

-- Allow uploads to artwork bucket (using anon key since admin-verified via edge function)
CREATE POLICY "Anyone can upload artwork"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'artwork');
