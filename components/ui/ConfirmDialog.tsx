"use client";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Controls the confirm button colour. Defaults to "danger". */
  variant?: "danger" | "warning" | "default";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const VARIANT_STYLES: Record<NonNullable<ConfirmDialogProps["variant"]>, string> = {
  danger:  "bg-[#C0392B] hover:bg-[#A93226] shadow-[0_4px_16px_rgba(192,57,43,0.3)]",
  warning: "bg-[#E8601C] hover:bg-[#C04E12] shadow-[0_4px_16px_rgba(232,96,28,0.3)]",
  default: "bg-[#2C2420] hover:bg-[#1a1411] shadow-[0_4px_16px_rgba(44,36,32,0.25)]",
};

const VARIANT_ICON: Record<NonNullable<ConfirmDialogProps["variant"]>, string> = {
  danger:  "🗑",
  warning: "⚠️",
  default: "❓",
};

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[3px]" />
      <div
        className="relative bg-white rounded-2xl shadow-[0_32px_80px_rgba(44,36,32,0.28)] w-full max-w-[420px] border border-[#E2DAD1] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Accent bar */}
        <div className={`h-1.5 ${variant === "danger" ? "bg-gradient-to-r from-[#C0392B] to-[#E74C3C]" : variant === "warning" ? "bg-gradient-to-r from-[#E8601C] to-[#F4895A]" : "bg-gradient-to-r from-[#2C2420] to-[#5C4F48]"}`} />

        <div className="px-7 pt-6 pb-5">
          {/* Icon + title */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[1.6rem]">{VARIANT_ICON[variant]}</span>
            <h2 className="font-serif text-[1.25rem] font-semibold text-[#2C2420] leading-tight">
              {title}
            </h2>
          </div>
          <p className="text-[0.84rem] text-[#6B5A52] leading-relaxed">{message}</p>
        </div>

        <div className="px-7 pb-6 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-5 py-2.5 text-[0.84rem] font-semibold text-[#6B5A52] bg-white border-[1.5px] border-[#E2DAD1] rounded-xl hover:border-[#9C8E86] transition-all cursor-pointer disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-6 py-2.5 text-[0.84rem] font-semibold text-white rounded-xl transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${VARIANT_STYLES[variant]}`}
          >
            {loading ? "Please wait…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
