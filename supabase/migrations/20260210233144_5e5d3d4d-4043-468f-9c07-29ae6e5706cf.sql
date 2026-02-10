
ALTER TABLE public.mix_tracklists DROP CONSTRAINT mix_tracklists_mix_id_fkey;
ALTER TABLE public.mix_tracklists ADD CONSTRAINT mix_tracklists_mix_id_fkey FOREIGN KEY (mix_id) REFERENCES public.tracks(id) ON DELETE CASCADE;
