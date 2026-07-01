const DB_NAME = "orbit-media-cache";
const STORE_NAME = "media";
const DB_VERSION = 1;
const MAX_ENTRIES = 200;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "url" });
        store.createIndex("added", "added");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function evictIfNeeded(db: IDBDatabase) {
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);
  const count = await new Promise<number>((resolve) => {
    const req = store.count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(0);
  });
  if (count < MAX_ENTRIES) return;
  const index = store.index("added");
  const cursor = index.openCursor(null, "next");
  let deleted = 0;
  const tx2 = db.transaction(STORE_NAME, "readwrite");
  const store2 = tx2.objectStore(STORE_NAME);
  return new Promise<void>((resolve) => {
    cursor.onsuccess = () => {
      if (cursor.result && deleted < 20) {
        store2.delete(cursor.result.value.url);
        deleted++;
        cursor.result.continue();
      } else {
        resolve();
      }
    };
  });
}

export async function cacheMedia(url: string, blob: Blob) {
  try {
    const db = await openDB();
    await evictIfNeeded(db);
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put({ url, blob, type: blob.type, added: Date.now() });
  } catch {}
}

export async function getCachedMedia(url: string): Promise<Blob | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const result = await new Promise<{ blob: Blob } | undefined>((resolve) => {
      const req = store.get(url);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(undefined);
    });
    return result?.blob ?? null;
  } catch {
    return null;
  }
}

const blobUrlCache = new Map<string, string>();

export async function getMediaUrl(url: string): Promise<string> {
  const existing = blobUrlCache.get(url);
  if (existing) return existing;
  const blob = await getCachedMedia(url);
  if (blob) {
    const blobUrl = URL.createObjectURL(blob);
    blobUrlCache.set(url, blobUrl);
    return blobUrl;
  }
  return url;
}

export function downloadAndCache(url: string) {
  fetch(url)
    .then((r) => r.blob())
    .then((blob) => cacheMedia(url, blob))
    .catch(() => {});
}
