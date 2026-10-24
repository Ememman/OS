export default function NoteWidget() {
  return (
    <div
      className="rounded-2xl px-4 py-3.5 shadow-xl w-full md:w-56 h-36 flex flex-col shrink-0"
      style={{ background: "linear-gradient(160deg,#ecc563,#d9a233)" }}
    >
      <div className="text-[10px] uppercase tracking-wider text-black/55 font-semibold mb-1.5">Note</div>
      <p className="text-[12px] text-black/80 leading-relaxed">
        Open to freelance and full-time work — mobile, web, or backend. Ping me through Chats or the resume link.
      </p>
    </div>
  );
}
