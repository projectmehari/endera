# endera.fm — Implementation Reference

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | React 18 + TypeScript | UI framework |
| **Build** | Vite | Dev server + bundler |
| **Styling** | Tailwind CSS + custom CSS | Utility-first styling with design tokens |
| **UI Library** | shadcn/ui (Radix primitives) | Dialog, Slider, Input, Switch, Badge, Tabs, etc. |
| **State** | React Context (`AudioPlayerContext`) | Global playback state |
| **Data Fetching** | TanStack React Query v5 | Caching, refetching, query invalidation |
| **Routing** | React Router DOM v6 | Client-side routing |
| **Backend** | Lovable Cloud (Supabase) | Database, storage, edge functions, realtime |
| **Database** | PostgreSQL (via Supabase) | Relational data storage |
| **Auth** | Custom HMAC-SHA256 JWT | Admin authentication (no user auth) |
| **Realtime** | Supabase Realtime (postgres_changes) | Live chat message delivery |
| **Storage** | Supabase Storage | MP3 files + artwork images |
| **Edge Functions** | Deno (Supabase Edge Functions) | Server-side logic |
| **PWA** | vite-plugin-pwa | Service worker + install prompt |
| **Icons** | Lucide React | Icon library |
| **Date Utils** | date-fns | Relative timestamps in chat |
| **Deployment** | Lovable Cloud / Netlify | Hosting + CI/CD |

---

## Key Implementation Details

### 1. Server-Clock Radio Synchronization

The core innovation: **no streaming server needed**. All MP3s are static files in storage. The `now-playing` edge function calculates which track should be playing based on:

```
elapsed_total = (Date.now() - playlist_started_at) / 1000
position_in_playlist = elapsed_total % total_playlist_duration
```

It walks through tracks by `play_order`, accumulating durations until it finds the current track and elapsed position within it. The client sets `audio.currentTime = elapsed_seconds` on load.

**Files**: `supabase/functions/now-playing/index.ts`, `src/hooks/useNowPlaying.ts`

### 2. AudioPlayerContext

Central playback state manager handling two modes:

- **Live mode**: Polls `now-playing` every 5 seconds, syncs track changes, auto-resumes on track switch
- **Mix mode**: Direct playback of a selected mix, returns to live when ended

Exposes: `playLive()`, `playMix()`, `pause()`, `resume()`, `togglePlay()`, `skipTrack()`, `seek()`, `setVolume()`

Single `<audio>` element managed via ref, shared across the entire app.

**File**: `src/contexts/AudioPlayerContext.tsx`

### 3. Admin Authentication Flow

1. User enters password on `/admin`
2. Client calls `admin-auth` edge function with password
3. Function compares against `ADMIN_PASSWORD` secret
4. On match: generates HMAC-SHA256 JWT with 1-hour expiry, returns token
5. Token stored in `sessionStorage`
6. All admin operations send token in request body
7. Each admin edge function validates token via HMAC verification

**Files**: `supabase/functions/admin-auth/index.ts`, `src/pages/Admin.tsx`

### 4. Track Upload Pipeline

1. Admin selects MP3 + optional artwork
2. MP3 uploaded via XHR (for progress tracking) to `tracks` storage bucket
3. Artwork uploaded via Supabase SDK to `artwork` bucket
4. `admin-upload` edge function creates track record + genre associations
5. Duration estimated from file size (`file.size / 24000`) — approximate for MP3

**File**: `src/pages/Admin.tsx` (`handleUpload`), `supabase/functions/admin-upload/index.ts`

### 5. Genre System

- Genres stored in `track_genres` join table (track_id + genre string)
- No fixed enum — free-form text, but admin UI provides NTS-inspired suggestions
- Explore page fetches all genres, builds tag cloud
- AND filtering: tracks must match ALL selected genres
- Genres displayed on explore cards and in admin track list

