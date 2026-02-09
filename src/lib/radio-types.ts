export interface Track {
  id: string;
  title: string;
  artist: string;
  duration_seconds: number;
  file_url: string;
  play_order: number;
  created_at: string;
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
