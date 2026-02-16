
-- Feature 3: Add about_text column to tracks table
ALTER TABLE public.tracks ADD COLUMN about_text TEXT;

-- Feature 4: Create mix_tracklist_links table
CREATE TABLE public.mix_tracklist_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracklist_entry_id UUID NOT NULL REFERENCES public.mix_tracklists(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tracklist_links_entry_id ON public.mix_tracklist_links(tracklist_entry_id);

-- Enable RLS
ALTER TABLE public.mix_tracklist_links ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Tracklist links are publicly readable"
ON public.mix_tracklist_links
FOR SELECT
USING (true);

-- Deny direct writes (admin via edge functions)
CREATE POLICY "No direct insert on mix_tracklist_links"
ON public.mix_tracklist_links
FOR INSERT
WITH CHECK (false);

CREATE POLICY "No direct update on mix_tracklist_links"
ON public.mix_tracklist_links
FOR UPDATE
USING (false);

CREATE POLICY "No direct delete on mix_tracklist_links"
ON public.mix_tracklist_links
FOR DELETE
USING (false);
