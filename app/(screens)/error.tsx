"use client";

export default function ScreensError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#F7F5F2] flex flex-col items-center justify-center px-4">
      <div className="font-serif text-[1.4rem] font-semibold tracking-[0.1em] text-[#E8601C] mb-6">
        ANANTAM<span className="text-[#2C2420] font-light"> · SITE</span>
      </div>
      <p className="text-[#2C2420] text-sm mb-6 text-center">
        Something went wrong. Please try again.
      </p>
      <button
        onClick={reset}
        className="px-6 py-2 bg-[#E8601C] text-white text-sm rounded hover:bg-[#d05516] transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
