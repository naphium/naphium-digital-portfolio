import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { DEFAULT_DATA, loadData, resetData, saveData, type PortfolioData } from "@/lib/portfolio";

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

function blank(v: V): V {
  if (typeof v === "string") return "";
  if (typeof v === "number") return 0;
  if (Array.isArray(v)) return [];
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, blank(x)]));
  return "";
}

function Field({ name, value, onChange }: { name: string; value: V; onChange: (v: V) => void }) {
  if (typeof value === "number")
    return <label className="block"><span className="admin-label">{label(name)}</span><input type="number" className="field" value={value} onChange={(e) => onChange(+e.target.value)} /></label>;
  if (typeof value === "string")
    return (
      <label className="block"><span className="admin-label">{label(name)}</span>
        {value.length > 60 ? <textarea className="field min-h-20" value={value} onChange={(e) => onChange(e.target.value)} /> : <input className="field" value={value} onChange={(e) => onChange(e.target.value)} />}
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

  const keys = Object.keys(DEFAULT_DATA) as (keyof PortfolioData)[];
  return (
    <main className="mx-auto max-w-4xl px-4 py-8 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-serif text-2xl text-foreground">Admin panel</h1>
        <div className="flex flex-wrap gap-2">
          <Link to="/" className="chip">View site</Link>
          <button className="chip" onClick={() => { const b = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "naphium-data.json"; a.click(); }}>Export</button>
          <label className="chip cursor-pointer">Import<input type="file" accept="application/json" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; try { setData({ ...DEFAULT_DATA, ...JSON.parse(await f.text()) }); toast.success("Imported — press Save"); } catch { toast.error("Invalid file"); } }} /></label>
          <button className="chip" onClick={() => { if (confirm("Reset everything to defaults?")) { resetData(); setData(DEFAULT_DATA); toast.success("Reset"); } }}>Reset</button>
          <button className="chip" onClick={() => { sessionStorage.removeItem("naphium:admin"); setOk(false); }}>Lock</button>
        </div>
      </div>
      <nav className="mt-4 grid grid-cols-3 gap-1.5 sm:grid-cols-6">
        {keys.map((k) => <button key={k} onClick={() => setSection(k)} className={`tab-btn ${section === k ? "tab-active" : ""}`}>{label(k)}</button>)}
      </nav>
      <div className="panel mt-4 p-4">
        <Field name={section} value={data[section]} onChange={(v) => setData({ ...data, [section]: v } as PortfolioData)} />
      </div>
      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background/90 p-3 backdrop-blur">
        <div className="mx-auto flex max-w-4xl justify-end"><button className="btn-primary" onClick={() => { saveData(data); toast.success("Saved"); }}>Save changes</button></div>
      </div>
    </main>
  );
}
