import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-signal text-white hover:bg-signal-glow active:scale-[0.98] shadow-[0_0_0_1px_rgba(255,85,51,0.2),0_8px_24px_-8px_rgba(255,85,51,0.5)]",
        secondary: "glass-panel text-foreground hover:bg-glass-border",
        ghost: "hover:bg-secondary text-foreground",
        destructive: "bg-destructive text-destructive-foreground hover:opacity-90",
        outline: "border border-border bg-transparent hover:bg-secondary",
        link: "text-signal underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-4 text-xs",
        lg: "h-13 px-7 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
        ) : null}
        {children}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