**Files**: `src/hooks/useGenres.ts`, `src/pages/Explore.tsx`, `src/pages/Admin.tsx`

### 6. Chat System

- Messages inserted directly via Supabase client (RLS allows INSERT with validation)
- Real-time delivery via `postgres_changes` subscription on `chat_messages`
- Rate limiting: `chat_rate_limit()` trigger rejects messages within 5 seconds per username
- Moderation: Admin can delete messages via `admin-delete-chat` edge function
- 50 most recent messages loaded on init, new messages appended via realtime

**Files**: `src/hooks/useChatMessages.ts`, `src/components/LiveChat.tsx`

### 7. Mix Detail & URL Slugs

- `slugify()` utility converts artist/title to URL-safe slugs
- Route: `/mix/:artist/:title`
- `MixDetail` page fetches all tracks, finds match by comparing slugified values
- `MixDetailContent` shared component renders in both dialog and standalone page
- Tracklist fetched from `mix_tracklists` ordered by position

**Files**: `src/lib/utils.ts`, `src/pages/MixDetail.tsx`, `src/components/MixDetailContent.tsx`

### 8. Artwork Color Extraction

Homepage mix rows extract dominant color from artwork via canvas:
1. Load image with `crossOrigin="anonymous"`
2. Draw to 8×8 canvas
3. Average all pixel RGB values
4. Apply as subtle full-page background tint on hover

**File**: `src/components/MixCard.tsx` (`useArtworkColor` hook)

### 9. Design System

All visual identity flows from `src/index.css`:

| Token | HSL Value | Usage |
|-------|-----------|-------|
| `--background` | `60 10% 95%` | Page background (warm off-white) |
| `--foreground` | `0 0% 8%` | Primary text (near-black) |
| `--muted` | `60 5% 85%` | Subtle backgrounds |
| `--muted-foreground` | `0 0% 45%` | Secondary text |
| `--destructive` | `0 70% 45%` | Active/live indicators |
| `--border` | `0 0% 75%` | Borders |
| `--radius` | `0px` | No rounded corners anywhere |

Custom component classes: `meter-panel`, `meter-inset`, `meter-label`, `meter-value`, `meter-dot`, `meter-dot-active`, `meter-dot-off`, `receipt-tear`, `receipt-line`

Fonts: **JetBrains Mono** (body, 300–700), **Space Mono** (labels, 400/700)

---

## Database Tables

### `tracks`
Primary content table. Each row = one mix/track in the radio rotation.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, auto-generated |
| title | text | Required |
| artist | text | Default: 'Unknown' |
| file_url | text | Public URL to MP3 in storage |
| artwork_url | text | Nullable, public URL to image |
| duration_seconds | int | Default: 0 |
| play_order | int | Determines position in live radio loop |
| published_date | date | Default: CURRENT_DATE |
| created_at | timestamptz | Auto-set |

### `track_genres`
Genre tagging join table.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| track_id | uuid | FK → tracks.id |
| genre | text | Free-form genre string |
| created_at | timestamptz | Auto-set |

### `mix_tracklists`
Timestamped tracklist entries for each mix.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| mix_id | uuid | FK → tracks.id |
| position | int | Order within tracklist |
| track_title | text | Required |
| track_artist | text | Default: 'Unknown' |
| timestamp_label | text | Nullable, e.g. "01:23:45" |
| created_at | timestamptz | Auto-set |

### `chat_messages`
Real-time chat messages.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| username | text | 1-20 chars (enforced by RLS) |
| message | text | 1-280 chars (enforced by RLS) |
| created_at | timestamptz | Auto-set, rate-limited by trigger |

### `station_config`
Singleton configuration row.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| station_name | text | Default: 'My Radio Station' |
| playlist_started_at | timestamptz | Anchor for radio sync calculation |
| pwa_enabled | boolean | Default: false |
| updated_at | timestamptz | Auto-set |

