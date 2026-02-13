-- Explicit deny-all write policies for content tables
-- These tables are managed exclusively via admin-authenticated edge functions using service role

-- tracks: no direct writes
CREATE POLICY "No direct insert on tracks" ON public.tracks FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "No direct update on tracks" ON public.tracks FOR UPDATE TO anon, authenticated USING (false);
CREATE POLICY "No direct delete on tracks" ON public.tracks FOR DELETE TO anon, authenticated USING (false);

-- mixes: no direct writes
CREATE POLICY "No direct insert on mixes" ON public.mixes FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "No direct update on mixes" ON public.mixes FOR UPDATE TO anon, authenticated USING (false);
CREATE POLICY "No direct delete on mixes" ON public.mixes FOR DELETE TO anon, authenticated USING (false);

-- mix_tracklists: no direct writes
CREATE POLICY "No direct insert on mix_tracklists" ON public.mix_tracklists FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "No direct update on mix_tracklists" ON public.mix_tracklists FOR UPDATE TO anon, authenticated USING (false);
CREATE POLICY "No direct delete on mix_tracklists" ON public.mix_tracklists FOR DELETE TO anon, authenticated USING (false);

-- track_genres: no direct writes
CREATE POLICY "No direct insert on track_genres" ON public.track_genres FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "No direct update on track_genres" ON public.track_genres FOR UPDATE TO anon, authenticated USING (false);
CREATE POLICY "No direct delete on track_genres" ON public.track_genres FOR DELETE TO anon, authenticated USING (false);

-- station_config: no direct writes
CREATE POLICY "No direct insert on station_config" ON public.station_config FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "No direct update on station_config" ON public.station_config FOR UPDATE TO anon, authenticated USING (false);
CREATE POLICY "No direct delete on station_config" ON public.station_config FOR DELETE TO anon, authenticated USING (false);