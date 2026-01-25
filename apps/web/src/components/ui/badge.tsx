import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        neutral: 'bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground',
        verified: 'bg-success/10 text-success dark:bg-success/20 dark:text-success',
        pending: 'bg-warning/10 text-warning dark:bg-warning/20 dark:text-warning',
        rejected: 'bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive',
        warning: 'bg-warning/10 text-warning dark:bg-warning/20 dark:text-warning',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
