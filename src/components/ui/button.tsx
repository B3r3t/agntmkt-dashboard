// @ts-nocheck
import React from 'react';
import { cn } from '@/lib/utils';

const baseClasses =
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-orange-600 text-white hover:bg-orange-700 focus-visible:ring-orange-500';

export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <button ref={ref} className={cn(baseClasses, className)} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
