import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy, ExternalLink, Globe, Mail, X } from "lucide-react";
import { TopoCanvas } from "@/components/TopoCanvas";
import { AudioPlayer } from "@/components/AudioPlayer";
import { useApplyTheme, useLocal, usePortfolio, type PortfolioData } from "@/lib/portfolio";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Md. Nafim Muttaki Portfolio" },
      { name: "description", content: "Portfolio, links and dev dashboard of Md. Nafim Muttaki (naphium) — student developer from Rajshahi, Bangladesh." },
      { property: "og:title", content: "Md. Nafim Muttaki Portfolio" },
      { property: "og:description", content: "Projects, skills, links and setup of naphium from Rajshahi, Bangladesh." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const TABS = ["About", "Links", "Projects", "Skills", "Timeline", "Goals", "Setup", "Album", "Guestbook", "Audio", "FAQ"] as const;
type Tab = (typeof TABS)[number];
const BANNERS = ["tactical", "contour", "cosmic", "slate"] as const;

function useNow() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function Index() {
  const data = usePortfolio();
  const [tab, setTab] = useState<Tab>("About");
  const [track, setTrack] = useState(0);
  useApplyTheme(data.theme);
  return (
    <div className="min-h-screen pb-32">
      <TopoCanvas />
      <main className="mx-auto max-w-5xl px-4 pt-6 sm:pt-12">
        <Hero data={data} />
        <nav className="panel mt-6 grid grid-cols-3 gap-1.5 p-1.5 sm:grid-cols-6 lg:grid-cols-11" aria-label="Sections">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`tab-btn ${tab === t ? "tab-active" : ""}`}>{t}</button>
          ))}
        </nav>
        <section className="mt-6 animate-in fade-in duration-300" key={tab}>
          {tab === "About" && <About d={data} />}
          {tab === "Links" && <Links d={data} />}
          {tab === "Projects" && <Projects d={data} />}
          {tab === "Skills" && <Skills d={data} />}
          {tab === "Timeline" && <Timeline d={data} />}
          {tab === "Goals" && <Goals d={data} />}
          {tab === "Setup" && <Setup d={data} />}
          {tab === "Album" && <Album d={data} />}
          {tab === "Guestbook" && <Guestbook />}
          {tab === "Audio" && <Audio d={data} track={track} setTrack={setTrack} />}
          {tab === "FAQ" && <Faq d={data} />}
        </section>
        <footer className="mt-12 text-center font-mono text-xs text-muted-foreground">
          {data.profile.coords} · © {new Date().getFullYear()} {data.profile.username}
        </footer>
      </main>
      <AudioPlayer tracks={data.tracks} index={track} setIndex={setTrack} autoplay={data.settings.autoplayMusic} />
    </div>
  );
}

type Act = { type: number; name: string; details?: string; state?: string; application_id?: string; assets?: { large_image?: string }; timestamps?: { start?: number } };
type Lan = {
  discord_status: string;
  discord_user: { id: string; username: string; global_name?: string; avatar?: string };
  activities?: Act[];
  listening_to_spotify?: boolean;
  spotify?: { song: string; artist: string; album_art_url?: string; timestamps?: { start?: number } };
};
const ACT_TYPES = ["Playing", "Streaming", "Listening to", "Watching", "", "Competing in"];
const actImg = (a: Act) => {
  const i = a.assets?.large_image;
  if (!i) return undefined;
  if (i.startsWith("mp:")) return `https://media.discordapp.net/${i.slice(3)}`;
  if (i.startsWith("spotify:")) return `https://i.scdn.co/image/${i.slice(8)}`;
  return a.application_id ? `https://cdn.discordapp.com/app-assets/${a.application_id}/${i}.png` : undefined;
};
/** Live Discord presence via Lanyard websocket (falls back to one REST fetch). */
function useLanyard(id: string) {
  const [d, setD] = useState<Lan | null>(null);
  useEffect(() => {
    const uid = id?.trim();
    if (!uid) { setD(null); return; }
    let on = true, ws: WebSocket | null = null;
    let hb: ReturnType<typeof setInterval> | undefined, retry: ReturnType<typeof setTimeout> | undefined;
    fetch(`https://api.lanyard.rest/v1/users/${uid}`).then((r) => r.json()).then((j) => on && j.success && setD(j.data)).catch(() => {});
    const connect = () => {
      ws = new WebSocket("wss://api.lanyard.rest/socket");
      ws.onmessage = (e) => {
        const m = JSON.parse(e.data);
        if (m.op === 1) {
          hb = setInterval(() => ws?.readyState === 1 && ws.send(JSON.stringify({ op: 3 })), m.d.heartbeat_interval);
          ws?.send(JSON.stringify({ op: 2, d: { subscribe_to_id: uid } }));
        } else if (m.op === 0 && (m.t === "INIT_STATE" || m.t === "PRESENCE_UPDATE") && m.d?.discord_user && on) setD(m.d);
      };
      ws.onclose = () => { clearInterval(hb); if (on) retry = setTimeout(connect, 5000); };
    };
    connect();
    return () => { on = false; clearInterval(hb); clearTimeout(retry); ws?.close(); };
  }, [id]);
  return d;
}
const fmtEl = (s: number) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
  return `${h ? `${h}:` : ""}${String(m).padStart(2, "0")}:${String(x).padStart(2, "0")}`;
};

