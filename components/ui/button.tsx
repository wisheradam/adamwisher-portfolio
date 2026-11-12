import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "icon" | "sm";
}

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  default: "liquid-button liquid-button--primary",
  outline: "liquid-button",
  ghost: "bg-transparent hover:bg-surface",
};

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  default: "min-h-12 px-5 text-sm",
  sm: "min-h-11 px-3 text-xs",
  icon: "h-12 w-12",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "focus-ring inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:pointer-events-none disabled:opacity-40",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
