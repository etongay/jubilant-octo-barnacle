import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const alertVariants = cva(
  'flex flex-col gap-0.5 rounded-lg border-l-4 px-3.5 py-3 text-sm leading-relaxed',
  {
    variants: {
      variant: {
        default: 'bg-secondary text-secondary-foreground border-l-border',
        error: 'bg-destructive-tint text-destructive-tint-foreground border-l-destructive',
        warning: 'bg-warning-tint text-warning-tint-foreground border-l-warning',
        info: 'bg-info-tint text-info-tint-foreground border-l-info',
        success: 'bg-success-tint text-success-tint-foreground border-l-success',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

// Semantic feedback banner — error/warning/info/success, each backed by a
// theme's own tint + tint-foreground pair (see app.css), so it stays
// readable and on-brand across all six themes rather than importing one
// fixed set of colors. Polite by default (role="status"); pass
// role="alert" for something that should interrupt.
function Alert({ className, variant, role = 'status', ...props }) {
  return (
    <div data-slot="alert" role={role} className={cn(alertVariants({ variant, className }))} {...props} />
  );
}

function AlertTitle({ className, ...props }) {
  return <p data-slot="alert-title" className={cn('font-semibold', className)} {...props} />;
}

function AlertDescription({ className, ...props }) {
  return <p data-slot="alert-description" className={cn(className)} {...props} />;
}

export { Alert, AlertTitle, AlertDescription, alertVariants };
