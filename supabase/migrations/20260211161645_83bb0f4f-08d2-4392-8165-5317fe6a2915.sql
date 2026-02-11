CREATE TABLE public.track_genres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id uuid NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  genre text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(track_id, genre)
);

ALTER TABLE public.track_genres ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Track genres are publicly readable"
  ON public.track_genres FOR SELECT
  USING (true);