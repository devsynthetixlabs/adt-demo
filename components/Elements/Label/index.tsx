import { LabelHTMLAttributes, forwardRef } from "react";
import { cn } from "../utils";
import { LabelProps } from "@/types";

export interface LabelComponentProps extends LabelHTMLAttributes<HTMLLabelElement>, LabelProps {}

const Label = forwardRef<HTMLLabelElement, LabelComponentProps>(
  ({ className, required, hint, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          "block text-[0.7rem] font-semibold tracking-[0.06em] uppercase text-muted mb-[0.35rem]",
          className
        )}
        {...props}
      >
        {children}
        {required && <span className="text-orange ml-0.5">*</span>}
        {hint && (
          <span className="normal-case tracking-normal text-muted font-normal ml-1">
            {hint}
          </span>
        )}
      </label>
    );
  }
);

Label.displayName = "Label";

export { Label };
