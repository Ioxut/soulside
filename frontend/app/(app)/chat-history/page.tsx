"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { MessageCircle } from "lucide-react";
import api from "@/lib/api";
import type { ChatSession } from "@/types";

function BreathingOrb() {
  const orbRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf: number;
    let tx = 0, ty = 0, cx = 0, cy = 0;
    const onMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const travel = Math.min(Math.hypot(dx, dy) * 0.18, 36);
      const angle = Math.atan2(dy, dx);
      tx = Math.cos(angle) * travel;
      ty = Math.sin(angle) * travel;
    };
    const tick = () => {
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      if (orbRef.current) {
        orbRef.current.style.transform = `translate(${cx}px, ${cy}px)`;
      }
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(raf); };
  }, []);

  return (
    <div ref={containerRef} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "24px", padding: "48px 32px", userSelect: "none" }}>
      <div style={{ position: "relative", width: "110px", height: "110px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "absolute", inset: "-14px", borderRadius: "50%", border: "1px solid rgba(139,92,246,0.12)" }} />
        <div style={{ position: "absolute", inset: "-28px", borderRadius: "50%", border: "1px solid rgba(139,92,246,0.06)" }} />
        <div ref={orbRef} style={{ width: "80px", height: "80px", borderRadius: "50%", background: "radial-gradient(circle at 38% 36%, #c4b5fd, #8b5cf6 45%, #6d28d9)", boxShadow: "0 0 28px rgba(139,92,246,0.35), 0 0 56px rgba(139,92,246,0.12)" }} />
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "15px", fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--text-primary)", marginBottom: "8px" }}>Selectează o conversație</div>
        <div style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.6, maxWidth: "210px" }}>Click pe orice conversație din stânga pentru detalii.</div>
      </div>
    </div>
  );
}

