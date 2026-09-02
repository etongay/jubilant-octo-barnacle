// A horizontally scrolling row of toggle chips, used for both picking a
// project's tags and filtering the list by them. Chips are real buttons
// carrying aria-pressed, so a screen reader reads the on/off state and
// the whole row is reachable by Tab.

import { Button } from '@/components/ui/button';
import { Plus } from '@/lib/icons.jsx';
import { cn } from '@/lib/utils.js';

export function TagChips({ tags, selected, onToggle, onNew, label, className }) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn('-mx-1 flex gap-2 overflow-x-auto px-1 py-1', className)}
    >
      {tags.map(tag => {
        const on = selected.includes(tag);
        return (
          <Button
            key={tag}
            type="button"
            size="sm"
            variant={on ? 'default' : 'outline'}
            aria-pressed={on}
            onClick={() => onToggle(tag)}
            className="min-h-11 shrink-0 rounded-full font-medium"
          >
            {tag}
          </Button>
        );
      })}
      {onNew && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onNew}
          className="min-h-11 shrink-0 rounded-full border-dashed text-link"
        >
          <Plus aria-hidden="true" /> New tag
        </Button>
      )}
    </div>
  );
}
