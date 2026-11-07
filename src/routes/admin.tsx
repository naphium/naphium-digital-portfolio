import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { BASE_DATA, blank, loadData, mergeData, resetData, saveData, useApplyTheme, type PortfolioData } from "@/lib/portfolio";

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
const label = (k: string) => k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
const IMG = /^(image|icon|avatarUrl|bannerUrl)$/;
const FONTS = ["Geist", "Geist Mono", "Inter Tight", "Manrope", "Plus Jakarta Sans", "Outfit", "Sora", "DM Sans", "Space Grotesk", "Figtree", "Onest", "Urbanist", "IBM Plex Sans", "IBM Plex Mono", "JetBrains Mono", "Space Mono", "Fira Code", "Hind Siliguri", "Noto Sans Bengali"];

function Field({ name, value, onChange }: { name: string; value: V; onChange: (v: V) => void }) {
  if (typeof value === "boolean")
    return <label className="flex items-center gap-2"><input type="checkbox" className="h-4 w-4 accent-[var(--primary)]" checked={value} onChange={(e) => onChange(e.target.checked)} /><span className="text-sm text-foreground">{label(name)}</span></label>;
  if (typeof value === "number")
    return <label className="block"><span className="admin-label">{label(name)}</span><input type="number" className="field" value={value} onChange={(e) => onChange(+e.target.value)} /></label>;
  if (typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value))
    return (
      <label className="block"><span className="admin-label">{label(name)}</span>
        <div className="flex gap-2"><input type="color" className="h-9 w-12 shrink-0 cursor-pointer rounded border border-input bg-transparent" value={value} onChange={(e) => onChange(e.target.value)} /><input className="field font-mono" value={value} onChange={(e) => onChange(e.target.value)} /></div>
      </label>
    );
  if (typeof value === "string" && IMG.test(name))
    return (
      <label className="block"><span className="admin-label">{label(name)} — paste a link or upload</span>
        <div className="flex items-center gap-2">
          {value && <img src={value} alt="" className="h-9 w-9 shrink-0 rounded object-cover" />}
          <input className="field" placeholder="https://…" value={value.startsWith("data:") ? "(uploaded image)" : value} onChange={(e) => onChange(e.target.value)} />
          <span className="chip cursor-pointer whitespace-nowrap">Upload<input type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; if (f.size > 1.5e6) { toast.error("Image too big (max 1.5 MB) — use a link instead"); return; } const r = new FileReader(); r.onload = () => onChange(r.result as string); r.readAsDataURL(f); }} /></span>
          {value && <button type="button" aria-label="Clear" className="icon-btn shrink-0" onClick={() => onChange("")}><Trash2 size={14} /></button>}
        </div>
      </label>
    );
  if (typeof value === "string")
    return (
      <label className="block"><span className="admin-label">{label(name)}{name === "url" ? " (audio file link: mp3 / ogg)" : name === "discordId" ? " (numeric user ID — join discord.gg/lanyard for live status)" : ""}</span>
        {value.length > 60 ? <textarea className="field min-h-20" value={value} onChange={(e) => onChange(e.target.value)} /> : <input className="field" list={name.startsWith("font") ? "font-list" : undefined} value={value} onChange={(e) => onChange(e.target.value)} />}
      </label>
    );
  if (Array.isArray(value))
    return (
      <div className="rounded border border-border p-3">
        <div className="mb-2 flex items-center justify-between"><span className="admin-label">{label(name)} ({value.length})</span>
          <button type="button" className="chip chip-active flex items-center gap-1" onClick={() => onChange([...value, value.length ? blank(value[0]) : ""])}><Plus size={12} />Add</button></div>
        <div className="space-y-2">
          {value.map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="flex-1"><Field name={`#${i + 1}`} value={item} onChange={(nv) => onChange(value.map((x, k) => (k === i ? nv : x)))} /></div>
              <button type="button" aria-label="Remove" className="icon-btn mt-5" onClick={() => onChange(value.filter((_, k) => k !== i))}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      </div>
    );
  if (value && typeof value === "object")
    return (
      <fieldset className="space-y-2 rounded border border-border p-3">
        <legend className="px-1 font-mono text-[11px] text-primary">{label(name)}</legend>
        {Object.entries(value).map(([k, v]) => <Field key={k} name={k} value={v} onChange={(nv) => onChange({ ...value, [k]: nv })} />)}
      </fieldset>
    );
  return null;
}

function Admin() {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [pass, setPass] = useState("");
  const [ok, setOk] = useState(false);
  const [section, setSection] = useState<keyof PortfolioData>("profile");
  useEffect(() => { setData(loadData()); setOk(sessionStorage.getItem("naphium:admin") === "1"); }, []);
  useApplyTheme((data ?? BASE_DATA).theme);
  if (!data) return null;

  if (!ok)
    return (
      <main className="grid min-h-screen place-items-center px-4">
        <form className="panel w-full max-w-sm space-y-3 p-6" onSubmit={(e) => { e.preventDefault(); if (pass === data.admin.passcode) { sessionStorage.setItem("naphium:admin", "1"); setOk(true); } else toast.error("Wrong passcode"); }}>
          <h1 className="font-serif text-2xl text-foreground">/admin</h1>
          <p className="font-mono text-[11px] text-muted-foreground">Owner access only.</p>
          <input type="password" className="field" placeholder="Passcode" value={pass} onChange={(e) => setPass(e.target.value)} autoFocus />
          <button className="btn-primary w-full">Unlock</button>
        </form>
      </main>
    );

  const keys = Object.keys(BASE_DATA) as (keyof PortfolioData)[];
  return (
    <main className="mx-auto max-w-4xl px-4 py-8 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-serif text-2xl text-foreground">Admin panel</h1>
        <div className="flex flex-wrap gap-2">
          <Link to="/" className="chip">View site</Link>
          <button className="chip" onClick={() => { const b = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "naphium-data.json"; a.click(); }}>Export</button>
          <label className="chip cursor-pointer">Import<input type="file" accept="application/json" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; try { setData(mergeData(JSON.parse(await f.text()))); toast.success("Imported — press Save"); } catch { toast.error("Invalid file"); } }} /></label>
          <button className="chip" onClick={() => { if (confirm("Reset everything to defaults?")) { resetData(); setData(BASE_DATA); toast.success("Reset"); } }}>Reset</button>
          <button className="chip" onClick={() => { sessionStorage.removeItem("naphium:admin"); setOk(false); }}>Lock</button>
        </div>
      </div>
      <nav className="mt-4 grid grid-cols-3 gap-1.5 sm:grid-cols-7">
        {keys.map((k) => <button key={k} onClick={() => setSection(k)} className={`tab-btn ${section === k ? "tab-active" : ""}`}>{label(k)}</button>)}
      </nav>
      <datalist id="font-list">{FONTS.map((f) => <option key={f} value={f} />)}</datalist>
      <p className="mt-3 font-mono text-xs text-muted-foreground">Fonts: type any Google Fonts name. Colors and fonts preview live here before saving.</p>
      <div className="panel mt-4 p-4">
        <Field name={section} value={data[section]} onChange={(v) => setData({ ...data, [section]: v } as PortfolioData)} />
      </div>
      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background/90 p-3 backdrop-blur">
        <div className="mx-auto flex max-w-4xl justify-end"><button className="btn-primary" onClick={() => { try { saveData(data); toast.success("Saved"); } catch { toast.error("Storage full — use image links instead of uploads"); } }}>Save changes</button></div>
      </div>
    </main>
  );
}
