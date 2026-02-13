# endera.fm — Master Plan

## Vision

**endera.fm** is an experimental continuous audio transmission platform — a web-based radio station delivering curated ambient, electronic, and experimental sound experiences. Inspired by platforms like [door.link](https://door.link) and NTS Radio, it emphasizes passive listening with an always-on, looping broadcast.

---

## Core Concept

A **server-clock synchronized playlist** loops continuously. Every listener hears the same track at the same position — like tuning into a real radio station. Alongside live radio, users can browse the full archive, select individual mixes, read tracklists, and download audio files.

---

## Current State (as of Feb 2026)

### What Has Been Built

#### 1. Live Radio Engine
- Server-clock based playback synchronization via the `now-playing` edge function
- Playlist loops infinitely based on `station_config.playlist_started_at` timestamp
- Tracks ordered by `play_order`, elapsed time calculated from server clock
- Auto-play on page load with browser autoplay fallback
- "Up Next" queue (next 5 tracks, wrapping around)
- Live status indicator (TRANSMITTING / STANDBY)

#### 2. Dual Playback System
- **Live mode**: Synchronized radio stream — all listeners hear the same thing
- **Mix mode**: On-demand playback of any archived mix from the library
- Seamless switching between modes via `AudioPlayerContext`
- When a mix ends, playback automatically returns to live radio
- Seek (±10s), volume control, progress scrubbing

#### 3. Sticky Player Bar (`LiveBar`)
- Persistent playback controls pinned to top of every page
- Shows: artwork thumbnail, track title, artist, elapsed/total time
- Seekable progress slider, play/pause, volume slider
- "← LIVE" button to return to radio mode from mix mode
- Admin-only skip button (visible when authenticated)

#### 4. Homepage (`Index`)
- About section with station description and social links (Instagram, Are.na)
- "LATEST TRACKS" archive list (`MixFeed` → `MixCard` rows)
- Hover effect: artwork color extraction tints full-page overlay
- Duration probing: loads audio metadata to show accurate durations
- Click-to-open dialog with full mix details

#### 5. Mix Detail System
- **Dialog popup** (from homepage/explore): artwork, title, artist, tracklist, play + download buttons
- **Dedicated page** (`/mix/:artist/:title`): shareable URL with slug-based routing
- Shared `MixDetailContent` component powers both views
- Tracklist fetched from `mix_tracklists` table with timestamps
- "Featuring" line auto-generated from tracklist artists
- Download button triggers browser download of original audio file
- Permalink from dialog to dedicated page

#### 6. Explore Page
- Genre-based filtering with AND logic (tracks must match ALL selected genres)
- Genre tag cloud with search/filter
- Grid layout with artwork, duration badge, genre tags, playing indicator
- Click-to-open dialog (same as homepage)
- All genres sourced from `track_genres` join table

#### 7. Real-Time Chat
- Floating chat widget (bottom-right corner)
- Username persistence via localStorage
- 280-character message limit with rate limiting (5s cooldown via DB trigger)
- Real-time message delivery via Supabase Realtime (postgres_changes)
- Unread indicator dot, auto-scroll, "NEW" badge for missed messages
- Admin messages highlighted with red left border (username "endera")

#### 8. Admin Dashboard (`/admin`)
- Password-gated access with HMAC-SHA256 JWT authentication
- **Track Management**: Upload MP3 + artwork, set title/artist/genres/date
- **Upload progress**: XHR-based upload with progress bar
- **Edit tracks**: Inline editing of title, artist, artwork, genres
- **Reorder tracks**: Move up/down in play order
- **Delete tracks**: With confirmation
- **Tracklist editor**: Add/edit/delete timestamped tracklist entries per mix
- **Genre tagging**: NTS-inspired genre palette with quick-add buttons
- **Chat moderation**: View recent messages, delete individual messages
- **PWA toggle**: Enable/disable progressive web app install prompt
- **Sort toggle**: Switch between ascending/descending date order

#### 9. PWA Support
- Service worker with offline capability
- Install page (`/install`) with platform-specific instructions
- PWA manifest with custom icons (192×192, 512×512)
- Configurable via admin dashboard

#### 10. Tools Page
- Placeholder page for future tools/utilities
- "Coming Soon" state

---

## Architecture

### Frontend
```
src/
├── pages/          → Index, Explore, Admin, MixDetail, Tools, Install, NotFound
├── components/     → SiteHeader, LiveBar, LiveChat, MixCard, MixFeed,
│                     MixDetailContent, AboutSection, RadioPlayer, LiveClock,
│                     SiteFooter, TracklistDialog, NavLink
├── contexts/       → AudioPlayerContext (global playback state)
├── hooks/          → useNowPlaying, useMixes, useGenres, useChatMessages
├── lib/            → radio-types.ts, utils.ts (slugify, cn)
└── index.css       → Design system tokens + custom component classes
```

### Backend (Edge Functions)
```
supabase/functions/
├── now-playing/       → Calculate current track from server clock
├── skip-track/        → Admin: skip to next track
├── admin-auth/        → Password → HMAC JWT authentication
├── admin-upload/      → Upload new track with metadata + genres
├── admin-delete-track/→ Remove track and associated data
├── admin-update-track/→ Edit title, artist, artwork, genres, date
├── admin-reorder/     → Swap play_order between two tracks
├── admin-tracklist/   → CRUD operations on mix tracklist entries
├── admin-update-config/→ Update station settings (PWA toggle, etc.)
└── admin-delete-chat/ → Delete chat messages (moderation)
```

### Database Schema
```
tracks              → Core track/mix data (title, artist, file_url, artwork_url, duration, play_order, published_date)
track_genres        → Many-to-many genre tagging (track_id → genre string)
mix_tracklists      → Timestamped tracklist entries per mix (position, track_artist, track_title, timestamp_label)
chat_messages       → Real-time chat (username, message, created_at) with rate-limit trigger
station_config      → Global config (playlist_started_at, station_name, pwa_enabled)
mixes               → Legacy table (superseded by tracks)
```

### Storage Buckets
- `tracks` — MP3 audio files (public)
- `artwork` — Cover art images (public)

---

## Security Model

- **All write operations** routed through edge functions using `service_role` key
- **Client-side RLS**: Explicit deny-all for INSERT/UPDATE/DELETE on all tables
- **SELECT**: Public read access on all content tables
- **Admin auth**: Shared password → HMAC-SHA256 JWT with 1-hour expiry
- **Edge functions**: `verify_jwt = false` (custom HMAC validation instead)
- **Chat rate limiting**: Database trigger prevents messages within 5 seconds
- **Chat validation**: RLS policy enforces message length (1-280) and username length (1-20)
- **Generic error responses**: Edge functions return safe messages, log details server-side

---

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Homepage — live player, about, archive list |
| `/explore` | Genre-filtered track browser |
| `/mix/:artist/:title` | Shareable mix detail page |
| `/admin` | Password-protected management console |
| `/tools` | Future tools (placeholder) |
| `/install` | PWA installation instructions |
| `*` | 404 Not Found |

---

## Design Philosophy

**"Scientific instrument" aesthetic** — the UI resembles lab equipment readouts and receipt printers:
- Monospaced typography: JetBrains Mono (body) + Space Mono (labels)
- Warm off-white background (`60 10% 95%` HSL), near-black foreground
- Zero border-radius throughout
- Custom CSS classes: `meter-panel`, `meter-inset`, `meter-label`, `meter-value`, `meter-dot-active`, `receipt-tear`, `receipt-line`
- Pulsing red status indicator for live/active states
- Minimal color palette — content speaks through typography and layout

---

## What's Next (Potential)

- [ ] Tools page implementation (BPM counter, key finder, etc.)
- [ ] Search across all tracks (title, artist)
- [ ] User favorites / listening history
- [ ] Scheduled programming / time-based shows
- [ ] RSS feed for new uploads
- [ ] Social sharing (OG tags per mix)
- [ ] Analytics dashboard (plays, listeners)
- [ ] Mobile-optimized player experience
- [ ] Keyboard shortcuts for playback
