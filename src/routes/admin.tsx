import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Activity, ArrowDown, ArrowUp, ChevronRight, Copy, Cpu, Download, ExternalLink, Eye, EyeOff, FolderGit2, HelpCircle, History, Image, Info,
  KeyRound, LayoutList, Link2, Lock, Maximize2, Minimize2, Music, Palette, Plus, RotateCcw, Settings, Sparkles, Target, Trash2, Upload, User,
} from "lucide-react";
import { BASE_DATA, blank, loadData, mergeData, resetData, saveData, saveDraft, useApplyTheme, type PortfolioData } from "@/lib/portfolio";
import { putMedia } from "@/lib/media";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin · Md. Nafim Muttaki Portfolio" },
      { name: "description", content: "Owner panel to edit every detail of the naphium portfolio." },
      { property: "og:title", content: "Admin · Md. Nafim Muttaki Portfolio" },
      { property: "og:description", content: "Owner panel for the naphium portfolio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

type V = unknown;
type Key = keyof PortfolioData;
const label = (k: string) => k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
const IMG = /^(image|icon|avatarUrl|bannerUrl)$/;
const FONTS = [
  "Geist", "Geist Mono", "Inter", "Inter Tight", "Manrope", "Plus Jakarta Sans", "Outfit", "Sora", "DM Sans", "Space Grotesk", "Figtree", "Onest",
  "Urbanist", "Lexend", "Albert Sans", "Be Vietnam Pro", "Red Hat Display", "Instrument Sans", "Hanken Grotesk", "Schibsted Grotesk",
  "Bricolage Grotesque", "Public Sans", "Work Sans", "Rubik", "Nunito Sans", "Mona Sans", "Hubot Sans", "Golos Text", "Wix Madefor Display",
  "Instrument Serif", "Fraunces", "Newsreader", "Playfair Display", "Cormorant Garamond", "IBM Plex Sans", "IBM Plex Mono", "JetBrains Mono",
  "Space Mono", "Fira Code", "Martian Mono", "DM Mono", "Roboto Mono", "Hind Siliguri", "Noto Sans Bengali", "Anek Bangla", "Tiro Bangla",
];
const SECTIONS: Record<Key, { icon: typeof User; desc: string }> = {
  profile: { icon: User, desc: "Name, bio, photo, banner and Discord ID." },
  theme: { icon: Palette, desc: "Colors, fonts, corner roundness and card borders." },
  settings: { icon: Settings, desc: "Music autoplay, default banner and default dark/light mode." },
  tabs: { icon: LayoutList, desc: "Reorder the menu buttons with the arrows, rename them or hide them." },
  presence: { icon: Activity, desc: "Status shown when no Discord ID is set." },
  about: { icon: Info, desc: "Overview, philosophy and any number of sections (like Hardware or Metrics). Layout: list or grid." },
  links: { icon: Link2, desc: "Social and developer handles. Icons load automatically." },
  projects: { icon: FolderGit2, desc: "Work with links, images and tags." },
  skills: { icon: Sparkles, desc: "Skill groups, levels and badges." },
  timeline: { icon: History, desc: "Milestones in order." },
  goals: { icon: Target, desc: "What you're working toward." },
  setup: { icon: Cpu, desc: "Rig, network and software." },
  album: { icon: Image, desc: "Gallery pieces and photos." },
  tracks: { icon: Music, desc: "Upload songs or paste mp3 links. Tracks without audio play the built-in synth." },
  faq: { icon: HelpCircle, desc: "Questions and answers." },
  admin: { icon: KeyRound, desc: "Passcode to open this panel." },
};
const PALETTES: Record<string, Partial<PortfolioData["theme"]>> = {
  Slate: { background: "#000000", surface: "#1f3149", card: "#142030", primary: "#a9c4dc", primaryText: "#000000", accent: "#4f6f8f", text: "#ffffff", mutedText: "#9fb3c8" },
  Mono: { background: "#0a0a0a", surface: "#1c1c1c", card: "#141414", primary: "#f2f2f2", primaryText: "#0a0a0a", accent: "#5a5a5a", text: "#ffffff", mutedText: "#a3a3a3" },
  Midnight: { background: "#05060f", surface: "#1a1d3a", card: "#11132a", primary: "#9fb0ff", primaryText: "#05060f", accent: "#4b55a8", text: "#f4f5ff", mutedText: "#9aa0c8" },
  Forest: { background: "#040806", surface: "#16291f", card: "#0f1c15", primary: "#9fdcb8", primaryText: "#040806", accent: "#3f7a5a", text: "#f2fff7", mutedText: "#9cbfab" },
  Ember: { background: "#0a0605", surface: "#2e1c16", card: "#1d120e", primary: "#f2b89a", primaryText: "#0a0605", accent: "#8a4f38", text: "#fff6f2", mutedText: "#c9a596" },
  Rose: { background: "#09060a", surface: "#2c1a2a", card: "#1c111b", primary: "#f0b3d4", primaryText: "#09060a", accent: "#8a4775", text: "#fff4fa", mutedText: "#c79fb8" },
};
const summary = (x: V) => {
  if (!x || typeof x !== "object") return "";
  const o = x as Record<string, unknown>;
  for (const k of ["title", "name", "q", "label", "section", "mode", "date"]) if (typeof o[k] === "string" && o[k]) return o[k] as string;
  return "";
};
const wide = (v: V) => Array.isArray(v) || (v && typeof v === "object") || (typeof v === "string" && v.length > 60);

function AudioField({ value, onChange }: { value: string; onChange: (v: V) => void }) {
  const up = async (f?: File) => {
    if (!f) return;
    try { onChange(await putMedia(f)); toast.success(`${f.name} uploaded`); } catch { toast.error("Upload failed"); }
  };
  return (
    <label className="block"><span className="admin-label">Audio — upload a song or paste an mp3 link</span>
      <div className="flex items-center gap-2">
        <input className="field" placeholder="https://…/song.mp3" value={value.startsWith("idb:") ? "♪ uploaded song" : value} readOnly={value.startsWith("idb:")} onChange={(e) => onChange(e.target.value)} />
        <span className="chip flex cursor-pointer items-center gap-1 whitespace-nowrap"><Upload size={11} />Upload<input type="file" accept="audio/*" hidden onChange={(e) => up(e.target.files?.[0])} /></span>
        {value && <button type="button" aria-label="Clear" className="icon-btn shrink-0" onClick={() => onChange("")}><Trash2 size={14} /></button>}
      </div>
    </label>
  );
}

function Field({ name, value, onChange, root, top }: { name: string; value: V; onChange: (v: V) => void; root: string; top?: boolean }) {
  if (typeof value === "boolean")
    return (
      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-background/40 px-3 py-2.5">
        <span className="text-sm text-foreground">{label(name)}</span>
        <input type="checkbox" className="h-4 w-4 accent-[var(--primary)]" checked={value} onChange={(e) => onChange(e.target.checked)} />
      </label>
    );
  if (typeof value === "number")
    return (
      <label className="block"><span className="admin-label">{label(name)}</span>
        {name === "level" || name === "progress" || name === "radius" || name === "hue" ? (
          <div className="flex items-center gap-3">
            <input type="range" className="range flex-1" min={0} max={name === "hue" ? 360 : name === "radius" ? 24 : 100} value={value} onChange={(e) => onChange(+e.target.value)} />
            <span className="w-10 text-right font-mono text-xs text-muted-foreground">{value}</span>
          </div>
        ) : <input type="number" className="field" value={value} onChange={(e) => onChange(+e.target.value)} />}
      </label>
    );
  if (typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value))
    return (
      <label className="block"><span className="admin-label">{label(name)}</span>
        <div className="flex gap-2"><input type="color" className="h-9 w-12 shrink-0 cursor-pointer rounded-lg border-0 bg-transparent" value={value} onChange={(e) => onChange(e.target.value)} /><input className="field font-mono" value={value} onChange={(e) => onChange(e.target.value)} /></div>
      </label>
    );
  if (typeof value === "string" && root === "tracks" && name === "url") return <AudioField value={value} onChange={onChange} />;
  if (typeof value === "string" && name === "defaultBanner")
    return (
      <label className="block"><span className="admin-label">Default banner</span>
        <select className="field" value={value} onChange={(e) => onChange(e.target.value)}>{["tactical", "contour", "cosmic", "slate"].map((b) => <option key={b}>{b}</option>)}</select>
      </label>
    );
  if (typeof value === "string" && (name === "layout" || name === "defaultMode")) {
    const opts = name === "layout" ? ["list", "grid"] : ["dark", "light"];
    return (
      <label className="block"><span className="admin-label">{label(name)}</span>
        <select className="field" value={value} onChange={(e) => onChange(e.target.value)}>{opts.map((b) => <option key={b}>{b}</option>)}</select>
      </label>
    );
  }
  if (typeof value === "string" && root === "tabs" && name === "id")
    return <div><span className="admin-label">Section</span><div className="field opacity-70">{value}</div></div>;
  if (typeof value === "string" && IMG.test(name))
    return (
      <label className="block"><span className="admin-label">{label(name)} — paste a link or upload</span>
        <div className="flex items-center gap-2">
          {value && <img src={value} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" />}
          <input className="field" placeholder="https://…" value={value.startsWith("data:") ? "(uploaded image)" : value} onChange={(e) => onChange(e.target.value)} />
          <span className="chip flex cursor-pointer items-center gap-1 whitespace-nowrap"><Upload size={11} />Upload<input type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; if (f.size > 1.5e6) { toast.error("Image too big (max 1.5 MB) — use a link instead"); return; } const r = new FileReader(); r.onload = () => onChange(r.result as string); r.readAsDataURL(f); }} /></span>
          {value && <button type="button" aria-label="Clear" className="icon-btn shrink-0" onClick={() => onChange("")}><Trash2 size={14} /></button>}
        </div>
      </label>
    );
  if (typeof value === "string")
    return (
      <label className="block"><span className="admin-label">{label(name)}{name === "discordId" ? " — numeric user ID (join discord.gg/lanyard for live status)" : ""}</span>
        {value.length > 60 ? <textarea className="field min-h-24" value={value} onChange={(e) => onChange(e.target.value)} /> : <input type={name === "passcode" ? "password" : "text"} className="field" list={name.startsWith("font") ? "font-list" : undefined} value={value} onChange={(e) => onChange(e.target.value)} />}
        {name.startsWith("font") && value && <p className="mt-1.5 text-base text-foreground" style={{ fontFamily: `"${value}"` }}>The quick brown fox — ১২৩</p>}
      </label>
    );
  if (Array.isArray(value)) {
    const objs = typeof value[0] === "object" && value[0] !== null;
    const move = (i: number, j: number) => { if (j < 0 || j >= value.length) return; const c = [...value]; [c[i], c[j]] = [c[j], c[i]]; onChange(c); };
    const stop = (f: () => void) => (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); f(); };
    const bulk = async (files: FileList | null) => {
      if (!files?.length) return;
      const add: V[] = [];
      for (const f of Array.from(files)) {
        try { add.push({ ...(blank(value[0] ?? {}) as object), title: f.name.replace(/\.[^.]+$/, ""), artist: "naphium", bpm: 90, notes: [], url: await putMedia(f) }); } catch {}
      }
      onChange([...value, ...add]);
      toast.success(`${add.length} song${add.length === 1 ? "" : "s"} added — press Save`);
    };
    const tools = (i: number) => (
      <div className="flex shrink-0 items-center gap-0.5">
        <button type="button" aria-label="Move up" className="icon-btn h-7 w-7" onClick={stop(() => move(i, i - 1))}><ArrowUp size={12} /></button>
        <button type="button" aria-label="Move down" className="icon-btn h-7 w-7" onClick={stop(() => move(i, i + 1))}><ArrowDown size={12} /></button>
        {objs && <button type="button" aria-label="Duplicate" className="icon-btn h-7 w-7" onClick={stop(() => onChange([...value.slice(0, i + 1), structuredClone(value[i]), ...value.slice(i + 1)]))}><Copy size={12} /></button>}
        <button type="button" aria-label="Remove" className="icon-btn h-7 w-7" onClick={stop(() => onChange(value.filter((_, k) => k !== i)))}><Trash2 size={12} /></button>
      </div>
    );
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="admin-label !mb-0">{label(name)} · {value.length}</span>
          <div className="flex gap-1.5">
            {top && root === "tracks" && <label className="chip flex cursor-pointer items-center gap-1"><Music size={11} />Upload songs<input type="file" accept="audio/*" multiple hidden onChange={(e) => bulk(e.target.files)} /></label>}
            <button type="button" className="chip chip-active flex items-center gap-1" onClick={() => onChange([...value, value.length ? blank(value[0]) : ""])}><Plus size={11} />Add</button>
          </div>
        </div>
        {value.map((item, i) =>
          objs ? (
            <details key={i} className="admin-item group" open={value.length === 1}>
              <summary className="flex cursor-pointer items-center gap-2 px-3 py-2.5">
                <ChevronRight size={14} className="shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
                <span className="min-w-0 flex-1 truncate text-sm text-foreground">{summary(item) || `Item ${i + 1}`}</span>
                {tools(i)}
              </summary>
              <div className="px-3 pb-3"><Field name="" root={root} value={item} onChange={(nv) => onChange(value.map((x, k) => (k === i ? nv : x)))} /></div>
            </details>
          ) : (
            <div key={i} className="flex items-center gap-2">
              <div className="flex-1"><Field name={`#${i + 1}`} root={root} value={item} onChange={(nv) => onChange(value.map((x, k) => (k === i ? nv : x)))} /></div>
              {tools(i)}
            </div>
          ),
        )}
      </div>
    );
  }
  if (value && typeof value === "object") {
    const grid = (
      <div className="grid gap-3 sm:grid-cols-2">
        {Object.entries(value).map(([k, v]) => (
          <div key={k} className={wide(v) ? "sm:col-span-2" : ""}><Field name={k} root={root} value={v} onChange={(nv) => onChange({ ...value, [k]: nv })} /></div>
        ))}
      </div>
    );
    if (top || !name) return grid;
    return <div className="space-y-2 rounded-xl bg-background/30 p-3"><span className="admin-label">{label(name)}</span>{grid}</div>;
  }
  return null;
}