function Hero({ data }: { data: PortfolioData }) {
  const p = data.profile;
  const now = useNow();
  const lan = useLanyard(p.discordId);
  const [pick, setPick] = useState<string | null>(null);
  const banner = pick ?? data.settings.defaultBanner;
  const [act, setAct] = useState(0);
  const [since, setSince] = useState<number | null>(null);
  useEffect(() => setSince(Date.now()), [act]);
  const time = now?.toLocaleTimeString("en-GB", { timeZone: "Asia/Dhaka" }) ?? "--:--:--";
  const du = lan?.discord_user;
  const avatar = p.avatarUrl || (du?.avatar ? `https://cdn.discordapp.com/avatars/${du.id}/${du.avatar}.png?size=256` : "");

  const rows: { img?: string | undefined; mode: string; title: string; sub: string; start: number | null }[] = [];
  let label = p.statusLabel;
  if (lan) {
    const custom = lan.activities?.find((x) => x.type === 4)?.state;
    label = `${du?.global_name || du?.username} · ${lan.discord_status}${custom ? ` · ${custom}` : ""}`;
    if (lan.listening_to_spotify && lan.spotify) rows.push({ img: lan.spotify.album_art_url, mode: "Listening to Spotify", title: lan.spotify.song, sub: lan.spotify.artist, start: lan.spotify.timestamps?.start ?? null });
    for (const a of lan.activities ?? []) {
      if (a.type === 4 || (a.type === 2 && a.name === "Spotify" && lan.listening_to_spotify)) continue;
      rows.push({ img: actImg(a), mode: `${ACT_TYPES[a.type] ?? "Playing"} ${a.name}`, title: a.details || a.name, sub: a.state || "", start: a.timestamps?.start ?? null });
    }
    if (!rows.length) rows.push({ mode: "Discord", title: "Not doing anything right now", sub: lan.discord_status, start: null });
  } else {
    const pr = data.presence[act] ?? data.presence[0];
    if (pr) rows.push({ mode: pr.mode, title: pr.detail, sub: pr.state, start: since });
  }

  return (
    <header className="panel overflow-hidden">
      <div
        className={`banner ${p.bannerUrl ? "" : `banner-${banner}`} relative h-32 sm:h-44`}
        style={p.bannerUrl ? { backgroundImage: `url("${p.bannerUrl}")`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
      >
        {!p.bannerUrl && data.settings.showBannerPicker && (
          <div className="absolute right-2 top-2 flex gap-1">
            {BANNERS.map((b) => (
              <button key={b} onClick={() => setPick(b)} className={`chip ${banner === b ? "chip-active" : ""}`}>{b}</button>
            ))}
          </div>
        )}
        <span className="absolute bottom-2 left-3 font-mono text-xs text-muted-foreground">{p.coords}</span>
      </div>
      <div className="-mt-12 flex flex-col items-center px-4 pb-6 text-center">
        <div className="relative">
          <div className="avatar">{avatar ? <img src={avatar} alt={p.name} className="h-full w-full object-cover" /> : p.avatarInitials}</div>
          <span className="status-dot" data-status={lan?.discord_status} aria-label={lan?.discord_status ?? "Online"} />
        </div>
        <h1 className="text-gradient mt-4 font-serif text-4xl sm:text-5xl">{p.name}</h1>
        <p className="mt-2 font-mono text-xs tracking-wider text-muted-foreground">({p.nickname}) · @{p.username}</p>
        <p className="mt-1 font-mono text-xs text-muted-foreground">{p.location} · {time} BST</p>
        <p className="mt-4 text-lg font-medium text-primary">{p.tagline}</p>
        <p className="mt-2 max-w-xl text-[15px] text-muted-foreground">{p.bio}</p>

        <div className="mt-6 w-full max-w-md rounded-2xl bg-background/40 p-3 text-left backdrop-blur">
          <div className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-2 font-mono text-xs text-foreground"><span className="live-dot shrink-0" /><span className="truncate">{label}</span></span>
            {!lan && (
              <div className="flex gap-1">
                {data.presence.map((x, i) => (
                  <button key={i} onClick={() => setAct(i)} className={`chip ${act === i ? "chip-active" : ""}`}>{x.mode}</button>
                ))}
              </div>
            )}
          </div>
          {rows.map((row, i) => {
            const elapsed = now && row.start ? Math.max(0, Math.floor((now.getTime() - row.start) / 1000)) : 0;
            return (
              <div key={i} className="mt-3 flex items-center gap-3">
                {row.img ? <img src={row.img} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" /> : <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-secondary font-mono text-xs text-primary">{row.mode.replace(/^(Playing|Streaming|Listening to|Watching|Competing in) /, "").slice(0, 2).toUpperCase()}</div>}
                <div className="min-w-0">
                  <div className="truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{row.mode}</div>
                  <div className="truncate text-sm font-medium text-foreground">{row.title}</div>
                  {row.sub && <div className="truncate text-xs text-muted-foreground">{row.sub}</div>}
                  {row.start ? <div className="font-mono text-xs text-primary">{fmtEl(elapsed)} elapsed</div> : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </header>
  );
}

function LinkIcon({ url, icon }: { url: string; icon?: string | undefined }) {
  const [err, setErr] = useState(false);
  let src = icon;
  if (!src) {
    try { const u = new URL(url); if (u.protocol.startsWith("http")) src = `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=64`; } catch {}
  }
  if (!src || err) return <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary text-primary">{url.startsWith("mailto:") ? <Mail size={15} /> : <Globe size={15} />}</div>;
  return <img src={src} alt="" loading="lazy" onError={() => setErr(true)} className="h-9 w-9 shrink-0 rounded-lg bg-secondary object-contain p-2" />;
}

const H = ({ children }: { children: React.ReactNode }) => <h2 className="mb-3 font-serif text-lg text-foreground">{children}</h2>;
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => <div className={`panel p-4 ${className}`}>{children}</div>;
const KV = ({ items }: { items: { label: string; value: string }[] }) => (
  <dl className="divide-y divide-border">
    {items.map((i, k) => (
      <div key={k} className="flex justify-between gap-4 py-2 text-sm"><dt className="font-mono text-xs text-muted-foreground">{i.label}</dt><dd className="text-right text-foreground">{i.value}</dd></div>
    ))}
  </dl>
);

function About({ d }: { d: PortfolioData }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="md:col-span-2"><H>Overview</H><p className="text-sm leading-relaxed text-muted-foreground">{d.about.overview}</p></Card>
      <Card><H>Engineering philosophy</H><p className="text-sm leading-relaxed text-muted-foreground">{d.about.philosophy}</p></Card>
      <Card><H>Academics</H><div className="grid grid-cols-2 gap-2">{d.about.metrics.map((m, i) => (<div key={i} className="rounded-lg bg-background/40 p-3"><div className="font-serif text-lg text-foreground">{m.value}</div><div className="font-mono text-xs text-muted-foreground">{m.label}</div></div>))}</div></Card>
      <Card className="md:col-span-2"><H>Workstation</H><KV items={d.about.hardware} /></Card>
    </div>
  );
}

function Links({ d }: { d: PortfolioData }) {
  const cats = [...new Set(d.links.map((l) => l.category))];
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cats.map((c) => (
        <Card key={c}>
          <H>{c}</H>
          <ul className="space-y-2">
            {d.links.filter((l) => l.category === c).map((l) => (
              <li key={l.name} className="flex items-center gap-3 rounded-xl bg-background/40 p-2 transition-colors hover:bg-secondary/60">
                <LinkIcon url={l.url} icon={l.icon} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-foreground">{l.name}</div>
                  <div className="truncate font-mono text-xs text-muted-foreground">{l.handle}</div>
                </div>
                <button aria-label={`Copy ${l.name}`} className="icon-btn" onClick={() => { navigator.clipboard.writeText(l.handle); toast.success(`${l.name} copied`, { description: l.handle }); }}><Copy size={14} /></button>
                <a aria-label={`Open ${l.name}`} className="icon-btn" href={l.url} target="_blank" rel="noreferrer"><ExternalLink size={14} /></a>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}

function Projects({ d }: { d: PortfolioData }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {d.projects.map((p, i) => (
        <Card key={i} className="overflow-hidden">
          {p.image && <img src={p.image} alt={p.title} loading="lazy" className="-mx-4 -mt-4 mb-4 aspect-video w-[calc(100%+2rem)] max-w-none object-cover" />}
          <div className="flex items-center justify-between font-mono text-xs text-muted-foreground"><span>{p.category}</span><span className="chip chip-active">{p.status}</span></div>
          <h3 className="mt-2 font-serif text-xl text-foreground">{p.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
          <div className="mt-3 flex flex-wrap items-center gap-1">{p.tags.map((t) => <span key={t} className="chip">{t}</span>)}
            {p.link && <a href={p.link} target="_blank" rel="noreferrer" className="chip chip-active ml-auto flex items-center gap-1">Open <ExternalLink size={11} /></a>}
          </div>
        </Card>
      ))}
    </div>
  );
}

function Skills({ d }: { d: PortfolioData }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {d.skills.groups.map((g, i) => (
        <Card key={i}>
          <H>{g.name}</H>
          <div className="space-y-3">{g.items.map((s, k) => (
            <div key={k}><div className="flex justify-between text-sm"><span className="text-foreground">{s.name}</span><span className="font-mono text-xs text-muted-foreground">{s.level}%</span></div>
              <div className="mt-1 h-1 rounded bg-secondary"><div className="h-1 rounded bg-primary" style={{ width: `${s.level}%` }} /></div></div>
          ))}</div>
        </Card>
      ))}
      <Card className="md:col-span-2"><H>Stack</H><div className="flex flex-wrap gap-1.5">{d.skills.badges.map((b) => <span key={b} className="chip">{b}</span>)}</div></Card>
    </div>
  );
}

function Timeline({ d }: { d: PortfolioData }) {
  return (
    <Card>
      <ol className="relative ml-2 border-l border-border">
        {d.timeline.map((t, i) => (
          <li key={i} className="mb-6 ml-5 last:mb-0">
            <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full border border-primary bg-background" />
            <div className="font-mono text-xs text-primary">{t.date}</div>
            <div className="font-serif text-foreground">{t.title}</div>
            <p className="text-sm text-muted-foreground">{t.desc}</p>
          </li>
        ))}
      </ol>
    </Card>
  );
}

function Goals({ d }: { d: PortfolioData }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {d.goals.map((g, i) => (
        <Card key={i}>
          <div className="flex justify-between gap-2"><h3 className="font-serif text-foreground">{g.title}</h3><span className="font-mono text-xs text-primary">{g.progress}%</span></div>
          <p className="mt-1 text-sm text-muted-foreground">{g.desc}</p>
          <div className="mt-3 h-1 rounded bg-secondary"><div className="h-1 rounded bg-accent" style={{ width: `${g.progress}%` }} /></div>
        </Card>
      ))}
    </div>
  );
}

function Setup({ d }: { d: PortfolioData }) {
  return <div className="grid gap-4 md:grid-cols-3">{d.setup.map((s, i) => <Card key={i}><H>{s.section}</H><KV items={s.items} /></Card>)}</div>;
}

function Art({ hue, seed }: { hue: number; seed: number }) {
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full">
      <rect width="200" height="200" fill={`hsl(${hue} 50% 10%)`} />
      {Array.from({ length: 9 }).map((_, i) => (
        <ellipse key={i} cx={100 + Math.sin(seed + i) * 20} cy={100 + Math.cos(seed * 2 + i) * 15} rx={20 + i * 11} ry={14 + i * 9} fill="none" stroke={`hsl(${hue} 45% ${45 + i * 4}%)`} strokeOpacity={0.7 - i * 0.05} strokeWidth="1" transform={`rotate(${seed * 30 + i * 4} 100 100)`} />
      ))}
      <path d="M90 100h20M100 90v20" stroke={`hsl(${hue} 60% 85%)`} />
    </svg>
  );
}

function Album({ d }: { d: PortfolioData }) {
  const [open, setOpen] = useState<number | null>(null);
  const cur = open !== null ? d.album[open] : null;
  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {d.album.map((a, i) => (
          <button key={i} onClick={() => setOpen(i)} className="panel group overflow-hidden text-left">
            <div className="aspect-square overflow-hidden transition-transform duration-500 group-hover:scale-105">{a.image ? <img src={a.image} alt={a.title} loading="lazy" className="h-full w-full object-cover" /> : <Art hue={a.hue} seed={i + 1} />}</div>
            <div className="p-2"><div className="text-sm text-foreground">{a.title}</div><div className="font-mono text-xs text-muted-foreground">{a.caption}</div></div>
          </button>
        ))}
      </div>
      {cur && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/90 p-4 backdrop-blur" onClick={() => setOpen(null)}>
          <div className="panel w-full max-w-lg animate-in zoom-in-90 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="aspect-square">{cur.image ? <img src={cur.image} alt={cur.title} className="h-full w-full object-cover" /> : <Art hue={cur.hue} seed={open! + 1} />}</div>
            <div className="flex items-center justify-between p-3"><div><div className="font-serif text-foreground">{cur.title}</div><div className="font-mono text-xs text-muted-foreground">{cur.caption}</div></div><button aria-label="Close" className="icon-btn" onClick={() => setOpen(null)}><X size={16} /></button></div>
          </div>
        </div>
      )}
    </>
  );
}

type Note = { name: string; role: string; msg: string; at: string };
function Guestbook() {
  const [notes, setNotes] = useLocal<Note[]>("naphium:guestbook", [{ name: "naphium", role: "Owner", msg: "Welcome! Leave a note.", at: "2026-11-01" }]);
  const [f, setF] = useState({ name: "", role: "", msg: "" });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name.trim() || !f.msg.trim()) {
      toast.error("Name and message are required");
      return;
    }
    setNotes([{ ...f, name: f.name.slice(0, 40), role: f.role.slice(0, 30), msg: f.msg.slice(0, 500), at: new Date().toISOString().slice(0, 10) }, ...notes]);
    setF({ name: "", role: "", msg: "" });
    toast.success("Note posted");
  };
  return (
    <div className="grid gap-4 md:grid-cols-[1fr_1.4fr]">
      <Card>
        <H>Sign the wall</H>
        <form onSubmit={submit} className="space-y-2">
          <input className="field" placeholder="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <input className="field" placeholder="Role (e.g. Developer)" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} />
          <textarea className="field min-h-24" placeholder="Message" value={f.msg} onChange={(e) => setF({ ...f, msg: e.target.value })} />
          <button className="btn-primary w-full">Post note</button>
        </form>
      </Card>
      <div className="space-y-2">
        {notes.map((n, i) => (
          <Card key={i}>
            <div className="flex justify-between font-mono text-xs text-muted-foreground"><span><span className="text-foreground">{n.name}</span>{n.role && ` · ${n.role}`}</span><span>{n.at}</span></div>
            <p className="mt-1 text-sm text-muted-foreground">{n.msg}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Audio({ d, track, setTrack }: { d: PortfolioData; track: number; setTrack: (i: number) => void }) {
  return (
    <Card>
      <H>Audio lounge</H>
      <p className="mb-3 text-sm text-muted-foreground">Pick a track, then press play in the bottom bar.</p>
      <ul className="divide-y divide-border">
        {d.tracks.map((t, i) => (
          <li key={i}><button onClick={() => setTrack(i)} className={`flex w-full items-center justify-between py-3 text-left ${track === i ? "text-primary" : "text-foreground"}`}>
            <span className="font-medium">{String(i + 1).padStart(2, "0")} · {t.title}</span><span className="font-mono text-xs text-muted-foreground">{t.url ? "audio" : `${t.bpm} BPM`}</span>
          </button></li>
        ))}
      </ul>
    </Card>
  );
}

function Faq({ d }: { d: PortfolioData }) {
  return (
    <div className="space-y-2">
      {d.faq.map((f, i) => (
        <details key={i} className="panel group p-4">
          <summary className="flex cursor-pointer list-none items-center justify-between font-serif text-foreground">{f.q}<span className="font-mono text-primary transition-transform group-open:rotate-45">+</span></summary>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
