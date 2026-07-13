/**
 * Shimmer text effect for premium feel
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface ShimmerTextProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const ShimmerText = ({ className, children, ...props }: ShimmerTextProps) => {
  return (
    <div
      className={cn(
        'relative animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent bg-[length:200%_100%]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
