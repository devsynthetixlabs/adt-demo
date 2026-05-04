import { cn } from "../utils";
import { PasswordStrengthLevel } from "@/types";

const strengthLevels: PasswordStrengthLevel[] = [
  { level: 1, label: "Weak", color: "bg-[#C0392B]" },
  { level: 2, label: "Fair", color: "bg-[#D9802A]" },
  { level: 3, label: "Good", color: "bg-[#C8A227]" },
  { level: 4, label: "Strong", color: "bg-[#3D8A5F]" },
];

export function getPasswordLevel(password: string): PasswordStrengthLevel {
  if (!password) return { level: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return strengthLevels.find((s) => s.level === score) || { level: 0, label: "", color: "" };
}

export interface PasswordStrengthProps {
  password: string;
  className?: string;
}

export function PasswordStrength({ password, className }: PasswordStrengthProps) {
  const { level, label, color } = getPasswordLevel(password);

  if (!password) return null;

  return (
    <div className={cn("mt-2 flex items-center gap-2", className)}>
      <div className="flex-1 h-1 bg-offwhite-mid rounded-full overflow-hidden flex gap-[3px]">
        {[1, 2, 3, 4].map((seg) => (
          <div
            key={seg}
            className={cn(
              "flex-1 rounded-full transition-all",
              seg <= level ? color : "bg-offwhite-mid"
            )}
          />
        ))}
      </div>
      <div className="text-[0.7rem] text-muted font-medium min-w-[60px] text-right">
        {label}
      </div>
    </div>
  );
}
