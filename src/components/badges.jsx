// Two badge shapes, deliberately different so they are never confused at a
// glance: status is one value out of a fixed set and reads as a state chip
// at 8px; tags are an open-ended list and read as pills.
//
// Both are presentational. Tags label an item — they are not the way you
// filter by them. Filtering lives in the Filter sheet, so browsing the full
// list stays the default and tags never behave like hidden controls.

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils.js';

export function StatusBadge({ className, ...props }) {
  return <Badge className={cn('rounded-[8px]', className)} {...props} />;
}

export function TagBadge({ className, ...props }) {
  return <Badge className={cn('rounded-full font-normal', className)} {...props} />;
}

/** A non-interactive row of tags for a list item. Renders nothing when empty. */
export function TagList({ tags, className, label = 'Tags' }) {
  if (!tags?.length) return null;
  return (
    <ul aria-label={label} className={cn('flex list-none flex-wrap gap-1 p-0', className)}>
      {tags.map(t => <li key={t}><TagBadge>{t}</TagBadge></li>)}
    </ul>
  );
}
