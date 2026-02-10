

# Add Tracklist Management to Admin Panel

Add a tracklist editor to the admin panel so you can add, view, and remove tracklist entries for each track/mix.

---

## How It Will Work

1. Each track in the admin playlist gets a new **[TRACKLIST]** button.
2. Clicking it opens a dialog/panel where you can:
   - See existing tracklist entries (position, timestamp, artist, title).
   - Add new entries with fields for: position, timestamp label (e.g. "00:15:30"), track artist, and track title.
   - Delete individual entries.
3. Changes are saved immediately to the database via a new edge function (to bypass RLS restrictions on insert/delete).

---

## Changes

### 1. New Edge Function: `admin-tracklist` (`supabase/functions/admin-tracklist/index.ts`)

Handles three actions behind admin token auth:
- **list**: Returns all tracklist entries for a given mix_id, ordered by position.
- **add**: Inserts a new tracklist entry (mix_id, position, timestamp_label, track_artist, track_title).
- **delete**: Removes a tracklist entry by id.

### 2. Admin Page Update (`src/pages/Admin.tsx`)

- Add a **[TRACKLIST]** button to each track row.
- Clicking it opens a `Dialog` showing:
  - A list of existing tracklist entries for that track.
  - A small form at the bottom to add a new entry (position auto-increments, timestamp and artist/title fields).
  - A delete button per entry.
- Uses the new `admin-tracklist` edge function for all operations.

### No database changes needed
The `mix_tracklists` table already exists with the right schema. We just need an edge function to write to it (since RLS blocks direct inserts from the client).

