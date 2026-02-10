
# Track Detail View with Larger Artwork

Replace the current inline expand (chevron) with a dialog/modal that opens when you click on a track row. The modal shows a large artwork image, track metadata, and the full tracklist.

---

## Changes

### MixCard.tsx (`src/components/MixCard.tsx`)

- Remove the expand chevron button and the inline expanded tracklist section.
- Make the track row itself clickable (excluding the play button) to open a detail dialog.
- Add a `Dialog` from the existing Radix dialog component (`@/components/ui/dialog`).
- The dialog contains:
  - **Large artwork**: The track's `artwork_url` displayed prominently at ~300x300px with `aspect-ratio: 1/1` and `object-cover`. Falls back to a placeholder or is hidden if no artwork exists.
  - **Track info**: Title, artist (DJ label), duration -- styled in the existing mono/meter aesthetic.
  - **Play button**: A play/pause button within the detail view.
  - **Tracklist**: Fetched via the existing `useMixTracklist` hook (loaded when dialog opens by passing `mix.id` when open). Displayed as a numbered list with timestamps and artist/title.
- The `useMixTracklist` hook trigger changes from `expanded` boolean to the dialog open state.

### LiveBar.tsx (`src/components/LiveBar.tsx`)

- Make the artwork thumbnail in the LiveBar clickable. Currently it's a static `<img>`. Wrap it so clicking opens the same detail dialog for the currently playing track (mix mode only -- not applicable in live mode since live tracks use the `tracks` table, not `mixes`).
- For simplicity, clicking the artwork in mix mode could scroll to / highlight the track in the feed rather than opening a separate dialog. Alternatively, a small dialog approach works too.

For a clean implementation, the detail dialog will live inside `MixCard.tsx` only (one per row), triggered by clicking the row.

---

## Technical Details

### Dialog structure in MixCard.tsx

```
Dialog (open state controlled by local useState)
  DialogContent (max-w-md, styled with bg-background border-foreground)
    - artwork image (w-full max-h-80 object-cover)
    - title + artist + duration
    - play/pause button
    - separator
    - tracklist (ScrollArea for long lists)
```

### Hook usage
- `useMixTracklist(dialogOpen ? mix.id : null)` -- only fetches when dialog is open.

### Files modified
| File | Change |
|------|--------|
| `src/components/MixCard.tsx` | Replace chevron expand with row-click dialog showing large artwork + tracklist |

No database or backend changes needed -- all data already exists.
