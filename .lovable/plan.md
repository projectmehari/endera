

# 🎙️ Internet Radio Station

A retro-styled internet radio player that continuously streams your MP3 collection to listeners, with a simple admin area for managing tracks.

## 1. Listener Experience — Radio Player Page

The main page is a **retro/skeuomorphic radio player** with warm textures, analog-style elements, and vintage typography:

- **Now Playing display** showing the current track's title and artist
- **Play/Stop button** to tune in or out of the stream
- **Up Next section** showing the upcoming tracks in the queue
- **Retro design elements**: textured background, embossed panels, warm color palette reminiscent of vintage radio equipment

The player auto-plays through a server-managed playlist in order, simulating a live radio broadcast. All listeners hear the same sequence of tracks.

## 2. Backend — Lovable Cloud + Supabase Storage

- **Supabase Storage** bucket for hosting MP3 files
- **Database table** (`tracks`) storing track metadata: title, artist, duration, file URL, and play order
- **Database table** (`station_config`) for station settings like station name and current queue position
- **Edge function** to serve the "now playing" and "up next" info based on a server-side schedule/clock

## 3. Admin Area — Track Management

A **password-gated admin page** (simple shared password, no full auth system):

- **Upload MP3 files** to Supabase Storage with title and artist fields
- **Track list** showing all uploaded tracks with ability to reorder, edit metadata, or delete
- **Queue management** to arrange the playlist order

## 4. Pages & Navigation

- `/` — The radio player (listener-facing)
- `/admin` — Password-protected track management dashboard
- Minimal navigation — the player page is the star, with a subtle link to admin

