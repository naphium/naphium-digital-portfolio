import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy, ExternalLink, Eye, X } from "lucide-react";
import { TopoCanvas } from "@/components/TopoCanvas";
import { AudioPlayer } from "@/components/AudioPlayer";
import { useLocal, usePortfolio, type PortfolioData } from "@/lib/portfolio";

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
        <footer className="mt-12 text-center font-mono text-[11px] text-muted-foreground">
          {data.profile.coords} · © {new Date().getFullYear()} {data.profile.username}
        </footer>
      </main>
      <AudioPlayer tracks={data.tracks} index={track} setIndex={setTrack} />
    </div>
  );
}

function Hero({ data }: { data: PortfolioData }) {
  const p = data.profile;
  const now = useNow();
  const [banner, setBanner] = useLocal<string>("naphium:banner", "tactical");
  const [act, setAct] = useState(0);
  const [since, setSince] = useState<number | null>(null);
  useEffect(() => setSince(Date.now()), [act]);
  const elapsed = now && since ? Math.max(0, Math.floor((now.getTime() - since) / 1000)) : 0;
  const pr = data.presence[act] ?? data.presence[0];
  const time = now?.toLocaleTimeString("en-GB", { timeZone: "Asia/Dhaka" }) ?? "--:--:--";
  return (
    <header className="panel overflow-hidden">
      <div className={`banner banner-${banner} relative h-28 sm:h-36`}>
        <div className="absolute right-2 top-2 flex gap-1">
          {BANNERS.map((b) => (
            <button key={b} onClick={() => setBanner(b)} className={`chip ${banner === b ? "chip-active" : ""}`}>{b}</button>
          ))}
        </div>
        <span className="absolute bottom-2 left-3 font-mono text-[10px] text-muted-foreground">{p.coords}</span>
      </div>
      <div className="-mt-12 flex flex-col items-center px-4 pb-6 text-center">
        <div className="relative">
          <div className="avatar">{p.avatarInitials}</div>
          <span className="status-dot" aria-label="Online" />
        </div>
        <h1 className="text-gradient mt-4 font-serif text-5xl leading-none sm:text-6xl">{p.name}</h1>
        <p className="mt-1 font-mono text-xs tracking-widest text-muted-foreground">({p.nickname}) · @{p.username}</p>
        <p className="mt-2 font-mono text-[11px] text-muted-foreground">{p.location} · {time} BST</p>
        <p className="mt-4 font-serif text-xl italic text-primary">{p.tagline}</p>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">{p.bio}</p>

        <div className="mt-6 w-full max-w-md rounded-md border border-border bg-card p-3 text-left">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 font-mono text-xs text-foreground"><span className="live-dot" />{p.statusLabel}</span>
            <div className="flex gap-1">
              {data.presence.map((x, i) => (
                <button key={i} onClick={() => setAct(i)} className={`chip ${act === i ? "chip-active" : ""}`}>{x.mode}</button>
              ))}
            </div>
          </div>
          {pr && (
            <div className="mt-3 flex items-center gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded bg-secondary font-mono text-xs text-primary">{pr.mode.slice(0, 2).toUpperCase()}</div>
              <div className="min-w-0">
                <div className="truncate text-sm text-foreground">{pr.detail}</div>
                <div className="truncate font-mono text-[11px] text-muted-foreground">{pr.state}</div>
                <div className="font-mono text-[11px] text-primary">{String(Math.floor(elapsed / 60)).padStart(2, "0")}:{String(elapsed % 60).padStart(2, "0")} elapsed</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

const H = ({ children }: { children: React.ReactNode }) => <h2 className="mb-3 font-serif text-2xl text-foreground">{children}</h2>;
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
      <Card><H>Academics</H><div className="grid grid-cols-2 gap-2">{d.about.metrics.map((m, i) => (<div key={i} className="rounded border border-border p-3"><div className="font-serif text-lg text-foreground">{m.value}</div><div className="font-mono text-[11px] text-muted-foreground">{m.label}</div></div>))}</div></Card>
      <Card className="md:col-span-2"><H>Workstation</H><KV items={d.about.hardware} /></Card>
    </div>
  );
}

function Links({ d }: { d: PortfolioData }) {
  const [views, setViews] = useLocal<Record<string, number>>("naphium:views", {});
  const cats = [...new Set(d.links.map((l) => l.category))];
  const bump = (n: string) => setViews({ ...views, [n]: (views[n] ?? 0) + 1 });
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cats.map((c) => (
        <Card key={c}>
          <H>{c}</H>
          <ul className="space-y-2">
            {d.links.filter((l) => l.category === c).map((l) => (
              <li key={l.name} className="flex items-center gap-2 rounded border border-border p-2">
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-foreground">{l.name}</div>
                  <div className="truncate font-mono text-[11px] text-muted-foreground">{l.handle}</div>
                </div>
                <span className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground"><Eye size={11} />{(views[l.name] ?? 0) + 12}</span>
                <button aria-label={`Copy ${l.name}`} className="icon-btn" onClick={() => { navigator.clipboard.writeText(l.handle); toast.success(`${l.name} copied`, { description: l.handle }); }}><Copy size={14} /></button>
                <a aria-label={`Open ${l.name}`} className="icon-btn" href={l.url} target="_blank" rel="noreferrer" onClick={() => bump(l.name)}><ExternalLink size={14} /></a>
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
        <Card key={i}>
          <div className="flex items-center justify-between font-mono text-[11px] text-muted-foreground"><span>{p.category}</span><span className="chip chip-active">{p.status}</span></div>
          <h3 className="mt-2 font-serif text-2xl text-foreground">{p.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
          <div className="mt-3 flex flex-wrap gap-1">{p.tags.map((t) => <span key={t} className="chip">{t}</span>)}</div>
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
            <div className="font-mono text-[11px] text-primary">{t.date}</div>
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
            <div className="aspect-square overflow-hidden transition-transform duration-500 group-hover:scale-105"><Art hue={a.hue} seed={i + 1} /></div>
            <div className="p-2"><div className="text-sm text-foreground">{a.title}</div><div className="font-mono text-[10px] text-muted-foreground">{a.caption}</div></div>
          </button>
        ))}
      </div>
      {cur && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/90 p-4 backdrop-blur" onClick={() => setOpen(null)}>
          <div className="panel w-full max-w-lg animate-in zoom-in-90 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="aspect-square"><Art hue={cur.hue} seed={open! + 1} /></div>
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
            <div className="flex justify-between font-mono text-[11px] text-muted-foreground"><span><span className="text-foreground">{n.name}</span>{n.role && ` · ${n.role}`}</span><span>{n.at}</span></div>
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
      <p className="mb-3 text-sm text-muted-foreground">Every track is synthesized live in your browser — no audio files. Pick one, then press play in the bottom bar.</p>
      <ul className="divide-y divide-border">
        {d.tracks.map((t, i) => (
          <li key={i}><button onClick={() => setTrack(i)} className={`flex w-full items-center justify-between py-3 text-left ${track === i ? "text-primary" : "text-foreground"}`}>
            <span className="font-serif">{String(i + 1).padStart(2, "0")} · {t.title}</span><span className="font-mono text-[11px] text-muted-foreground">{t.bpm} BPM</span>
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
