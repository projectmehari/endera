

## Rebalance the LiveBar Layout

The current LiveBar has the track info taking up all available space (`flex-1`), which pushes the controls far to the right, leaving a large empty gap in between. The fix is to restructure the layout into three balanced sections:

**Left** -- Mode indicator + artwork + track title (only as wide as needed)
**Center** -- Progress scrubber (expands to fill available space)
**Right** -- Playback controls + volume

### Technical Details

**File: `src/components/LiveBar.tsx`**

1. Remove `flex-1` from the track info section so it only takes the space it needs
2. Move the progress slider section to use `flex-1` so it fills the middle gap naturally
3. Remove the fixed `w-56` width constraint on the progress section so it stretches
4. On mobile (where the progress bar is hidden), the natural spacing between track info and controls will be tighter and more balanced
5. Keep all existing responsive behavior (progress hidden on small screens, volume hidden on mobile, artist hidden on mobile)

This creates a balanced three-column feel: compact left info, expanded center scrubber, compact right controls -- matching the visual weight distribution expected from the screenshot.

