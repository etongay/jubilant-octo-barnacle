import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from '@/lib/icons.jsx';
import { cn } from '@/lib/utils';

function Checkbox({ className, ...props }) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        'peer border-input bg-card data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary size-5 shrink-0 rounded-[4px] border shadow-xs disabled:opacity-50',
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
        <Check className="size-4" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
