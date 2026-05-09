import { CommsMessage } from "@/types/dashboard";
import { useRef, useEffect } from "react";
import { useDashboardUI } from "@/stores/dashboard-ui";


interface CommsProps {
  project: {
    commsChannels: { id: string; name: string; sub: string; icon: string; unit: string | null }[];
    commsMessages: Record<string, CommsMessage[]>;
    units: Record<string, string[]>;
    assigneeProfiles: Record<string, { color: string }>;
  };
  commsMsgInput: string;
  setCommsMsgInput: (v: string) => void;
  units: string[];
  sendCommsMessage: () => void;
  session: { fullName: string } | null;
}

export default function Comms({
  project,
  commsMsgInput,
  setCommsMsgInput,
  units,
  sendCommsMessage,
  session,
}: CommsProps) {
  const { activeCommsChannel, setActiveCommsChannel } = useDashboardUI();
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [activeCommsChannel, project.commsMessages[activeCommsChannel]?.length]);

  return (
    <div>
      <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
        <div>
          <div className="font-serif text-[1.8rem] font-semibold text-[#2C2420]">Site Communications</div>
          <div className="text-[0.82rem] text-[#9C8E86]">Room channels · Photo sharing · Announcements</div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-0 rounded-xl overflow-hidden border border-[#E2DAD1] shadow-[0_2px_20px_rgba(44,36,32,0.07)]" style={{ height: "calc(100vh - 260px)" }}>
        {/* Sidebar */}
        <div className="bg-white border-r border-[#E2DAD1] overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2DAD1] bg-[#F7F5F2]">
            <span className="font-serif text-[1rem] font-semibold">Channels</span>
            <span className="text-[0.7rem] text-[#9C8E86]">● 4 online</span>
          </div>
          {project.commsChannels.map((ch) => {
            const msgs = project.commsMessages[ch.id] || [];
            const last = msgs.length ? msgs[msgs.length - 1] : null;
            const isActive = activeCommsChannel === ch.id;
            return (
              <div
                 key={ch.id}
                 onClick={() => setActiveCommsChannel(ch.id)}
                 className={
                  "flex items-center gap-2.5 px-4 py-3 cursor-pointer border-b border-[#E2DAD1] transition-all " +
                  (isActive ? "bg-[#FEF4EF] border-l-[3px] border-l-[#E8601C]" : "hover:bg-[#FEF4EF]")
                }
              >
                <span className="text-[1rem]">{ch.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-[0.82rem] font-semibold text-[#2C2420] truncate">{ch.name}</div>
                  <div className="text-[0.7rem] text-[#9C8E86] truncate">
                    {last ? last.text.slice(0, 30) + "…" : ch.sub}
                  </div>
                </div>
              </div>
            );
          })}
          {/* Room channels */}
          {units.map((u) =>
            (project.units[u] || []).map((r: string) => {
              const chId = "room-" + u.replace(/\s+/g, "-") + "-" + r.replace(/\s+/g, "-");
              const isActive = activeCommsChannel === chId;
              return (
              <div
                   key={chId}
                   onClick={() => setActiveCommsChannel(chId)}
                   className={
                    "flex items-center gap-2.5 px-4 py-3 cursor-pointer border-b border-[#E2DAD1] transition-all " +
                    (isActive ? "bg-[#FEF4EF] border-l-[3px] border-l-[#E8601C]" : "hover:bg-[#FEF4EF]")
                  }
                >
                  <span className="text-[1rem]">🏠</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[0.82rem] font-semibold text-[#2C2420] truncate">{r}</div>
                    <div className="text-[0.7rem] text-[#9C8E86] truncate">{u}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        {/* Main chat area */}
        <div className="bg-[#F7F5F2] flex flex-col">
          <div className="px-5 py-3.5 bg-white border-b border-[#E2DAD1]">
            {(() => {
              const ch = project.commsChannels.find((c) => c.id === activeCommsChannel);
              return (
                <>
                  <div className="font-semibold text-[0.9rem] text-[#2C2420]">{ch ? ch.name : activeCommsChannel}</div>
                  <div className="text-[0.72rem] text-[#9C8E86]">{ch ? ch.sub : "Room channel"}</div>
                </>
              );
            })()}
          </div>
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-5 flex flex-col gap-3 max-h-[410px]">
            {(project.commsMessages[activeCommsChannel] || []).length === 0 ? (
              <div className="text-center text-[#9C8E86] text-[0.85rem] mt-20">
                <div className="text-[2.5rem] mb-3 opacity-40">💬</div>
                No messages yet. Start the conversation.
              </div>
            ) : (
              <>
                <div className="text-center text-[0.68rem] text-[#9C8E86] flex items-center gap-2 my-1">
                  <span className="flex-1 h-px bg-[#E2DAD1]" />
                  Today
                  <span className="flex-1 h-px bg-[#E2DAD1]" />
                </div>
                {(project.commsMessages[activeCommsChannel] || []).map((m: CommsMessage) => (
                  <div
                    key={m.id}
                    className={
                      "max-w-[75%] rounded-xl px-3.5 py-2.5 text-[0.82rem] leading-normal relative " +
                      (m.outgoing
                        ? "bg-[#E8601C] text-white self-end rounded-br-[3px]"
                        : "bg-white text-[#2C2420] self-start rounded-bl-[3px] shadow-[0_2px_20px_rgba(44,36,32,0.07)]")
                    }
                  >
                    <div className={"text-[0.68rem] font-bold mb-0.5 " + (m.outgoing ? "text-white/75" : "text-[#E8601C]")}>{m.sender}</div>
                    {m.tag && (
                      <span
                        className={
                          "inline-flex items-center gap-0.5 rounded-full text-[0.65rem] px-1.5 py-0.5 mb-1 " +
                          (m.outgoing ? "bg-white/20 text-white" : "bg-[#FDE8DC] text-[#C04E12]")
                        }
                      >
                        🏷 {m.tag}
                      </span>
                    )}
                    <div>{m.text}</div>
                    <div className={"text-[0.62rem] mt-1 text-right " + (m.outgoing ? "text-white/65" : "text-[#9C8E86]")}>{m.time}</div>
                  </div>
                ))}
              </>
            )}
          </div>
          <div className="px-5 py-3.5 bg-white border-t border-[#E2DAD1] flex gap-2.5 items-end">
            <div className="bg-[#F7F5F2] text-[#9C8E86] border-[1.5px] border-[#E2DAD1] rounded-lg w-10 h-10 flex items-center justify-center cursor-pointer text-[1rem] flex-shrink-0 transition-all hover:border-[#E8601C] hover:text-[#E8601C]">📎</div>
            <textarea
              value={commsMsgInput}
              onChange={(e) => setCommsMsgInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendCommsMessage(); } }}
              className="flex-1 font-sans text-[0.82rem] border-[1.5px] border-[#E2DAD1] rounded-lg px-3.5 py-2.5 text-[#2C2420] bg-[#F7F5F2] outline-none resize-none min-h-[42px] max-h-[100px] transition-all focus:border-[#E8601C] focus:bg-white"
              placeholder="Type a message…"
              rows={1}
            />
            <button
              onClick={sendCommsMessage}
              className="bg-[#E8601C] text-white border-none rounded-lg w-10 h-10 flex items-center justify-center cursor-pointer text-[1rem] flex-shrink-0 transition-all hover:bg-[#C04E12]"
            >
              ➤
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
