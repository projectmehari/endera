
# Volume Controls, Seek, Live Indicator, and Artwork Upload

This plan covers four changes: playback controls (volume + seek), a flashing red LIVE dot, sort controls in admin, and artwork image support.

---

## 1. Volume Control + Seek (Forward/Back)

### LiveBar changes (`src/components/LiveBar.tsx`)
- Add a volume slider using the existing Radix `Slider` component, placed next to the play/pause button.
- Add seek forward/back buttons (10-second skip) using `SkipBack` and `SkipForward` icons from lucide-react. These are enabled in both live and mix modes.

### AudioPlayerContext changes (`src/contexts/AudioPlayerContext.tsx`)
- Expose `volume`, `setVolume(v)`, and `seek(seconds)` methods.
- `setVolume` sets `audioRef.current.volume`.
- `seek` adjusts `audioRef.current.currentTime` by the given delta (clamped to 0 and duration).

---

## 2. Flashing Red LIVE Dot

### CSS changes (`src/index.css`)
- Update `.meter-dot-active` to use a red color (`hsl(0 70% 50%)`) with a pulsing animation.
- Add a `@keyframes live-pulse` animation that fades the dot opacity and box-shadow.

### LiveBar (`src/components/LiveBar.tsx`)
- The existing `meter-dot-active` class already applies when live and playing. The CSS change will make it flash red automatically.

---

## 3. Admin: Sort Tracks (Oldest to Newest)

### Admin page changes (`src/pages/Admin.tsx`)
- Add a sort toggle button (e.g., "SORT: NEWEST FIRST" / "SORT: OLDEST FIRST") above the playlist.
- This toggles a local state that controls the `order` direction in the Supabase query or simply reverses the local array.
- This is a display-only sort -- it does not change `play_order` values.

---

## 4. Artwork Image Upload + Display

### Database migration
- Add an `artwork_url` column (text, nullable, default null) to the `tracks` table.

### Storage
- A public `artwork` storage bucket will be created for the images.

### Admin upload form (`src/pages/Admin.tsx`)
- Add an image file input field (accept `image/*`) below the MP3 field.
- On upload, the image is uploaded to the `artwork` storage bucket, and its public URL is passed to the `admin-upload` edge function.

### Edge function (`supabase/functions/admin-upload/index.ts`)
- Accept an optional `artworkUrl` parameter.
- Include `artwork_url` in the track insert.

### Track type (`src/lib/radio-types.ts`)
- Add `artwork_url: string | null` to the `Track` interface.

### LiveBar (`src/components/LiveBar.tsx`)
- When a track has `artwork_url`, show a small thumbnail (24x24) next to the track title, in both live and mix modes.

### MixCard (`src/components/MixCard.tsx`)
- Show the artwork thumbnail next to the track title in each archive row.

---

## Files Summary

| File | Action |
|------|--------|
| `src/index.css` | Add live-pulse keyframes, update meter-dot-active to red |
| `src/contexts/AudioPlayerContext.tsx` | Add volume, setVolume, seek |
| `src/components/LiveBar.tsx` | Add volume slider, seek buttons, artwork thumbnail |
| `src/components/MixCard.tsx` | Add artwork thumbnail |
| `src/lib/radio-types.ts` | Add artwork_url to Track |
| `src/pages/Admin.tsx` | Add artwork upload field, sort toggle |
| `supabase/functions/admin-upload/index.ts` | Accept artworkUrl param |
| Database migration | Add artwork_url column to tracks, create artwork bucket |
