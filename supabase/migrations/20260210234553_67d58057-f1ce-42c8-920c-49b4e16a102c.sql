ALTER TABLE public.tracks
  ADD COLUMN published_date date DEFAULT CURRENT_DATE;

-- Backfill existing rows from created_at
UPDATE public.tracks SET published_date = (created_at AT TIME ZONE 'UTC')::date;