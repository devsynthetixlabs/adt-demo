import { cn } from "../utils";
import { TabItem } from "@/types";

export interface TabsProps<T extends string = string> {
  tabs: TabItem<T>[];
  value: T;
  onChange: (key: T) => void;
  variant?: "underline" | "pill";
  className?: string;
}

export function Tabs<T extends string = string>({
  tabs,
  value,
  onChange,
  variant = "underline",
  className,
}: TabsProps<T>) {
  if (variant === "pill") {
    return (
      <div className={cn("inline-flex bg-offwhite-mid p-[4px] rounded-full border border-offwhite-dark", className)}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={value === tab.key}
            className={cn(
              "px-[1.1rem] py-[0.42rem] rounded-full text-[0.78rem] font-medium tracking-[0.02em] transition-all touch-manipulation",
              value === tab.key
                ? "bg-white text-ink shadow-[0_1px_3px_rgba(44,36,32,0.06)]"
                : "text-muted hover:text-ink-soft active:scale-[0.97]"
            )}
            onClick={() => onChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("inline-flex gap-[1.4rem] text-[0.82rem] text-muted", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={value === tab.key}
          className={cn(
            "pb-2 border-b-2 border-transparent transition-all font-medium touch-manipulation",
            value === tab.key
              ? "text-ink border-b-orange"
              : "hover:text-ink-soft active:scale-[0.97]"
          )}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