function DetailPanel({ s, onOpen }: { s: ChatSession; onOpen: () => void }) {
  const dateStr = s.updated_at
    ? format(new Date(s.updated_at), "d MMMM yyyy, HH:mm", { locale: ro })
    : format(new Date(s.started_at), "d MMMM yyyy, HH:mm", { locale: ro });

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", paddingBottom: "16px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ width: "40px", height: "40px", borderRadius: "var(--r-md)", background: "var(--accent-subtle)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <MessageCircle size={18} color="var(--accent-light)" strokeWidth={1.6} />
        </div>
        <div>
          <div style={{ fontSize: "15px", fontWeight: 800, fontFamily: "var(--font-display)", color: "var(--text-primary)", marginBottom: "3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{dateStr}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "18px" }}>
        {[
          { label: "MESAJE", value: String(s.message_count) },
          { label: "SURSE", value: s.source_count > 0 ? String(s.source_count) : "—" },
        ].map(({ label, value }) => (
          <div key={label} style={{ padding: "12px", background: "var(--glass-1)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "15px", color: "var(--text-primary)", lineHeight: 1, marginBottom: "5px" }}>{value}</div>
            <div style={{ fontSize: "9px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: "var(--font-display)", fontWeight: 700 }}>{label}</div>
          </div>
        ))}
      </div>

      {s.first_message && (
        <div style={{ padding: "14px", background: "var(--glass-1)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", marginBottom: "18px" }}>
          <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: "8px" }}>Prima întrebare</div>
          <div style={{ fontSize: "13px", color: "var(--text-secondary)", fontStyle: "italic", lineHeight: 1.5, wordBreak: "break-word", overflowWrap: "break-word" }}>
            "{s.first_message.length > 120 ? s.first_message.slice(0, 120) + "…" : s.first_message}"
          </div>
        </div>
      )}

      <button onClick={onOpen} className="btn-primary" style={{ width: "100%" }}>
        Deschide conversația
      </button>
    </>
  );
}

export default function ChatHistoryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ChatSession | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1000);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    api.get("/chat/sessions?skip=0&limit=50")
      .then(r => { setSessions(r.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const deleteSession = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await api.delete(`/chat/sessions/${id}`).catch(() => {});
    setSessions(prev => prev.filter(s => s.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const handleCardClick = (s: ChatSession) => {
    if (isMobile) {
      setSelected(prev => prev?.id === s.id ? null : s);
    } else {
      setSelected(s);
    }
  };

  const filtered = sessions.filter(s => s.title.toLowerCase().includes(search.toLowerCase()));

  if (loading) return (
    <div style={{ padding: "clamp(20px,4vw,40px)" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {[1, 2, 3, 4].map(i => <div key={i} className="glass-card" style={{ height: "72px", borderRadius: "var(--r-lg)", animation: "pulse 1.5s ease-in-out infinite" }} />)}
      </div>
    </div>
  );

  const cardList = (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px", color: "var(--text-muted)", fontSize: "14px" }}>
          {sessions.length === 0 ? "Nicio conversație încă." : "Nicio conversație găsită."}
        </div>
      ) : filtered.map((s, i) => {
        const isSelected = selected?.id === s.id;
        const dateStr = s.updated_at
          ? format(new Date(s.updated_at), "d MMM yyyy, HH:mm", { locale: ro })
          : format(new Date(s.started_at), "d MMM yyyy, HH:mm", { locale: ro });
        const showAccordion = isMobile && isSelected;

        return (
          <div key={s.id} className={`anim-fade-up delay-${Math.min(i + 1, 4)}`}>
            <div
              onClick={() => handleCardClick(s)}
              style={{
                padding: "14px 16px",
                background: isSelected ? "var(--glass-active)" : "var(--glass-1)",
                backdropFilter: "blur(20px)",
                borderTop: `1px solid ${isSelected ? "var(--border-strong)" : "var(--border)"}`,
                borderLeft: `1px solid ${isSelected ? "var(--border-strong)" : "var(--border)"}`,
                borderRight: `1px solid ${isSelected ? "var(--border-strong)" : "var(--border)"}`,
                borderBottom: `1px solid ${isSelected ? "var(--border-strong)" : "var(--border)"}`,
                borderRadius: "var(--r-lg)",
                cursor: "pointer",
                transition: "all var(--t-normal)",
                boxShadow: isSelected ? "var(--shadow-glow)" : "none",
              }}
              onMouseEnter={e => { if (!isSelected && !isMobile) { (e.currentTarget as HTMLElement).style.background = "var(--glass-hover)"; (e.currentTarget as HTMLElement).style.transform = "translateX(4px)"; } }}
              onMouseLeave={e => { if (!isSelected && !isMobile) { (e.currentTarget as HTMLElement).style.background = "var(--glass-1)"; (e.currentTarget as HTMLElement).style.transform = "translateX(0)"; } }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <div style={{ width: "32px", height: "32px", flexShrink: 0, borderRadius: "var(--r-md)", background: "var(--accent-subtle)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <MessageCircle size={14} color="var(--accent-light)" strokeWidth={1.6} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "14px", fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--text-primary)", marginBottom: "5px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{dateStr}</span>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", opacity: 0.7 }}>·</span>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{s.message_count} mesaje</span>
                  </div>
                </div>
                {isMobile && (
                  <div style={{ flexShrink: 0, color: "var(--text-muted)", transition: "transform var(--t-normal)", transform: isSelected ? "rotate(180deg)" : "rotate(0deg)", display: "flex", alignItems: "center" }}>
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 8l5 5 5-5" /></svg>
                  </div>
                )}
                <button
                  onClick={e => deleteSession(s.id, e)}
                  style={{ width: "30px", height: "30px", flexShrink: 0, borderRadius: "var(--r-sm)", border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all var(--t-fast)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--danger)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(248,113,113,0.4)"; (e.currentTarget as HTMLElement).style.background = "rgba(248,113,113,0.08)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M4 6h12M8 6V4h4v2M6 6v10h8V6" /></svg>
                </button>
              </div>
            </div>

            {showAccordion && (
              <div
                className="anim-fade-up"
                style={{
                  padding: "20px",
                  marginTop: "6px",
                  background: "var(--glass-active)",
                  border: "1px solid var(--border-strong)",
                  borderRadius: "var(--r-lg)",
                  boxShadow: "var(--shadow-glow)",
                }}
              >
                <DetailPanel s={s} onOpen={() => router.push(`/chat?session=${s.id}`)} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div style={{ padding: "clamp(20px,4vw,40px)", width: "100%", boxSizing: "border-box", overflowX: "hidden" }}>
      <div className="anim-fade-up" style={{ marginBottom: "28px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(20px,4vw,28px)", color: "var(--text-primary)", letterSpacing: "-0.025em", marginBottom: "6px" }}>Istoric conversații</h1>
          <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>{sessions.length} conversații salvate</p>
        </div>
        <button onClick={() => router.push("/chat")} className="btn-primary" style={{ height: "40px", padding: "0 18px", fontSize: "14px" }}>
          <MessageCircle size={16} /> Chat nou
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "minmax(0,1fr)" : "minmax(0,1fr) minmax(0,1fr)", gap: "20px", width: "100%" }}>
        <div style={{ minWidth: 0, overflow: "hidden" }}>
          <div className="anim-fade-up delay-1" style={{ position: "relative", marginBottom: "14px" }}>
            <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }}>
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="9" cy="9" r="5" /><path d="M16 16l-3-3" /></svg>
            </div>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Caută în conversații..." className="glass-input" style={{ paddingLeft: "42px" }} />
          </div>
          {cardList}
        </div>

        {!isMobile && (
          <div className="history-right" style={{ position: "sticky", top: "24px", height: "fit-content" }}>
            {selected ? (
              <div className="glass-card-raised anim-scale-in" style={{ padding: "28px" }}>
                <DetailPanel s={selected} onOpen={() => router.push(`/chat?session=${selected.id}`)} />
              </div>
            ) : (
              <div className="glass-card" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "360px" }}>
                <BreathingOrb />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
