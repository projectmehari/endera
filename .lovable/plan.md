

# Dual Listening Experience: Live Radio + Mix Archive

This plan introduces a unified audio player that supports two modes -- a continuous live radio feed and on-demand mix playback -- inspired by Desire Path Radio (persistent top player) and door.link (scrollable archive list).

---

## Core Concept

A single `<audio>` element is managed by a global audio context (React Context). Two sources can drive it:

1. **LIVE RADIO** -- the existing server-clock-synced playlist loop (tracks table). Always available at the top of the page as a compact persistent bar.
2. **MIX ARCHIVE** -- when a user clicks a mix from the archive list, the live feed stops and the selected mix plays on-demand from its `file_url`.

Pressing "LIVE" at any time returns to the live radio feed at the correct synced position.

---

## Architecture

### New: Global Audio Context (`src/contexts/AudioPlayerContext.tsx`)

A React Context + Provider that owns:
- A single `<audio>` element ref
- Current playback mode: `"live"` or `"mix"`
- Current mix info (if in mix mode): `Mix` object
- Play/pause state
- Methods: `playLive()`, `playMix(mix)`, `pause()`, `resume()`

This replaces the local audio ref currently inside `RadioPlayer.tsx`. All components share one audio pipeline.

### Restructured Page Layout

```text
+-----------------------------------------------+
|  SiteHeader (logo, nav, clock)                 |
+-----------------------------------------------+
|  LiveBar (compact, always visible)             |
|  [LIVE dot] Now Playing: Title - Artist  [▶/■] |
+-----------------------------------------------+
|                                                |
|  AboutSection                                  |
|                                                |
|  --- ARCHIVE ---                               |
|  Mix 204  title               01:50:49   [▶]   |
|  Mix 203  title               00:40:13   [▶]   |
|  Mix 202  title               00:40:31   [▶]   |
|  ...scrollable list (door.link style)...       |
|                                                |
|  Tools link                                    |
+-----------------------------------------------+
|  SiteFooter                                    |
+-----------------------------------------------+
```

When a mix is playing, the LiveBar updates to show the mix info instead, with a "RETURN TO LIVE" button.

---

## File Changes

### New Files

| File | Purpose |
|------|---------|
| `src/contexts/AudioPlayerContext.tsx` | Global audio state: mode, current track/mix, play/pause, single `<audio>` element |
| `src/components/LiveBar.tsx` | Compact persistent player bar at top of page showing current playback (live or mix) with controls |

### Modified Files

| File | Changes |
|------|---------|
| `src/pages/Index.tsx` | Wrap with `AudioPlayerProvider`, replace `<RadioPlayer>` with `<LiveBar>`, restructure layout |
| `src/App.tsx` | Wrap routes with `AudioPlayerProvider` so audio persists across navigation |
| `src/components/RadioPlayer.tsx` | Simplified or removed -- its logic moves into `AudioPlayerContext` and `LiveBar` |
| `src/components/MixCard.tsx` | Add a play button that calls `playMix(mix)` from context; highlight if currently playing |
| `src/components/MixFeed.tsx` | Restyle from grid cards to a scrollable list layout (door.link style): number, title, duration, play button |

### No Database Changes

The existing `tracks`, `mixes`, and `mix_tracklists` tables already support both experiences. No schema changes needed.

---

## Detailed Component Behavior

### AudioPlayerContext

```text
State:
  mode: "live" | "mix"
  isPlaying: boolean
  currentMix: Mix | null         (set when mode="mix")
  liveData: NowPlayingResponse   (from useNowPlaying hook)
  elapsed: number

Methods:
  playLive()   -> sets mode to "live", syncs audio to server clock position
  playMix(mix) -> sets mode to "mix", loads mix.file_url from start
  pause()      -> pauses audio
  resume()     -> resumes current source
  togglePlay() -> play/pause toggle
```

The context internally runs the `useNowPlaying` poll so it always knows the live position. When switching back to live, it re-syncs immediately.

### LiveBar

A compact horizontal bar (not the current large meter-panel player). Shows:
- **Live mode**: A pulsing dot + "LIVE" label, current track title/artist, progress bar, play/pause button
- **Mix mode**: Mix artwork (small thumbnail), mix title/artist, progress bar, play/pause, and a "RETURN TO LIVE" button
- Admin skip button (if token present, live mode only)

This bar sits directly below the header and stays visible as the user scrolls through the archive.

### MixFeed (Restyled)

Changes from a card grid to a list layout inspired by door.link:
- Each row: display number, title, duration, expand chevron (for tracklist), play button
- Clicking the row or play button triggers `playMix(mix)` from context
- The currently-playing mix row is visually highlighted
- Tracklist still expandable inline below each row

### MixCard

Repurposed as `MixRow` -- a single horizontal row component instead of a card with artwork. Artwork can optionally show on hover or in an expanded state.

---

## Technical Details

### Audio Sync on Mode Switch

- **Live -> Mix**: Pause live audio, set `src` to `mix.file_url`, play from 0.
- **Mix -> Live**: Re-fetch `now-playing`, set `src` to current track's `file_url`, seek to `elapsed_seconds`, play.
- **Mix ends**: Automatically return to live mode (listen for `ended` event on audio element).

### Progress Tracking

- **Live mode**: Progress comes from polling `useNowPlaying` (server-authoritative elapsed time).
- **Mix mode**: Progress comes from the `<audio>` element's `timeupdate` event (client-side).

### Sticky LiveBar

The LiveBar uses `sticky top-0 z-50` positioning so it remains visible while scrolling through the archive. This mimics the Desire Path Radio persistent player behavior.

---

## Summary of User Experience

1. User lands on the homepage -- the LiveBar shows the current live radio track. They can press play to tune in.
2. Scrolling down, they see the About section and then the full mix archive list.
3. Clicking any mix instantly switches audio to that mix. The LiveBar updates to show the mix info with a "RETURN TO LIVE" button.
4. When the mix finishes (or user clicks "RETURN TO LIVE"), audio seamlessly switches back to the live radio at the correct synced position.
