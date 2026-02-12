

## Audio Visualizer for LiveBar

Add a Web Audio API frequency visualizer to the LiveBar, styled as an oscilloscope to match the industrial meter aesthetic.

### What it will look like
- A small bar (roughly 80px wide, 24px tall) sitting between the track info and the progress scrubber
- Renders 16-24 thin vertical frequency bars in black on the cream background
- Bars react to the currently playing audio in real-time
- When paused or no track, bars drop to a flat line
- Hidden on mobile to preserve space (matches the existing responsive pattern)

### Implementation

**1. Expose the audio element ref from AudioPlayerContext**
- Add `audioRef` to the context value so the visualizer can connect a Web Audio `AnalyserNode` to the same `<audio>` element
- Update the `AudioPlayerContextValue` interface to include `audioRef: React.RefObject<HTMLAudioElement | null>`

**2. Create `src/components/AudioVisualizer.tsx`**
- A canvas-based component that:
  - Accepts the `audioRef` from context
  - On mount, creates an `AudioContext`, a `MediaElementSourceNode` (from the audio element), and an `AnalyserNode`
  - Uses `requestAnimationFrame` to read frequency data and draw vertical bars on a small `<canvas>`
  - Bars are drawn in `hsl(0 0% 8%)` (foreground black) to match the meter aesthetic
  - Handles the "already connected" edge case (a `MediaElementSource` can only be created once per element, so the node is stored via a ref and reused)
  - Cleans up the animation frame on unmount

**3. Add the visualizer to `LiveBar.tsx`**
- Import `AudioVisualizer` and render it in the `hidden md:flex` section, next to the progress slider
- Only render when `hasTrack` is true and `isPlaying` is true
- Wrapped in a `meter-inset` styled container for the recessed instrument look

### Technical Details

```text
AudioPlayerContext
  audioRef ──> <audio> element
                  │
AudioVisualizer   │
  AudioContext ───┤
  createMediaElementSource(audioRef.current)
       │
  AnalyserNode
       │
  getByteFrequencyData() ──> canvas bars
```

- The `MediaElementSourceNode` is created lazily on first play and cached so it is never duplicated
- `fftSize` set to 64 (gives 32 frequency bins; we draw ~16-24 of them)
- Canvas uses `devicePixelRatio` for crisp rendering
- Animation loop pauses when `isPlaying` is false to save CPU

### Files changed
| File | Change |
|------|--------|
| `src/contexts/AudioPlayerContext.tsx` | Expose `audioRef` in context value |
| `src/components/AudioVisualizer.tsx` | New component (canvas + Web Audio) |
| `src/components/LiveBar.tsx` | Import and render the visualizer |
