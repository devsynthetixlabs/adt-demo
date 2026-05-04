import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "../utils";
import { ButtonVariantProps } from "@/types";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, ButtonVariantProps {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all active:scale-[0.99] cursor-pointer font-sans";

    const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
      primary:
        "bg-orange text-white border-none hover:bg-orange-dark disabled:opacity-55 disabled:cursor-not-allowed",
      secondary:
        "bg-white text-ink border-[1.5px] border-offwhite-dark hover:border-orange-light hover:bg-orange-xpale",
      ghost:
        "bg-transparent text-orange border-none hover:underline",
    };

    const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
      sm: "text-[0.75rem] py-[0.4rem] px-[0.75rem]",
      md: "text-[0.85rem] py-[0.72rem] px-[0.9rem]",
      lg: "text-[0.92rem] py-[0.85rem] px-[1rem]",
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          className
        )}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
