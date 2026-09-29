// Pattern viewer — read an uploaded pattern in-app, and for a PDF, mark
// the exact spot you're at — not just a page number.
//
// The browser's own PDF viewer (what the old <iframe> version leaned on)
// is a black box: no API tells you where on the page someone tapped, and
// nothing can be drawn on top of it. Getting an actual tap target means
// rendering the page ourselves, onto a <canvas>, via pdf.js — so this
// pulls in pdfjs-dist (lazy-loaded: see the React.lazy() wrapper in
// App.jsx, so its ~1MB doesn't ship on every page that isn't this one).
//
// A mark is a page number plus an (x, y) fraction of that page's size, so
// it survives being re-rendered at a different width or zoom. Tapping the
// page sets it directly; a keyboard-reachable "Mark this page" button
// drops one at page centre for anyone without a pointer, and the pin
// itself is a focusable element arrow keys can nudge from there.

import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { db } from '@/lib/db.js';
import { announce } from '@/lib/announce.js';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Minus, Plus, ExternalLink, MapPin, X } from '@/lib/icons.jsx';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const NUDGE = 0.02;

export default function PatternViewer({ id, navigate }) {
  const [pattern, setPattern] = useState(null);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(null);
  const [mark, setMark] = useState(null); // { page, x, y } — x/y are 0–1 fractions of the page
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pdfError, setPdfError] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [textContent, setTextContent] = useState(null);

  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    db.get('patterns', id).then(p => {
      if (!p) return navigate('patterns');
      setPattern(p);
      const startPage = p.markPage || p.currentPage || 1;
      setPage(startPage);
      if (p.markX != null && p.markY != null) {
        setMark({ page: p.markPage || startPage, x: p.markX, y: p.markY });
      }
    });
  }, [id, navigate]);

  const isPdf = pattern?.mime === 'application/pdf';
  const isImage = !!pattern?.mime?.startsWith('image/');
  const isText = pattern?.mime === 'text/plain' || pattern?.fileName?.toLowerCase().endsWith('.txt');

  const blobUrl = pattern?.blob ? URL.createObjectURL(pattern.blob) : null;
  useEffect(() => () => { if (blobUrl) URL.revokeObjectURL(blobUrl); }, [blobUrl]);

  useEffect(() => {
    if (!isText || !pattern?.blob) return;
    pattern.blob.text().then(setTextContent);
  }, [isText, pattern?.blob]);

  // Load the PDF document once its bytes are available.
  useEffect(() => {
    if (!isPdf || !pattern?.blob) return;
    let cancelled = false;
    let doc;
    pattern.blob.arrayBuffer()
      .then(buf => pdfjsLib.getDocument({ data: buf }).promise)
      .then(d => {
        if (cancelled) { d.destroy(); return; }
        doc = d;
        setPdfDoc(d);
        setPageCount(d.numPages);
      })
      .catch(() => { if (!cancelled) setPdfError(true); });
    return () => { cancelled = true; doc?.destroy(); };
  }, [isPdf, pattern?.blob]);

  // Render the current page to the canvas, sized to the container's width.
  useEffect(() => {
    if (!pdfDoc || !containerRef.current) return;
    let cancelled = false;
    setRendering(true);
    pdfDoc.getPage(page).then(async pdfPage => {
      if (cancelled) return;
      const width = containerRef.current.clientWidth || 375;
      const base = pdfPage.getViewport({ scale: 1 });
      const viewport = pdfPage.getViewport({ scale: width / base.width });
      const canvas = canvasRef.current;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await pdfPage.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
      if (!cancelled) setRendering(false);
    }).catch(() => { if (!cancelled) { setRendering(false); setPdfError(true); } });
    return () => { cancelled = true; };
  }, [pdfDoc, page]);

  // Re-render at the new width on rotation/resize.
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(() => setPage(p => p)); // re-triggers the render effect's width read
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (mark && mark.page === page && !rendering) {
      markerRef.current?.scrollIntoView({ block: 'center', behavior: 'auto' });
    }
  }, [mark, page, rendering]);

  if (!pattern) return null;

  const bumpPage = (delta) => {
    const next = Math.max(1, Math.min(pageCount || Infinity, page + delta));
    setPage(next);
    db.put('patterns', { ...pattern, currentPage: next });
    announce(`Page ${next}`);
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const setMarkAt = (x, y) => {
    const clampedX = Math.min(1, Math.max(0, x));
    const clampedY = Math.min(1, Math.max(0, y));
    setMark({ page, x: clampedX, y: clampedY });
    db.put('patterns', { ...pattern, currentPage: page, markPage: page, markX: clampedX, markY: clampedY });
  };

  const handleCanvasClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    setMarkAt((e.clientX - rect.left) / rect.width, (e.clientY - rect.top) / rect.height);
    announce(`Place marked on page ${page}`);
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const markCenter = () => {
    setMarkAt(0.5, 0.5);
    announce(`Place marked at the centre of page ${page}. Use the arrow keys to fine-tune it.`);
    markerRef.current?.focus();
  };

  const clearMark = () => {
    setMark(null);
    db.put('patterns', { ...pattern, markPage: null, markX: null, markY: null });
    announce('Mark cleared');
  };

  const nudgeMark = (e) => {
    const deltas = { ArrowLeft: [-NUDGE, 0], ArrowRight: [NUDGE, 0], ArrowUp: [0, -NUDGE], ArrowDown: [0, NUDGE] };
    const d = deltas[e.key];
    if (!d || !mark) return;
    e.preventDefault();
    setMarkAt(mark.x + d[0], mark.y + d[1]);
  };

  const markOnThisPage = mark?.page === page ? mark : null;

  return (
    <section aria-labelledby="viewer-heading">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Button variant="outline" onClick={() => navigate('patterns')}>
          <ArrowLeft aria-hidden="true" /> All patterns
        </Button>
        {blobUrl && (
          <Button variant="outline" asChild>
            <a href={blobUrl} target="_blank" rel="noopener noreferrer">
              Open in new tab <ExternalLink aria-hidden="true" />
            </a>
          </Button>
        )}
      </div>
      <h2 id="viewer-heading" className="mb-3">{pattern.title}</h2>

      {isPdf && !pdfError && (
        <div className="mb-3 grid gap-2 rounded-xl border bg-secondary p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Your place</p>
              <p className="text-xs text-muted-foreground">
                {mark ? `Marked on page ${mark.page} — tap the pattern to move it.` : 'Tap the pattern to mark exactly where you are.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="size-11" aria-label="Previous page" onClick={() => bumpPage(-1)}>
                <Minus aria-hidden="true" />
              </Button>
              <output className="min-w-[3ch] text-center text-lg font-bold tabular-nums" aria-live="off">
                {page}{pageCount ? `/${pageCount}` : ''}
              </output>
              <Button size="icon" className="size-11" aria-label="Next page" onClick={() => bumpPage(1)}>
                <Plus aria-hidden="true" />
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="min-h-11" onClick={markCenter}>
              <MapPin aria-hidden="true" /> Mark this page
            </Button>
            {mark && (
              <Button variant="ghost" size="sm" className="min-h-11" onClick={clearMark}>
                <X aria-hidden="true" /> Clear mark
              </Button>
            )}
          </div>
        </div>
      )}

      {isPdf && !pdfError && (
        <div ref={containerRef} className="relative overflow-hidden rounded-xl border bg-card">
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={`Page ${page} of ${pattern.title}${pageCount ? ` of ${pageCount}` : ''}. Tap to mark your place.`}
            onClick={handleCanvasClick}
            className="block w-full cursor-crosshair"
          />
          {rendering && (
            <p className="absolute inset-0 grid place-items-center bg-card/80 text-sm text-muted-foreground">Loading page…</p>
          )}
          {markOnThisPage && (
            <button
              ref={markerRef}
              type="button"
              onKeyDown={nudgeMark}
              aria-label={`Marked spot on page ${page}. Arrow keys fine-tune its position.`}
              className="absolute size-8 -translate-x-1/2 -translate-y-full rounded-full text-primary focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2"
              style={{ left: `${markOnThisPage.x * 100}%`, top: `${markOnThisPage.y * 100}%` }}
            >
              <MapPin className="size-8 drop-shadow" fill="currentColor" aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      {isPdf && pdfError && (
        <p className="py-8 text-center italic text-muted-foreground">
          This PDF couldn't be read for in-app marking — use "Open in new tab" above.
        </p>
      )}

      {isImage && blobUrl && (
        <img src={blobUrl} alt={pattern.title} className="w-full rounded-xl border" />
      )}

      {isText && (
        <pre className="max-h-[70vh] overflow-auto rounded-xl border bg-card p-4 text-sm whitespace-pre-wrap">
          {textContent ?? 'Loading…'}
        </pre>
      )}

      {!isPdf && !isImage && !isText && (
        <p className="py-8 text-center italic text-muted-foreground">
          This file can't be previewed here — use "Open in new tab" above.
        </p>
      )}
    </section>
  );
}
