

## Add Genre Tags to Tracks + Explore Page

### Overview
Add genre tagging to radio tracks via the admin panel, and create a new "Explore" page where visitors can browse and filter tracks by genre.

### 1. Database Changes

**New table: `track_genres`** (join table for many-to-many relationship)
- `id` (uuid, PK, default `gen_random_uuid()`)
- `track_id` (uuid, NOT NULL, references `tracks.id` ON DELETE CASCADE)
- `genre` (text, NOT NULL) -- stored as lowercase, e.g. "ambient", "house", "techno"
- `created_at` (timestamptz, default `now()`)
- Unique constraint on `(track_id, genre)` to prevent duplicates
- RLS: public SELECT, no public INSERT/UPDATE/DELETE

Using a join table (rather than a text array column) keeps things normalized and makes querying tracks by genre efficient with standard SQL joins.

### 2. Backend: Edge Function Update

**Modify `admin-upload` edge function** to accept an optional `genres` string array and insert rows into `track_genres` after creating the track.

**Modify `admin-update-track` edge function** to accept an optional `genres` string array. When provided, delete existing genres for that track and re-insert the new set.

### 3. Admin Panel Changes (`src/pages/Admin.tsx`)

**Upload form:**
- Add a "GENRES" text input where the admin types comma-separated genre tags (e.g. "ambient, house, downtempo")
- On submit, split by comma, trim, lowercase, and send as `genres` array in the upload payload

**Edit track dialog (`EditTrackDialog`):**
- Fetch existing genres for the track from `track_genres`
- Show them in a comma-separated input, pre-filled
- On save, send updated `genres` array to `admin-update-track`

**Track list rows:**
- Display small genre badges next to each track for quick reference

### 4. New Explore Page (`src/pages/Explore.tsx`)

- Standard page layout with `SiteHeader` and `SiteFooter`
- Top section: horizontal row of clickable genre "chips" fetched from distinct genres in `track_genres`
- Clicking a genre chip filters the track list; multiple genres can be selected (OR logic)
- A search/filter input for free-text genre search
- Below: filtered track list using the same `MixRow` component, showing matching tracks
- Empty state when no tracks match

### 5. Navigation Update

**`SiteHeader.tsx`:** Add an "EXPLORE" link between HOME and TOOLS.

**`App.tsx`:** Add route `/explore` pointing to the new Explore page.

### 6. Types Update

**`src/lib/radio-types.ts`:** Add a `TrackGenre` interface and optionally extend `Track` to include an optional `genres` string array for client-side use.

### 7. New Hook (`src/hooks/useGenres.ts`)

- `useGenres()` -- fetches all distinct genre values from `track_genres`
- `useTracksByGenre(genres: string[])` -- fetches tracks filtered by selected genres using a join query

---

### Technical Details

**Migration SQL:**
```sql
CREATE TABLE public.track_genres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id uuid NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  genre text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(track_id, genre)
);

ALTER TABLE public.track_genres ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Track genres are publicly readable"
  ON public.track_genres FOR SELECT
  USING (true);
```

**Edge function changes:**
- `admin-upload/index.ts`: After inserting track, if `genres` array provided, batch-insert into `track_genres`
- `admin-update-track/index.ts`: If `genres` provided, delete from `track_genres` where `track_id` matches, then insert new rows

**Explore page query pattern:**
```sql
SELECT DISTINCT t.* FROM tracks t
  JOIN track_genres tg ON tg.track_id = t.id
  WHERE tg.genre = ANY($selectedGenres)
  ORDER BY t.published_date DESC
```
This will be done via the Supabase JS client using `.in()` filter on a joined query, or via a small RPC function if needed.

**Files to create:**
- `src/pages/Explore.tsx`
- `src/hooks/useGenres.ts`

**Files to modify:**
- `src/App.tsx` (add route)
- `src/components/SiteHeader.tsx` (add nav link)
- `src/lib/radio-types.ts` (add TrackGenre type)
- `src/pages/Admin.tsx` (genre input in upload + edit)
- `supabase/functions/admin-upload/index.ts` (handle genres)
- `supabase/functions/admin-update-track/index.ts` (handle genres)

