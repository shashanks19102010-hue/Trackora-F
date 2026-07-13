/**
 * Animated button component with premium feel
 */

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  isLoading?: boolean;
  children: React.ReactNode;
}

export const AnimatedButton = React.forwardRef<
  HTMLButtonElement,
  AnimatedButtonProps
>((
  { variant = 'primary', size = 'md', icon, isLoading, className, children, ...props },
  ref
) => {
  const baseStyles =
    'relative font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2';

  const variants = {
    primary:
      'bg-gradient-to-r from-signal to-signal-glow text-white hover:shadow-lg hover:shadow-signal/50 active:scale-95',
    secondary:
      'bg-steel dark:bg-steel-dark text-white hover:bg-opacity-80 active:scale-95',
    outline:
      'border-2 border-signal text-signal hover:bg-signal hover:bg-opacity-10 active:scale-95',
    ghost: 'text-foreground hover:bg-muted active:scale-95',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-6 py-2.5 text-base',
    lg: 'px-8 py-3 text-lg',
  };

  return (
    <motion.button
      ref={ref}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      whileHover={{ scale: isLoading ? 1 : 1.02 }}
      whileTap={{ scale: 0.98 }}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <motion.div
          className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      ) : icon ? (
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
        >
          {icon}
        </motion.div>
      ) : null}
      {children}
    </motion.button>
  );
});

AnimatedButton.displayName = 'AnimatedButton';
