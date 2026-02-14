
ALTER TABLE public.station_config
ADD COLUMN show_instagram boolean NOT NULL DEFAULT true,
ADD COLUMN show_arena boolean NOT NULL DEFAULT true;
