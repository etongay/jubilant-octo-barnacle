// Renders page 1 of a PDF blob to a small JPEG data URL, for a pattern's
// thumbnail. Imported dynamically, so pdf.js stays out of the main bundle
// exactly as it does for PatternViewer.

import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export async function pdfThumbnail(blob, width = 640) {
  const doc = await pdfjsLib.getDocument({ data: await blob.arrayBuffer() }).promise;
  try {
    const page = await doc.getPage(1);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: width / base.width });
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    await page.render({ canvasContext: canvas.getContext('2d'), viewport, canvas }).promise;
    return canvas.toDataURL('image/jpeg', 0.8);
  } finally {
    doc.destroy();
  }
}
