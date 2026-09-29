// Pattern viewer — read an uploaded pattern in-app instead of handing it
// off to a new tab, so a PDF pattern can carry a page bookmark with it.
//
// There's no way to observe scroll/page position inside a plain <iframe>
// PDF view (no PDF.js here, deliberately — this stays a small dependency
// -free viewer), so "keeping your place" works the same way every counter
// in this app already does: you tell it where you are. The stepper
// records that bookmark instantly; the viewer itself only jumps to a page
// on load or when you explicitly ask it to, so bumping the count while
// you're mid-read never yanks the page out from under you.

import { useEffect, useMemo, useState } from 'react';
import { db } from '@/lib/db.js';
import { announce } from '@/lib/announce.js';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Minus, Plus, ExternalLink } from '@/lib/icons.jsx';

export default function PatternViewer({ id, navigate }) {
  const [pattern, setPattern] = useState(null);
  const [page, setPage] = useState(1);
  const [viewedPage, setViewedPage] = useState(1);
  const [textContent, setTextContent] = useState(null);

  useEffect(() => {
    db.get('patterns', id).then(p => {
      if (!p) return navigate('patterns');
      setPattern(p);
      const start = p.currentPage || 1;
      setPage(start);
      setViewedPage(start);
    });
  }, [id, navigate]);

  const blobUrl = useMemo(() => (pattern?.blob ? URL.createObjectURL(pattern.blob) : null), [pattern?.blob]);
  useEffect(() => () => { if (blobUrl) URL.revokeObjectURL(blobUrl); }, [blobUrl]);

  const isPdf = pattern?.mime === 'application/pdf';
  const isImage = !!pattern?.mime?.startsWith('image/');
  const isText = pattern?.mime === 'text/plain' || pattern?.fileName?.toLowerCase().endsWith('.txt');

  useEffect(() => {
    if (!isText || !pattern?.blob) return;
    pattern.blob.text().then(setTextContent);
  }, [isText, pattern?.blob]);

  if (!pattern) return null;

  const bumpPage = (delta) => {
    const next = Math.max(1, page + delta);
    setPage(next);
    db.put('patterns', { ...pattern, currentPage: next });
    announce(`Page ${next}`);
    if (navigator.vibrate) navigator.vibrate(10);
  };
  const jumpTo = () => {
    setViewedPage(page);
    announce(`Jumped to page ${page}`);
  };

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

      {isPdf && (
        <div className="mb-3 grid gap-2 rounded-xl border bg-secondary p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Your place</p>
              <p className="text-xs text-muted-foreground">Bookmarked for next time you open this pattern.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="size-11" aria-label="Back one page" onClick={() => bumpPage(-1)}>
                <Minus aria-hidden="true" />
              </Button>
              <output className="min-w-[3ch] text-center text-lg font-bold tabular-nums" aria-live="off">{page}</output>
              <Button size="icon" className="size-11" aria-label="Forward one page" onClick={() => bumpPage(1)}>
                <Plus aria-hidden="true" />
              </Button>
            </div>
          </div>
          {page !== viewedPage && (
            <Button variant="outline" size="sm" className="min-h-11 justify-self-start" onClick={jumpTo}>
              Jump viewer to page {page}
            </Button>
          )}
        </div>
      )}

      {isPdf && blobUrl && (
        <iframe
          key={viewedPage}
          title={pattern.title}
          src={`${blobUrl}#page=${viewedPage}`}
          className="h-[70vh] w-full rounded-xl border bg-card"
        />
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
