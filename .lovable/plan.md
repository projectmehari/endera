
## Add Published Date to Mixes and Auto-Number by Newest First

### What Changes

1. **Database**: Add a `published_date` column to the `tracks` table (defaults to `created_at`).

2. **Frontend numbering**: Remove the current `play_order`-based number. Instead, sort mixes by `published_date` descending (newest first) and auto-number them so the newest mix gets the highest number (e.g., if there are 5 mixes, the newest is "005", the oldest is "001").

3. **Admin panel**: Add a "Published Date" input field to the upload form, and make each track's published date editable inline in the playlist view.

4. **Edge function**: Update the upload function to accept and store the optional `published_date`.

---

### Technical Details

**Step 1 -- Migration**

```sql
ALTER TABLE public.tracks
  ADD COLUMN published_date date DEFAULT CURRENT_DATE;

-- Backfill existing rows from created_at
UPDATE public.tracks SET published_date = (created_at AT TIME ZONE 'UTC')::date;
```

**Step 2 -- Update `useMixes` hook**

Change ordering from `play_order ascending` to `published_date descending` so newest mixes appear first.

**Step 3 -- Update `MixCard.tsx` numbering**

Replace `{mix.play_order || index + 1}` with a count-based number derived from total mixes minus the current index, so the newest mix gets the highest number (e.g., mix 5 of 5 is shown as "005").

This requires passing `totalCount` as a prop from `MixFeed` to `MixRow`.

**Step 4 -- Update `MixFeed.tsx`**

Pass `total={mixes.length}` to each `MixRow`.

**Step 5 -- Admin upload form (`Admin.tsx`)**

Add an optional "PUBLISHED DATE" date input field. Default to today's date.

**Step 6 -- Admin track list (`Admin.tsx`)**

Display each track's `published_date` and make it editable (click to change, saves via a new edge function or direct update call).

**Step 7 -- Edge function `admin-upload`**

Accept optional `publishedDate` field and include it in the insert.

**Step 8 -- New edge function `admin-update-track`**

Create a small edge function to update a track's `published_date` (and potentially other metadata) by ID, authenticated with the admin token.

**Step 9 -- Update `Track` type in `radio-types.ts`**

Add `published_date: string | null` to the `Track` interface.
