

# endera.fm Homepage Redesign and Feature Expansion

This plan restructures the homepage into a full content-rich landing experience, adds new pages, new database tables, and several new features.

---

## 1. Homepage Restructure

The current homepage is just the radio player filling the entire screen. We will restructure it into a scrollable page with distinct sections, all following the existing industrial meter aesthetic:

- **Header**: ENDERA.FM logo + live clock (updating every second) + nav links (Home, Tools)
- **Hero / Radio Player**: The existing player, embedded as a section (not full-screen)
- **About Section**: A meter-panel block with placeholder text describing the project
- **Mixes Feed**: A grid of mix cards with artwork, title, artist -- each expandable to show a tracklist
- **Tools Section**: A link/card pointing to `/tools` (a "Coming Soon" page)
- **Footer**: Existing copyright strip

The layout will be responsive:
- **Desktop**: Max-width container, mixes in a 3-column grid
- **Tablet**: 2-column grid for mixes
- **Mobile**: Single column, full-width stacking

---

## 2. New Pages and Routing

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | `Index.tsx` (redesigned) | Full homepage with all sections |
| `/tools` | `Tools.tsx` (new) | "Coming Soon" placeholder page |
| `/admin` | `Admin.tsx` (unchanged) | Track management (already separate at `/admin`) |

The admin link will be removed from the homepage footer. Admin is only accessible by navigating directly to `/admin`.

---

## 3. Database Changes

### New table: `mixes`
Stores curated mix entries for the homepage feed.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK, default `gen_random_uuid()` |
| `title` | text | Mix title |
| `artist` | text | Default `'Unknown'` |
| `artwork_url` | text | URL to artwork image |
| `file_url` | text | Audio file URL |
| `duration_seconds` | integer | Default `0` |
| `description` | text | Optional description, nullable |
| `display_order` | integer | Default `0` |
| `created_at` | timestamptz | Default `now()` |

RLS: Publicly readable (SELECT). No INSERT/UPDATE/DELETE from client (managed via admin edge functions).

### New table: `mix_tracklists`
Stores ordered tracklist entries for each mix.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK, default `gen_random_uuid()` |
| `mix_id` | uuid | FK to `mixes.id` ON DELETE CASCADE |
| `position` | integer | Track order within the mix |
| `track_title` | text | Track name |
| `track_artist` | text | Default `'Unknown'` |
| `timestamp_label` | text | Optional, e.g. "12:34", nullable |
| `created_at` | timestamptz | Default `now()` |

RLS: Publicly readable (SELECT). No client mutations.

---

## 4. Skip to Next Track

Add a "SKIP" button next to the existing STOP/TUNE IN button in the radio player. When pressed:
- The `now-playing` edge function will be updated to accept an optional `skip` parameter
- On skip, the server updates `playlist_started_at` in `station_config` to effectively jump forward by the remaining seconds of the current track
- The client re-fetches now-playing data after skip

This requires a new edge function `skip-track` (admin-authenticated) that adjusts the `playlist_started_at` timestamp.

---

## 5. New Files

| File | Purpose |
|------|---------|
| `src/pages/Index.tsx` | Redesigned homepage with all sections |
| `src/pages/Tools.tsx` | Coming Soon page |
| `src/components/RadioPlayer.tsx` | Refactored to be embeddable (not full-screen) |
| `src/components/LiveClock.tsx` | Real-time clock component |
| `src/components/MixCard.tsx` | Mix card with artwork and expandable tracklist |
| `src/components/MixFeed.tsx` | Grid of MixCards, fetches from `mixes` table |
| `src/components/AboutSection.tsx` | About text block |
| `src/components/SiteHeader.tsx` | Top navigation header with clock |
| `src/components/SiteFooter.tsx` | Footer strip |
| `src/hooks/useMixes.ts` | Hook to fetch mixes and their tracklists |
| `supabase/functions/skip-track/index.ts` | Edge function to skip current track |

---

## 6. Modified Files

| File | Changes |
|------|---------|
| `src/App.tsx` | Add `/tools` route |
| `src/components/RadioPlayer.tsx` | Remove full-screen wrapper, remove admin link, add skip button |
| `src/lib/radio-types.ts` | Add `Mix` and `MixTracklistEntry` interfaces |

---

## Technical Details

### Live Clock (`LiveClock.tsx`)
- Uses `setInterval` at 1000ms to update time display
- Renders in `HH:MM:SS` format with the `meter-label` style

### Mix Feed
- Fetches from `mixes` table ordered by `display_order`
- Each card shows artwork (square, using `aspect-ratio`), title, artist, duration
- Clicking a card expands/collapses a tracklist panel underneath
- Tracklist fetched from `mix_tracklists` joined on `mix_id`, ordered by `position`

### Skip Track Edge Function
- Accepts `{ token }` body (admin auth)
- Reads current `playlist_started_at` and tracks
- Calculates remaining seconds in current track
- Subtracts that amount from `playlist_started_at` (effectively advancing the clock)
- Updates `station_config`

### Responsive Layout
- Uses Tailwind responsive prefixes: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Header collapses gracefully on mobile
- Player section stays full-width on all breakpoints

