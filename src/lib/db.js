// Tiny IndexedDB wrapper. Everything is stored locally on the device.

// Deliberately left as the app's original name, not renamed to Woolgaze:
// this is IndexedDB's own database identifier, and anyone who already has
// the app installed has their projects/yarn/patterns stored under it —
// changing it would silently orphan all of that data behind an empty new
// database. Invisible to users either way; only touch it with a real
// migration, not a rename.
const DB_NAME = 'hearth-and-hook';
const DB_VERSION = 2;
const STORES = ['projects', 'yarn', 'patterns', 'charts', 'barcodes', 'folders'];

let dbPromise = null;

function open() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const name of STORES) {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, { keyPath: 'id' });
        }
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx(store, mode, fn) {
  return open().then(db => new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const result = fn(t.objectStore(store));
    t.oncomplete = () => resolve(result.result !== undefined ? result.result : result);
    t.onerror = () => reject(t.error);
  }));
}

export const db = {
  async getAll(store) {
    const req = await tx(store, 'readonly', s => s.getAll());
    return req;
  },
  async get(store, id) {
    return tx(store, 'readonly', s => s.get(id));
  },
  async put(store, value) {
    if (!value.id) value.id = crypto.randomUUID();
    value.updatedAt = Date.now();
    if (!value.createdAt) value.createdAt = value.updatedAt;
    await tx(store, 'readwrite', s => s.put(value));
    return value;
  },
  async delete(store, id) {
    return tx(store, 'readwrite', s => s.delete(id));
  },
  async exportAll() {
    const out = { app: 'woolgaze', version: DB_VERSION, exportedAt: new Date().toISOString() };
    for (const name of STORES) {
      if (name === 'patterns') {
        // Blobs can't go into JSON; encode file bytes as base64.
        const items = await this.getAll(name);
        out[name] = await Promise.all(items.map(async p => {
          if (!p.blob) return p;
          const buf = await p.blob.arrayBuffer();
          let bin = '';
          const bytes = new Uint8Array(buf);
          const chunk = 0x8000;
          for (let i = 0; i < bytes.length; i += chunk) {
            bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
          }
          return { ...p, blob: undefined, blobB64: btoa(bin), blobType: p.blob.type };
        }));
      } else {
        out[name] = await this.getAll(name);
      }
    }
    return out;
  },
  async importAll(data) {
    // Accept backups tagged with the app's old name too, so a file
    // exported before the Woolgaze rename still imports.
    if (data.app !== 'woolgaze' && data.app !== 'hearth-and-hook') {
      throw new Error('Not a Woolgaze backup file.');
    }
    for (const name of STORES) {
      for (const item of data[name] || []) {
        if (item.blobB64) {
          const bin = atob(item.blobB64);
          const bytes = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
          item.blob = new Blob([bytes], { type: item.blobType || 'application/octet-stream' });
          delete item.blobB64;
          delete item.blobType;
        }
        await tx(name, 'readwrite', s => s.put(item));
      }
    }
  }
};

// Small settings helper backed by localStorage (theme, keys, text size).
export const settings = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem('hh:' + key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem('hh:' + key, JSON.stringify(value)); } catch { /* storage full/blocked */ }
  }
};
