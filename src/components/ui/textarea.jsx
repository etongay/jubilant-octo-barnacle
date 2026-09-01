import * as React from 'react';
import { cn } from '@/lib/utils';

function Textarea({ className, ...props }) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'border-input bg-card placeholder:text-muted-foreground flex min-h-24 w-full rounded-md border px-3 py-2 text-base shadow-xs disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
