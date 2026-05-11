export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#03020a]">
      <div className="flex flex-col items-center gap-4">
        <img src="/logo.png" alt="SoulSide"
          className="w-12 h-12 rounded-2xl object-cover"
          style={{ boxShadow: "0 0 24px rgba(139,92,246,0.5)", animation: "pulse-glow 2s ease-in-out infinite" }} />
        <div className="flex gap-1">
          {[0, 0.15, 0.3].map((delay, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce"
              style={{ animationDelay: `${delay}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
