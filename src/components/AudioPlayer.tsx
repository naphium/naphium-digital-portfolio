import { useEffect, useRef, useState } from "react";
import { Pause, Play, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { getMediaUrl } from "@/lib/media";

type Track = { title: string; artist: string; bpm: number; notes: number[]; url?: string };
const LENGTH = 90; // seconds per synth loop

export function AudioPlayer({ tracks, index, setIndex, autoplay }: { tracks: Track[]; index: number; setIndex: (i: number) => void; autoplay?: boolean }) {
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const [dur, setDur] = useState(LENGTH);
  const [vol, setVol] = useState(0.5);
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const srcRef = useRef("");
  const stepRef = useRef(0);
  const posRef = useRef(0);
  const track = tracks[index % Math.max(tracks.length, 1)];
  const next = () => setIndex((index + 1) % tracks.length);

  useEffect(() => { audioRef.current = new Audio(); return () => audioRef.current?.pause(); }, []);
  useEffect(() => {
    if (gainRef.current) gainRef.current.gain.value = vol * 0.25;
    if (audioRef.current) audioRef.current.volume = vol;
  }, [vol]);
  useEffect(() => { posRef.current = 0; setPos(0); stepRef.current = 0; setDur(LENGTH); }, [index]);

  const ensureCtx = () => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
      gainRef.current = ctxRef.current.createGain();
      gainRef.current.gain.value = vol * 0.25;
      gainRef.current.connect(ctxRef.current.destination);
    }
    void ctxRef.current.resume();
  };

  useEffect(() => {
    const a = audioRef.current;
    if (!playing || !track || !a) { a?.pause(); return; }
    if (track.url) {
      let alive = true;
      const url = track.url;
      void getMediaUrl(url).then((u) => {
        if (!alive) return;
        if (!u) { setPlaying(false); return; }
        if (srcRef.current !== url) { srcRef.current = url; a.src = u; }
        a.volume = vol;
        a.play().catch(() => setPlaying(false));
      });
      const onT = () => { setPos(a.currentTime); if (a.duration && isFinite(a.duration)) setDur(a.duration); };
      a.addEventListener("timeupdate", onT);
      a.addEventListener("ended", next);
      return () => { alive = false; a.removeEventListener("timeupdate", onT); a.removeEventListener("ended", next); a.pause(); };
    }
    a.pause();
    ensureCtx();
    const ctx = ctxRef.current!;
    const stepSec = 60 / (track.bpm || 90) / 2;
    const id = setInterval(() => {
      const now = ctx.currentTime;
      const f = track.notes[stepRef.current % Math.max(track.notes.length, 1)] ?? 220;
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
      if (posRef.current >= LENGTH) { next(); return; }
      setPos(posRef.current);
    }, stepSec * 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, track, index, tracks.length]);

  // Autoplay: try right away (works for audio files when the browser allows it),
  // otherwise start on the visitor's first tap or key press anywhere on the page.
  useEffect(() => {
    if (!autoplay) return;
    const evs = ["pointerdown", "keydown", "touchstart"] as const;
    const off = () => evs.forEach((e) => window.removeEventListener(e, go));
    function go(e: Event) {
      off();
      if ((e.target as Element | null)?.closest?.("[data-player]")) return;
      ensureCtx();
      setPlaying(true);
    }
    evs.forEach((e) => window.addEventListener(e, go));
    if (tracks[0]?.url) setPlaying(true);
    return off;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoplay]);

  const toggle = () => { ensureCtx(); setPlaying((p) => !p); };
  const seek = (v: number) => { posRef.current = v; setPos(v); if (track?.url && audioRef.current) audioRef.current.currentTime = v; };
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  if (!track) return null;

  return (
    <div data-player className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-2.5">
        <div className="flex h-8 items-end gap-0.5" aria-hidden>
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className={`eq-bar w-1 rounded-sm bg-primary ${playing ? "" : "paused"}`} style={{ animationDelay: `${i * 0.12}s` }} />
          ))}
        </div>
        <div className="min-w-0 flex-1 basis-32">
          <div className="truncate text-sm font-medium text-foreground">{track.title}</div>
          <div className="truncate font-mono text-xs text-muted-foreground">{track.artist}{track.url ? "" : ` · ${track.bpm} BPM`}</div>
        </div>
        <div className="flex items-center gap-1">
          <button aria-label="Previous" className="icon-btn" onClick={() => setIndex((index - 1 + tracks.length) % tracks.length)}><SkipBack size={16} /></button>
          <button aria-label={playing ? "Pause" : "Play"} className="icon-btn bg-primary text-primary-foreground" onClick={toggle}>{playing ? <Pause size={16} /> : <Play size={16} />}</button>
          <button aria-label="Next" className="icon-btn" onClick={next}><SkipForward size={16} /></button>
        </div>
        <div className="flex flex-1 basis-48 items-center gap-2 font-mono text-xs text-muted-foreground">
          <span>{fmt(pos)}</span>
          <input aria-label="Seek" type="range" min={0} max={dur} step={0.5} value={pos} onChange={(e) => seek(+e.target.value)} className="range flex-1" />
          <span>{fmt(dur)}</span>
        </div>
        <label className="flex items-center gap-1.5 text-muted-foreground">
          <Volume2 size={14} />
          <input aria-label="Volume" type="range" min={0} max={1} step={0.01} value={vol} onChange={(e) => setVol(+e.target.value)} className="range w-20" />
        </label>
      </div>
    </div>
  );
}
