/**
 * Glassmorphism card component with backdrop blur
 */

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassmorphCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  children: React.ReactNode;
}

export const GlassmorphCard = React.forwardRef<
  HTMLDivElement,
  GlassmorphCardProps
>(({ hoverEffect = true, className, children, ...props }, ref) => {
  return (
    <motion.div
      ref={ref}
      className={cn(
        'relative rounded-2xl backdrop-blur-xl border border-glass-border bg-glass-light',
        'shadow-lg hover:shadow-xl transition-all duration-300',
        hoverEffect && 'hover:bg-glass-border/50 hover:border-glass-border',
        className
      )}
      whileHover={hoverEffect ? { y: -5, scale: 1.02 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      {...props}
    >
      <div className="relative z-10">{children}</div>
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-mint/5 to-signal/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </motion.div>
  );
});

GlassmorphCard.displayName = 'GlassmorphCard';