### `mixes` (legacy)
Original mixes table, superseded by `tracks`. Still exists but unused in current UI.

---

## Edge Functions Reference

| Function | Auth | Purpose |
|----------|------|---------|
| `now-playing` | None | Returns current track, elapsed time, up-next queue |
| `skip-track` | JWT | Advances playlist by resetting `playlist_started_at` |
| `admin-auth` | Password | Issues HMAC JWT token |
| `admin-upload` | JWT | Creates track + genre records |
| `admin-delete-track` | JWT | Removes track + associated genres/tracklist |
| `admin-update-track` | JWT | Updates metadata, genres, artwork, date |
| `admin-reorder` | JWT | Swaps `play_order` between two tracks |
| `admin-tracklist` | JWT | CRUD on `mix_tracklists` entries |
| `admin-update-config` | JWT | Updates `station_config` (PWA toggle, etc.) |
| `admin-delete-chat` | JWT | Deletes a chat message |

All admin functions use `verify_jwt = false` and perform custom HMAC validation internally.

---

## File Map

```
.lovable/
├── master-plan.md          → This document (vision + features)
├── implementation.md       → Technical reference (you are here)
└── plan.md                 → Active development plan

src/
├── App.tsx                 → Router + providers
├── main.tsx                → Entry point
├── index.css               → Design tokens + custom classes
├── App.css                 → (minimal)
├── lib/
│   ├── radio-types.ts      → TypeScript interfaces (Track, Mix, NowPlayingResponse, etc.)
│   └── utils.ts            → cn() + slugify()
├── contexts/
│   └── AudioPlayerContext.tsx → Global audio state (live/mix modes)
├── hooks/
│   ├── useNowPlaying.ts    → Polls now-playing edge function
│   ├── useMixes.ts         → Fetches tracks + tracklists
│   ├── useGenres.ts        → Genre queries (all genres, tracks by genre, track genres)
│   ├── useChatMessages.ts  → Chat with realtime subscription
│   └── use-mobile.tsx      → Mobile breakpoint detection
├── pages/
│   ├── Index.tsx           → Homepage
│   ├── Explore.tsx         → Genre browser
│   ├── MixDetail.tsx       → Standalone mix page (slug URL)
│   ├── Admin.tsx           → Management console
│   ├── Tools.tsx           → Placeholder
│   ├── Install.tsx         → PWA install guide
│   └── NotFound.tsx        → 404
├── components/
│   ├── SiteHeader.tsx      → Nav bar (ENDERA, HOME, EXPLORE, TOOLS, clock)
│   ├── SiteFooter.tsx      → Footer (copyright, INSTALL, ADMIN links)
│   ├── LiveBar.tsx         → Sticky player controls
│   ├── LiveChat.tsx        → Floating chat widget
│   ├── LiveClock.tsx       → Real-time clock display
│   ├── MixCard.tsx         → Track row with dialog popup
│   ├── MixFeed.tsx         → Track list container
│   ├── MixDetailContent.tsx→ Shared mix detail view
│   ├── AboutSection.tsx    → Station description + social links
│   ├── RadioPlayer.tsx     → Original radio player (legacy, superseded by LiveBar)
│   ├── TracklistDialog.tsx → Admin tracklist editor
│   ├── NavLink.tsx         → Navigation link component
│   └── ui/                 → shadcn/ui components (40+ components)
└── integrations/
    └── supabase/
        ├── client.ts       → Auto-generated Supabase client
        └── types.ts        → Auto-generated database types

supabase/
├── config.toml             → Edge function JWT settings
└── functions/              → 10 Deno edge functions (see above)

public/
├── favicon.svg             → Browser tab icon
├── og-image.png            → Social share image
├── pwa-192x192.png         → PWA icon (small)
├── pwa-512x512.png         → PWA icon (large)
├── robots.txt              → Search engine directives
├── _redirects              → Netlify SPA redirect rules
└── placeholder.svg         → Fallback image
```