function Admin() {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [pass, setPass] = useState("");
  const [ok, setOk] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [preview, setPreview] = useState(true);
  const [wideP, setWideP] = useState(false);
  const [section, setSection] = useState<Key>("profile");
  const ref = useRef<PortfolioData | null>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  ref.current = data;
  useEffect(() => { setData(loadData()); setOk(sessionStorage.getItem("naphium:admin") === "1"); }, []);
  useApplyTheme((data ?? BASE_DATA).theme);
  useEffect(() => { if (data) saveDraft(data); }, [data]);
  const save = () => {
    if (!ref.current) return;
    try { saveData(ref.current); setDirty(false); toast.success("Saved"); } catch { toast.error("Storage full — use image links instead of uploads"); }
  };
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); save(); } };
    const u = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };
    window.addEventListener("keydown", k); window.addEventListener("beforeunload", u);
    return () => { window.removeEventListener("keydown", k); window.removeEventListener("beforeunload", u); };
  });
  if (!data) return null;
  const update = (d: PortfolioData) => { setData(d); setDirty(true); };

  if (!ok)
    return (
      <main className="grid min-h-screen place-items-center px-4">
        <form className="panel w-full max-w-sm space-y-4 p-7" onSubmit={(e) => { e.preventDefault(); if (pass === data.admin.passcode) { sessionStorage.setItem("naphium:admin", "1"); setOk(true); } else toast.error("Wrong passcode"); }}>
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary text-primary-foreground"><Lock size={18} /></div>
          <div><h1 className="text-2xl text-foreground">Studio</h1><p className="text-sm text-muted-foreground">Owner access only.</p></div>
          <input type="password" className="field" placeholder="Passcode" value={pass} onChange={(e) => setPass(e.target.value)} autoFocus />
          <button className="btn-primary w-full">Unlock</button>
        </form>
      </main>
    );

  const keys = Object.keys(SECTIONS) as Key[];
  const S = SECTIONS[section];
  const nav = (k: Key, cls = "") => { const I = SECTIONS[k].icon; return <button key={k} data-active={section === k} onClick={() => setSection(k)} className={`nav-item ${cls}`}><I size={15} />{label(k)}</button>; };
  const iconBtn = (title: string, I: typeof User, on: () => void) => <button title={title} aria-label={title} className="icon-btn" onClick={on}><I size={14} /></button>;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border/40 bg-background/70 backdrop-blur-xl">
        <div className="flex min-h-14 flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary font-mono text-[11px] font-semibold text-primary-foreground">{data.profile.avatarInitials || "N"}</div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-foreground">Studio</div>
            <div className="truncate font-mono text-[10px] text-muted-foreground">{dirty ? "● unsaved changes · Ctrl+S" : "all changes saved"}</div>
          </div>
          <div className="ml-auto flex flex-wrap items-center justify-end gap-1.5">
            <span className="hidden lg:inline-flex">{iconBtn(preview ? "Hide preview" : "Show preview", preview ? EyeOff : Eye, () => setPreview(!preview))}</span>
            <Link to="/" target="_blank" title="Open site" aria-label="Open site" className="icon-btn"><ExternalLink size={14} /></Link>
            {iconBtn("Export backup", Download, () => { const b = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "naphium-data.json"; a.click(); })}
            <label title="Import backup" className="icon-btn cursor-pointer"><Upload size={14} /><input type="file" accept="application/json" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; try { update(mergeData(JSON.parse(await f.text()))); toast.success("Imported — press Save"); } catch { toast.error("Invalid file"); } }} /></label>
            {iconBtn("Reset to defaults", RotateCcw, () => { if (confirm("Reset everything to defaults?")) { resetData(); setData(BASE_DATA); setDirty(false); toast.success("Reset"); } })}
            {iconBtn("Lock", Lock, () => { sessionStorage.removeItem("naphium:admin"); setOk(false); })}
            <button className="btn-primary ml-1 !px-4 !py-2" onClick={save}>Save</button>
          </div>
        </div>
      </header>
      <div className="flex">
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-52 shrink-0 space-y-0.5 overflow-y-auto border-r border-border/40 p-3 md:block">{keys.map((k) => nav(k))}</aside>
        <main className="min-w-0 flex-1 overflow-x-hidden px-4 py-6 pb-24 md:px-8">
          <nav className="-mx-4 mb-5 flex flex-wrap gap-1 px-4 pb-1 md:hidden">{keys.map((k) => nav(k, "!w-auto shrink-0"))}</nav>
          <div className="mx-auto max-w-2xl animate-in fade-in duration-300" key={section}>
            <h1 className="flex items-center gap-2.5 text-2xl text-foreground"><S.icon size={20} className="text-primary" />{label(section)}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{S.desc}</p>
            {section === "theme" && (
              <div className="mt-5">
                <span className="admin-label">Palette presets</span>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(PALETTES).map(([n, p]) => (
                    <button key={n} onClick={() => update({ ...data, theme: { ...data.theme, ...p } })} className="flex items-center gap-2 rounded-full bg-card/70 py-1 pl-1 pr-3 text-xs text-foreground transition hover:bg-secondary">
                      <span className="flex">{[p.background, p.surface, p.primary, p.accent].map((c, i) => <span key={i} className="-ml-1 h-5 w-5 rounded-full first:ml-0" style={{ background: c, boxShadow: "0 0 0 2px var(--background)" }} />)}</span>{n}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-6"><Field top name={section} root={section} value={data[section]} onChange={(v) => update({ ...data, [section]: v } as PortfolioData)} /></div>
          </div>
        </main>
        {preview && (
          <aside className={`sticky top-14 hidden h-[calc(100vh-3.5rem)] shrink-0 flex-col border-l border-border/40 lg:flex ${wideP ? "w-[52vw]" : "w-[420px]"}`}>
            <div className="flex items-center justify-between px-3 py-2">
              <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground"><span className="live-dot" />Live preview</span>
              <div className="flex gap-1">
                {iconBtn("Reload", RotateCcw, () => frame.current?.contentWindow?.location.reload())}
                {iconBtn(wideP ? "Narrow" : "Wide", wideP ? Minimize2 : Maximize2, () => setWideP(!wideP))}
              </div>
            </div>
            <iframe ref={frame} title="Live preview" src="/?preview" className="flex-1 border-0" />
          </aside>
        )}
      </div>
      <datalist id="font-list">{FONTS.map((f) => <option key={f} value={f} />)}</datalist>
    </div>
  );
}
