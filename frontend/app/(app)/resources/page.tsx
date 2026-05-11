"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { Heart, Eye, Bookmark, X, ExternalLink, Search, User, Clock } from "lucide-react";
import api from "@/lib/api";
import type { ContentItem } from "@/types";

const TYPE_CFG: Record<string, { label: string; color: string; bg: string }> = {
  video:          { label: "Video",   color: "#f87171", bg: "rgba(248,113,113,0.12)" },
  articol:        { label: "Articol", color: "#38bdf8", bg: "rgba(56,189,248,0.12)" },
  articol_extern: { label: "Articol", color: "#38bdf8", bg: "rgba(56,189,248,0.12)" },
  pdf:            { label: "PDF",     color: "#fbbf24", bg: "rgba(251,191,36,0.12)" },
  ghid:           { label: "Ghid",    color: "#34d399", bg: "rgba(52,211,153,0.12)" },
};

const PAGE_SIZE = 12;

interface Counts { total: number; articol: number; video: number; pdf: number; ghid: number; }


function ResourceModal({ item, onClose, onLike, onFavorite }: {
  item: ContentItem;
  onClose: () => void;
  onLike: () => void;
  onFavorite: () => void;
}) {
  const tc = TYPE_CFG[item.type] ?? { label: item.type, color: "var(--accent-light)", bg: "var(--accent-subtle)" };

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.82)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(16px,4vw,40px)" }}>
      <div onClick={e => e.stopPropagation()} className="anim-scale-in"
        style={{ width: "min(90vw,860px)", maxHeight: "85vh", overflowY: "auto", background: "rgba(11,10,28,0.97)", backdropFilter: "blur(24px)", border: "1px solid var(--border)", borderRadius: "var(--r-2xl)", boxShadow: "0 40px 120px rgba(0,0,0,0.7)", position: "relative" }}>
        <div style={{ position: "sticky", top: 0, zIndex: 10, padding: "20px 28px", background: "rgba(11,10,28,0.97)", backdropFilter: "blur(20px)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", gap: "7px", marginBottom: "10px", flexWrap: "wrap" }}>
              <span style={{ padding: "3px 10px", borderRadius: "var(--r-full)", background: tc.bg, border: `1px solid ${tc.color}44`, fontSize: "11px", fontWeight: 700, fontFamily: "var(--font-display)", color: tc.color }}>{tc.label}</span>
              {item.category && <span style={{ padding: "3px 10px", borderRadius: "var(--r-full)", background: "var(--glass-1)", border: "1px solid var(--border)", fontSize: "11px", color: "var(--text-muted)" }}>{item.category}</span>}
            </div>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(16px,3vw,20px)", color: "var(--text-primary)", lineHeight: 1.3, letterSpacing: "-0.02em", marginBottom: "8px" }}>{item.title}</h2>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap", fontSize: "12px", color: "var(--text-muted)" }}>
              {item.author && (
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <User size={11} strokeWidth={1.6} />
                  {item.author}
                </span>
              )}
              {item.read_time && (
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Clock size={11} strokeWidth={1.6} />
                  {item.read_time}
                </span>
              )}
              {item.views != null && (
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Eye size={11} strokeWidth={1.6} />
                  {item.views}
                </span>
              )}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <button onClick={onLike} title={item.is_liked ? "Retrage aprecierea" : "Apreciează"}
              style={{ display: "flex", alignItems: "center", gap: "5px", padding: "8px 14px", borderRadius: "var(--r-md)", border: `1px solid ${item.is_liked ? "rgba(248,113,113,0.5)" : "var(--border)"}`, background: item.is_liked ? "rgba(248,113,113,0.15)" : "var(--glass-1)", color: item.is_liked ? "#f87171" : "var(--text-muted)", cursor: "pointer", fontSize: "13px", fontFamily: "var(--font-display)", fontWeight: 600, transition: "all var(--t-fast)" }}>
              <Heart size={13} fill={item.is_liked ? "currentColor" : "none"} strokeWidth={2} />
              {item.likes ?? 0}
            </button>
            <button onClick={onFavorite} title={item.is_favorited ? "Șterge din favorite" : "Adaugă la favorite"}
              style={{ display: "flex", alignItems: "center", gap: "5px", padding: "8px 14px", borderRadius: "var(--r-md)", border: `1px solid ${item.is_favorited ? "rgba(139,92,246,0.5)" : "var(--border)"}`, background: item.is_favorited ? "rgba(139,92,246,0.15)" : "var(--glass-1)", color: item.is_favorited ? "var(--accent)" : "var(--text-muted)", cursor: "pointer", fontSize: "13px", fontFamily: "var(--font-display)", fontWeight: 600, transition: "all var(--t-fast)" }}>
              <Bookmark size={13} fill={item.is_favorited ? "currentColor" : "none"} strokeWidth={1.8} />
              {item.is_favorited ? "Salvat" : "Salvează"}
            </button>
            <button onClick={onClose} aria-label="Închide"
              style={{ width: "36px", height: "36px", borderRadius: "var(--r-md)", flexShrink: 0, border: "1px solid var(--border)", background: "var(--glass-1)", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all var(--t-fast)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--glass-2)"; (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--glass-1)"; (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}>
              <X size={14} strokeWidth={1.8} />
            </button>
          </div>
        </div>

        <div style={{ padding: "24px 28px" }}>
          {item.description && <p style={{ fontSize: "15px", color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: "20px" }}>{item.description}</p>}
          {item.content && (
            <div style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.8, whiteSpace: "pre-wrap", padding: "20px", background: "var(--glass-1)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", marginBottom: "20px" }}>
              {item.content}
            </div>
          )}
          {item.url && (
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
              <ExternalLink size={14} strokeWidth={1.8} />
              Deschide resursa
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResourcesPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "favorites">("all");
  const [modalItem, setModalItem] = useState<ContentItem | null>(null);
  const [counts, setCounts] = useState<Counts | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const openId = searchParams.get("open");
    if (!openId) return;
    api.get(`/content/${openId}`).then(r => setModalItem(r.data)).catch(() => {});
  }, [searchParams]);

  const load = async (newSkip = 0, append = false) => {
    if (newSkip === 0) setLoading(true); else setLoadingMore(true);
    try {
      if (activeTab === "favorites") {
        const { data } = await api.get("/content/favorites");
        setItems(data);
        setHasMore(false);
        setSkip(0);
      } else {
        const params = new URLSearchParams();
        const serverType = typeFilter && typeFilter !== "articol" ? typeFilter : "";
        if (serverType) params.set("type", serverType);
        if (categoryFilter) params.set("category", categoryFilter);
        const limit = typeFilter === "articol" ? 100 : PAGE_SIZE;
        params.set("skip", String(newSkip));
        params.set("limit", String(limit));
        const { data } = await api.get(`/content?${params}`);
        const processed = typeFilter === "articol"
          ? data.filter((i: ContentItem) => i.type === "articol" || i.type === "articol_extern")
          : data;
        setItems(prev => append ? [...prev, ...processed] : processed);
        setHasMore(typeFilter === "articol" ? false : data.length === PAGE_SIZE);
        setSkip(newSkip);
      }
    } catch { toast.error("Nu s-au putut încărca resursele"); }
    finally { setLoading(false); setLoadingMore(false); }
  };

  useEffect(() => { load(0, false); }, [typeFilter, categoryFilter, activeTab]);

  useEffect(() => {
    api.get("/content/counts").then(r => setCounts(r.data)).catch(() => {});
  }, []);

  const handleLike = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { data } = await api.post(`/content/${id}/like`);
      setItems(prev => prev.map(c => c.id === id ? data : c));
      if (modalItem?.id === id) setModalItem(data);
    } catch {}
  };

  const handleFavorite = async (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const wasFav = items.find(c => c.id === id)?.is_favorited;
      const { data } = await api.post(`/content/${id}/favorite`);
      setItems(prev => prev.map(c => c.id === id ? data : c));
      if (modalItem?.id === id) setModalItem(data);
      toast.success(wasFav ? "Eliminat din favorite" : "Adăugat la favorite");
      if (activeTab === "favorites" && wasFav) {
        setItems(prev => prev.filter(c => c.id !== id));
      }
    } catch {}
  };

  const handleView = (item: ContentItem) => {
    if (item.type === "articol") {
      router.push(`/resources/${item.id}`);
      return;
    }
    api.get(`/content/${item.id}`).then(r => {
      setItems(prev => prev.map(c => c.id === item.id ? r.data : c));
      setModalItem(r.data);
    }).catch(() => setModalItem(item));
  };

  const categories = [...new Set(items.map(i => i.category))].filter(Boolean);
  const filtered = items.filter(c =>
    !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: "clamp(20px,4vw,40px)", width: "100%" }}>
      {modalItem && typeof document !== "undefined" && createPortal(
        <ResourceModal
          item={modalItem}
          onClose={() => setModalItem(null)}
          onLike={() => handleLike(modalItem.id, { stopPropagation: () => {} } as React.MouseEvent)}
          onFavorite={() => handleFavorite(modalItem.id)}
        />,
        document.body
      )}

      <div className="anim-fade-up" style={{ marginBottom: "28px" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(20px,4vw,28px)", color: "var(--text-primary)", letterSpacing: "-0.025em", marginBottom: "6px" }}>Bibliotecă de resurse</h1>
        <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>Articole, ghiduri și materiale clinice validate</p>
      </div>

      {counts && (
        <div className="anim-fade-up" style={{ display: "flex", width: "100%", marginBottom: "24px", background: "var(--glass-1)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", overflow: "hidden" }}>
          {([
            { key: "",        label: "TOTAL",    value: counts.total,   color: "var(--accent-light)" },
            { key: "video",   label: "VIDEO",    value: counts.video,   color: "#f87171" },
            { key: "articol", label: "ARTICOLE", value: counts.articol, color: "#38bdf8" },
            { key: "pdf",     label: "PDF",      value: counts.pdf,     color: "#fbbf24" },
            { key: "ghid",    label: "GHIDURI",  value: counts.ghid,    color: "#34d399" },
          ] as { key: string; label: string; value: number; color: string }[]).map(({ key, label, value, color }, i, arr) => {
            const active = typeFilter === key;
            return (
              <button key={label} onClick={() => { setTypeFilter(key); setActiveTab("all"); }}
                style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "clamp(10px,2vw,14px) 4px", border: "none", borderRight: i < arr.length - 1 ? "1px solid var(--border)" : "none", background: active ? "var(--glass-active)" : "transparent", cursor: "pointer", transition: "background var(--t-fast)", minWidth: 0 }}>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(16px,3vw,24px)", color: active ? color : "var(--text-primary)", lineHeight: 1, marginBottom: "4px", transition: "color var(--t-fast)" }}>{value}</span>
                <span style={{ fontSize: "clamp(8px,1.5vw,10px)", fontWeight: 700, fontFamily: "var(--font-display)", letterSpacing: "0.06em", color: active ? color : "var(--text-muted)", transition: "color var(--t-fast)", whiteSpace: "nowrap" }}>{label}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="anim-fade-up" style={{ display: "flex", gap: "6px", marginBottom: "20px" }}>
        {(["all", "favorites"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{ padding: "7px 18px", borderRadius: "var(--r-full)", border: "1px solid", fontSize: "13px", fontFamily: "var(--font-display)", fontWeight: 600, cursor: "pointer", transition: "all var(--t-fast)",
              borderColor: activeTab === tab ? "var(--accent)" : "var(--border)",
              background: activeTab === tab ? "rgba(139,92,246,0.15)" : "var(--glass-1)",
              color: activeTab === tab ? "var(--accent)" : "var(--text-muted)",
            }}>
            {tab === "all" ? "Toate" : "Salvate"}
          </button>
        ))}
      </div>

      {activeTab === "all" && (
        <div className="anim-fade-up delay-1" style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "24px", alignItems: "center" }}>
          <div style={{ position: "relative", flex: "1 1 220px", minWidth: "160px" }}>
            <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }}>
              <Search size={14} strokeWidth={1.6} />
            </div>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Caută resurse..." className="glass-input" style={{ paddingLeft: "40px", height: "40px" }}/>
          </div>
          {categories.length > 0 && (
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="glass-input" style={{ height: "40px", padding: "0 14px", flex: "0 0 auto", cursor: "pointer" }}>
              <option value="">Toate categoriile</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          )}
          {(typeFilter || categoryFilter || search) && (
            <button onClick={() => { setTypeFilter(""); setCategoryFilter(""); setSearch(""); }} className="btn-glass" style={{ height: "40px", padding: "0 16px", fontSize: "13px" }}>
              Resetează
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: "14px" }}>
          {[1,2,3,4,5,6].map(i => <div key={i} className="glass-card" style={{ height: "180px", borderRadius: "var(--r-xl)", animation: "pulse 1.5s ease-in-out infinite" }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 40px", color: "var(--text-muted)" }}>
          <div style={{ width: "48px", height: "48px", margin: "0 auto 16px", background: "var(--glass-1)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Bookmark size={22} strokeWidth={1.5} />
          </div>
          <div style={{ fontSize: "16px", fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--text-secondary)", marginBottom: "6px" }}>
            {activeTab === "favorites" ? "Nicio resursă salvată" : "Nicio resursă găsită"}
          </div>
          <div style={{ fontSize: "13px" }}>
            {activeTab === "favorites" ? "Apasă pe bookmark pentru a salva resurse" : "Încearcă alți termeni sau resetează filtrele"}
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: "14px" }}>
            {filtered.map((c, i) => {
              const tc = TYPE_CFG[c.type] ?? { label: c.type, color: "var(--accent-light)", bg: "var(--accent-subtle)" };
              return (
                <div key={c.id} className={`glass-card glass-interactive anim-fade-up delay-${Math.min(i % 6 + 1, 4)}`}
                  onClick={() => handleView(c)}
                  style={{ padding: "18px", cursor: "pointer", display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                    <span style={{ padding: "3px 9px", borderRadius: "var(--r-full)", background: tc.bg, border: `1px solid ${tc.color}44`, fontSize: "10px", fontWeight: 700, fontFamily: "var(--font-display)", color: tc.color }}>{tc.label}</span>
                    {c.category && <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-display)", fontWeight: 600 }}>{c.category}</span>}
                  </div>
                  <h3 style={{ fontSize: "14px", fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--text-primary)", lineHeight: 1.4, margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{c.title}</h3>
                  {c.description && <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5, margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{c.description}</p>}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: "8px", borderTop: "1px solid var(--border)" }}>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {[c.read_time, c.author].filter(Boolean).join(" · ")}
                    </div>
                    <div style={{ display: "flex", gap: "8px", flexShrink: 0, alignItems: "center" }}>
                      <button onClick={e => handleLike(c.id, e)} title={c.is_liked ? "Retrage aprecierea" : "Apreciează"}
                        style={{ display: "flex", alignItems: "center", gap: "3px", background: "none", border: "none", color: c.is_liked ? "#f87171" : "var(--text-muted)", cursor: "pointer", fontSize: "11px", padding: "2px", transition: "color var(--t-fast)" }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#f87171"}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = c.is_liked ? "#f87171" : "var(--text-muted)"}>
                        <Heart size={12} fill={c.is_liked ? "currentColor" : "none"} strokeWidth={2} />
                        {c.likes ?? 0}
                      </button>
                      {c.views != null && (
                        <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "3px" }}>
                          <Eye size={11} strokeWidth={1.6} />
                          {c.views}
                        </span>
                      )}
                      <button onClick={e => handleFavorite(c.id, e)} title={c.is_favorited ? "Șterge din favorite" : "Salvează"}
                        style={{ display: "flex", alignItems: "center", background: "none", border: "none", cursor: "pointer", padding: "2px", transition: "color var(--t-fast)", color: c.is_favorited ? "var(--accent)" : "var(--text-muted)" }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--accent)"}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = c.is_favorited ? "var(--accent)" : "var(--text-muted)"}>
                        <Bookmark size={13} fill={c.is_favorited ? "currentColor" : "none"} strokeWidth={1.8} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {activeTab === "all" && hasMore && (
            <div style={{ textAlign: "center", marginTop: "28px" }}>
              <button onClick={() => load(skip + PAGE_SIZE, true)} disabled={loadingMore} className="btn-glass" style={{ padding: "10px 32px" }}>
                {loadingMore ? "Se încarcă…" : "Încarcă mai multe"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
