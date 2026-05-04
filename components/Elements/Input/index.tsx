import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "../utils";
import { InputVariantProps } from "@/types";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement>, InputVariantProps {}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant = "default",
      error,
      prefix,
      suffix,
      type = "text",
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "w-full py-[0.72rem] px-[0.9rem] bg-white border-[1.5px] border-offwhite-dark rounded-lg text-[0.92rem] text-ink transition-all focus:outline-none focus:border-orange focus:shadow-[0_0_0_3px_rgba(232,96,28,0.12)] font-sans placeholder:text-muted";

    const hasPrefix = !!prefix;
    const hasSuffix = !!suffix;

    return (
      <div className={cn("relative", className)}>
        {prefix && (
          <span className="absolute left-0 top-0 h-full flex items-center text-[0.92rem] text-ink-soft font-medium pointer-events-none border-r border-offwhite-dark pr-[0.65rem] pl-[0.9rem]">
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          type={type}
          className={cn(
            baseStyles,
            hasPrefix && "pl-[4rem]",
            hasSuffix && "pr-[3.5rem]",
            error && "border-danger focus:border-danger focus:shadow-[0_0_0_3px_rgba(192,57,43,0.12)]"
          )}
          {...props}
        />
        {suffix && (
          <div className="absolute right-[0.55rem] top-1/2 -translate-y-1/2">
            {suffix}
          </div>
        )}
        {error && (
          <p className="mt-1 text-[0.72rem] text-danger">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
