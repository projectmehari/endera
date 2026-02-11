

# Plan: Tracklist, Genre & Explore Page Improvements

This plan covers four changes: fixing the edit/delete buttons visibility, adding scrollable tracklist to both the mix detail dialog and explore page, populating genres from NTS, and switching genre filtering to AND logic.

---

## 1. Fix Edit/Delete Buttons in Admin Tracklist

The `[DEL]` button on line 171 of `TracklistDialog.tsx` still has `opacity-0 group-hover:opacity-100` classes -- the previous fix only removed them from `[EDIT]` but missed `[DEL]`. Both buttons will be made always visible with clear styling, and laid out on a separate row below each entry for easy tapping on mobile.

**File:** `src/components/TracklistDialog.tsx`
- Remove `opacity-0 group-hover:opacity-100` from the `[DEL]` button
- Move `[EDIT]` and `[DEL]` to a dedicated row below each tracklist entry for better mobile touch targets
- Increase button tap area with padding

---

## 2. Scrollable Tracklist in Dialogs + Tracklist on Explore Page

### 2a. Fix scroll in MixCard dialog
The `ScrollArea` on the tracklist in `MixCard.tsx` (line 222) uses `max-h-60` which may be too small. It will be increased and given a proper fixed height so the dialog content scrolls naturally while artwork and info stay pinned.

**File:** `src/components/MixCard.tsx`
- Change `max-h-60` to `max-h-[50vh]` on the `ScrollArea` so longer tracklists are scrollable within the viewport

### 2b. Add tracklist to Explore page cards
Currently, clicking a card on the Explore page only starts playback. It will be updated to also open a detail dialog (reusing the same pattern from `MixCard.tsx`) that shows artwork, track info, and a scrollable tracklist.

**File:** `src/pages/Explore.tsx`
- Import `useMixTracklist` from `@/hooks/useMixes`
- Import `Dialog`, `DialogContent`, `DialogTitle`, `ScrollArea`, `Separator`
- Add state for `selectedTrack` and `dialogOpen`
- Change the card click handler to open the dialog instead of just playing
- Add a play button inside the dialog
- Render the tracklist inside the dialog with the same NTS-inspired styling as `MixCard.tsx`

---

## 3. Populate Genre Tags from NTS

The NTS `/latest` page contains these genres (extracted from the crawl). New genres to insert into `track_genres` won't be tied to specific tracks -- instead, they'll be available as options in the admin genre picker. However, since `track_genres` requires a `track_id`, genres need to be assigned to tracks.

A better approach: insert the genre list as available options directly. Since the current system derives genres from the `track_genres` table, I'll add the new genres as a predefined list in the admin UI's genre selector, so admins can tag tracks with them. No schema change needed.

**New genres from NTS** (not already in the database): soundtrack, live performance, interview, indie rock, leftfield pop, art rock, electronica, folk, gamelan, industrial, dark ambient, noise, modern classical, club, footwork, rap, noise rock, electro, acid, funk, soul, minimal synth, post punk, psychedelic rock, cumbia, guaracha, dub, lovers rock, reggae

**File:** `src/pages/Admin.tsx` (or wherever genre assignment happens)
- Add a hardcoded `NTS_GENRES` array containing all discovered genres
- Merge these with existing genres from the database in the genre picker dropdown
- When an admin assigns a genre to a track, it gets inserted into `track_genres`

---

## 4. AND Logic for Genre Filtering on Explore

Currently, selecting multiple genres uses OR logic (shows tracks matching ANY selected genre). The request is to use AND logic (only show tracks that have ALL selected genres).

**File:** `src/hooks/useGenres.ts`
- In `useTracksByGenre`, change the filtering logic:
  - Query `track_genres` for rows matching any of the selected genres
  - Group by `track_id` and count distinct genres
  - Only include track IDs where the count equals `selectedGenres.length` (i.e., the track has ALL selected genres)

```text
Current flow:
  SELECT track_id FROM track_genres WHERE genre IN (selected)
  -> returns all tracks with ANY genre

New flow:
  SELECT track_id FROM track_genres WHERE genre IN (selected)
  -> group by track_id in JS
  -> filter where count of matched genres === selectedGenres.length
  -> only return tracks that match ALL selected genres
```

---

## Technical Summary

| File | Change |
|------|--------|
| `src/components/TracklistDialog.tsx` | Fix [DEL] visibility, improve mobile layout |
| `src/components/MixCard.tsx` | Increase scroll area height |
| `src/pages/Explore.tsx` | Add detail dialog with tracklist |
| `src/hooks/useGenres.ts` | Switch to AND filtering logic |
| `src/pages/Admin.tsx` | Add NTS genre list to genre picker |

