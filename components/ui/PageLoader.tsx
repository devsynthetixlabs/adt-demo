export default function PageLoader() {
  return (
    <div className="fixed inset-0 bg-[#F7F5F2] flex flex-col items-center justify-center z-[9999]">
      <div className="font-serif text-[1.4rem] font-semibold tracking-[0.1em] text-[#E8601C] mb-8">
        ANANTAM<span className="text-[#2C2420] font-light"> · SITE</span>
      </div>
      <div className="w-10 h-10 rounded-full border-[3px] border-[#E2DAD1] border-t-[#E8601C] animate-spin" />
    </div>
  );
}
