import { cn } from "../utils";
import { BaseProps } from "@/types";

export interface DividerProps extends BaseProps {
  text?: string;
}

export function Divider({ text, className }: DividerProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-[0.85rem] text-muted text-[0.7rem] tracking-[0.12em] uppercase my-5 before:flex-1 before:border-t before:border-offwhite-dark after:flex-1 after:border-t after:border-offwhite-dark",
        className
      )}
    >
      {text}
    </div>
  );
}
