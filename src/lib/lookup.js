// Barcode → product lookup chain (see README: there is no yarn-industry
// product API, so local scan history comes first, then general UPC
// databases, then Ravelry fills in yarn details by name).

import { db, settings } from './db.js';

export async function lookupBarcode(code) {
  // 1. Local history — a yarn you've scanned before is recognised offline.
  const cached = await db.get('barcodes', code);
  if (cached) {
    const { id, createdAt, updatedAt, ...info } = cached;
    return info;
  }
  // 2. UPCitemdb free trial endpoint (no key, ~100 lookups/day).
  try {
    const res = await fetch('https://api.upcitemdb.com/prod/trial/lookup?upc=' + encodeURIComponent(code));
    if (res.ok) {
      const data = await res.json();
      const item = data.items?.[0];
      if (item) return { brand: item.brand || '', name: item.title || '' };
    }
  } catch { /* offline or rate limited — fall through */ }
  // 3. Go-UPC with the user's own key.
  const key = settings.get('goupcKey', '');
  if (key) {
    try {
      const res = await fetch('https://go-upc.com/api/v1/code/' + encodeURIComponent(code), {
        headers: { Authorization: 'Bearer ' + key },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.product) return { brand: data.product.brand || '', name: data.product.name || '' };
      }
    } catch { /* fall through */ }
  }
  return {};
}

export async function rememberBarcode(yarn) {
  if (!yarn.barcode) return;
  await db.put('barcodes', {
    id: yarn.barcode,
    brand: yarn.brand, name: yarn.name, colorway: yarn.colorway,
    weight: yarn.weight, fiber: yarn.fiber,
  });
}
