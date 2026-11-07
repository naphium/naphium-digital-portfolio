// Uploaded music lives in this browser's IndexedDB (too big for localStorage).
// Track urls that start with "idb:" point to a stored file.
const DB = "naphium-media", ST = "files";
const cache = new Map<string, string>();

function db() {
  return new Promise<IDBDatabase>((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(ST);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}

export async function putMedia(f: Blob) {
  const id = `idb:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const d = await db();
  await new Promise((res, rej) => {
    const t = d.transaction(ST, "readwrite");
    t.objectStore(ST).put(f, id);
    t.oncomplete = res;
    t.onerror = () => rej(t.error);
  });
  return id;
}

export async function getMediaUrl(id: string) {
  if (!id.startsWith("idb:")) return id;
  if (cache.has(id)) return cache.get(id)!;
  try {
    const d = await db();
    const b = await new Promise<Blob | undefined>((res) => {
      const r = d.transaction(ST).objectStore(ST).get(id);
      r.onsuccess = () => res(r.result as Blob | undefined);
      r.onerror = () => res(undefined);
    });
    if (!b) return "";
    const u = URL.createObjectURL(b);
    cache.set(id, u);
    return u;
  } catch {
    return "";
  }
}
