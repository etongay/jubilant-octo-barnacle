import * as React from 'react';
import { cn } from '@/lib/utils';

function Input({ className, type, ...props }) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'border-input bg-card flex min-h-11 w-full min-w-0 rounded-md border px-3 py-2 text-base shadow-xs transition-colors file:inline-flex file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground disabled:pointer-events-none disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
}

export { Input };
