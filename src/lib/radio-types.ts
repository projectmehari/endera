export interface Track {
  id: string;
  title: string;
  artist: string;
  duration_seconds: number;
  file_url: string;
  play_order: number;
  artwork_url: string | null;
  created_at: string;
  published_date: string | null;
  about_text: string | null;
}

export interface StationConfig {
  id: string;
  station_name: string;
  playlist_started_at: string;
  updated_at: string;
}

export interface NowPlayingResponse {
  now_playing: Track | null;
  up_next: Track[];
  elapsed_seconds: number;
  total_tracks: number;
}

export interface Mix {
  id: string;
  title: string;
  artist: string;
  artwork_url: string;
  file_url: string;
  duration_seconds: number;
  description: string | null;
  display_order: number;
  created_at: string;
}

export interface MixTracklistEntry {
  id: string;
  mix_id: string;
  position: number;
  track_title: string;
  track_artist: string;
  timestamp_label: string | null;
  created_at: string;
}

export interface TracklistLink {
  id: string;
  tracklist_entry_id: string;
  service_type: string;
  url: string;
  created_at: string;
}

export interface TrackGenre {
  id: string;
  track_id: string;
  genre: string;
  created_at: string;
}
