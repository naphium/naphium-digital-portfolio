import { useEffect, useRef, useState } from "react";
import { Pause, Play, SkipBack, SkipForward, Volume2 } from "lucide-react";

type Track = { title: string; artist: string; bpm: number; notes: number[] };
const LENGTH = 90; // seconds per track loop

export function AudioPlayer({ tracks, index, setIndex }: { tracks: Track[]; index: number; setIndex: (i: number) => void }) {
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const [vol, setVol] = useState(0.5);
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const stepRef = useRef(0);
  const posRef = useRef(0);
  const track = tracks[index % Math.max(tracks.length, 1)];

  useEffect(() => { if (gainRef.current) gainRef.current.gain.value = vol * 0.25; }, [vol]);
  useEffect(() => { posRef.current = 0; setPos(0); stepRef.current = 0; }, [index]);

  useEffect(() => {
    if (!playing || !track) return;
    const ctx = ctxRef.current!;
    const stepSec = 60 / track.bpm / 2;
    const id = setInterval(() => {
      const now = ctx.currentTime;
      const f = track.notes[stepRef.current % track.notes.length] ?? 220;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = stepRef.current % 4 === 0 ? "triangle" : "sine";
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.6, now + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + stepSec * 1.8);
      o.connect(g).connect(gainRef.current!);
      o.start(now); o.stop(now + stepSec * 2);
      if (stepRef.current % 8 === 0) {
        const b = ctx.createOscillator(), bg = ctx.createGain();
        b.frequency.value = f / 2; b.type = "sine";
        bg.gain.setValueAtTime(0.5, now); bg.gain.exponentialRampToValueAtTime(0.0001, now + stepSec * 6);
        b.connect(bg).connect(gainRef.current!); b.start(now); b.stop(now + stepSec * 6);
      }
      stepRef.current++;
      posRef.current += stepSec;
      if (posRef.current >= LENGTH) { setIndex((index + 1) % tracks.length); return; }
      setPos(posRef.current);
    }, (60 / track.bpm / 2) * 1000);
    return () => clearInterval(id);
  }, [playing, track, index, tracks.length, setIndex]);

  const toggle = async () => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
      gainRef.current = ctxRef.current.createGain();
      gainRef.current.gain.value = vol * 0.25;
      gainRef.current.connect(ctxRef.current.destination);
    }
    await ctxRef.current.resume();
    setPlaying((p) => !p);
  };
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  if (!track) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-2.5">
        <div className="flex h-8 items-end gap-0.5" aria-hidden>
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className={`eq-bar w-1 rounded-sm bg-primary ${playing ? "" : "paused"}`} style={{ animationDelay: `${i * 0.12}s` }} />
          ))}
        </div>
        <div className="min-w-0 flex-1 basis-32">
          <div className="truncate font-serif text-sm text-foreground">{track.title}</div>
          <div className="truncate font-mono text-[11px] text-muted-foreground">{track.artist} · {track.bpm} BPM</div>
        </div>
        <div className="flex items-center gap-1">
          <button aria-label="Previous" className="icon-btn" onClick={() => setIndex((index - 1 + tracks.length) % tracks.length)}><SkipBack size={16} /></button>
          <button aria-label={playing ? "Pause" : "Play"} className="icon-btn bg-primary text-primary-foreground" onClick={toggle}>{playing ? <Pause size={16} /> : <Play size={16} />}</button>
          <button aria-label="Next" className="icon-btn" onClick={() => setIndex((index + 1) % tracks.length)}><SkipForward size={16} /></button>
        </div>
        <div className="flex flex-1 basis-48 items-center gap-2 font-mono text-[11px] text-muted-foreground">
          <span>{fmt(pos)}</span>
          <input aria-label="Seek" type="range" min={0} max={LENGTH} value={pos} onChange={(e) => { posRef.current = +e.target.value; setPos(+e.target.value); }} className="range flex-1" />
          <span>{fmt(LENGTH)}</span>
        </div>
        <label className="flex items-center gap-1.5 text-muted-foreground">
          <Volume2 size={14} />
          <input aria-label="Volume" type="range" min={0} max={1} step={0.01} value={vol} onChange={(e) => setVol(+e.target.value)} className="range w-20" />
        </label>
      </div>
    </div>
  );
}
