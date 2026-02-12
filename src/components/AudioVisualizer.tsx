import { useRef, useEffect } from "react";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";

const BAR_COUNT = 20;
const FFT_SIZE = 64;

// Cache the source node globally per audio element to avoid "already connected" errors
const sourceNodeMap = new WeakMap<HTMLAudioElement, MediaElementAudioSourceNode>();

export default function AudioVisualizer() {
  const { audioRef, isPlaying } = useAudioPlayer();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const audio = audioRef.current;
    const canvas = canvasRef.current;
    if (!audio || !canvas) return;

    // Lazily create AudioContext + AnalyserNode
    if (!audioCtxRef.current) {
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = FFT_SIZE;

      let source = sourceNodeMap.get(audio);
      if (!source) {
        source = ctx.createMediaElementSource(audio);
        sourceNodeMap.set(audio, source);
      }
      source.connect(analyser);
      analyser.connect(ctx.destination);

      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
    }

    const analyser = analyserRef.current!;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const dpr = window.devicePixelRatio || 1;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    };
    resizeCanvas();

    const ctx2d = canvas.getContext("2d")!;

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      const w = canvas.width;
      const h = canvas.height;
      ctx2d.clearRect(0, 0, w, h);

      const barWidth = Math.floor(w / BAR_COUNT);
      const gap = 1 * dpr;

      ctx2d.fillStyle = "hsl(0 0% 8%)";

      for (let i = 0; i < BAR_COUNT; i++) {
        const binIndex = Math.min(i, bufferLength - 1);
        const value = dataArray[binIndex] / 255;
        const barHeight = Math.max(1 * dpr, value * h);
        const x = i * barWidth;
        const y = h - barHeight;
        ctx2d.fillRect(x, y, barWidth - gap, barHeight);
      }
    };

    if (isPlaying) {
      // Resume AudioContext if suspended (autoplay policy)
      if (audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }
      draw();
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, audioRef]);

  return (
    <canvas
      ref={canvasRef}
      className="w-20 h-6"
      style={{ imageRendering: "pixelated" }}
    />
  );
}
