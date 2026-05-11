"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Heart, Eye, Bookmark, User, Clock, ChevronLeft } from "lucide-react";
import api from "@/lib/api";
import type { ContentItem } from "@/types";

// Detect whether content is HTML or legacy plain text
function isHtml(content: string): boolean {
  return /<[a-z][\s\S]*>/i.test(content);
}

// Render HTML content (from rich-text editor) — sanitised by TipTap on save
function HtmlBody({ html }: { html: string }) {
  return (
    <div
      className="article-body"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// Render legacy plain-text content (double newlines → paragraphs)
function PlainBody({ content }: { content: string }) {
  const paragraphs = content.split(/\n{2,}/);
  return (
    <div className="article-body">
      {paragraphs.map((para, i) => {
        const lines = para.split("\n");
        return (
          <p key={i}>
            {lines.map((line, j) => (
              <span key={j}>
                {line}
                {j < lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function ArticleBody({ content }: { content: string }) {
  return isHtml(content) ? <HtmlBody html={content} /> : <PlainBody content={content} />;
}

export default function ArticleReaderPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  // Prevent React StrictMode double-invocation from counting 2 views
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    api.get(`/content/${id}`)
      .then(r => setItem(r.data))
      .catch(() => { toast.error("Resursa nu a fost găsită"); router.replace("/resources"); })
      .finally(() => setLoading(false));
  }, [id]);

  const handleLike = async () => {
    if (!item) return;
    try {
      const { data } = await api.post(`/content/${item.id}/like`);
      setItem(data);
    } catch {}
  };

  const handleFavorite = async () => {
    if (!item) return;
    try {
      const wasFav = item.is_favorited;
      const { data } = await api.post(`/content/${item.id}/favorite`);
      setItem(data);
      toast.success(wasFav ? "Eliminat din favorite" : "Adăugat la favorite");
    } catch {}
  };

  const skeletonLine = (w = "100%", h = "14px") => (
    <div style={{ width: w, height: h, background: "var(--glass-2)", borderRadius: "var(--r-sm)", animation: "pulse 1.5s ease-in-out infinite" }} />
  );

  if (loading) {
    return (
      <div style={{ padding: "clamp(20px,4vw,40px)", width: "100%" }}>
        <div style={{ width: "100%", maxWidth: "900px", display: "flex", flexDirection: "column", gap: "14px" }}>
          {skeletonLine("80px", "13px")}
          <div style={{ height: "12px" }} />
          {skeletonLine("60%", "36px")}
          {skeletonLine("40%", "14px")}
          <div style={{ height: "8px" }} />
          {skeletonLine("100%")}
          {skeletonLine("100%")}
          {skeletonLine("90%")}
          {skeletonLine("70%")}
        </div>
      </div>
    );
  }

  if (!item) return null;

  return (
    <div style={{ padding: "clamp(20px,4vw,40px)", width: "100%" }}>
      <div style={{ width: "100%", maxWidth: "900px" }}>

        {/* Back */}
        <button onClick={() => router.back()} className="anim-fade-up"
          style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "13px", fontFamily: "var(--font-display)", fontWeight: 600, padding: 0, marginBottom: "32px", transition: "color var(--t-fast)" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"}>
          <ChevronLeft size={14} strokeWidth={1.8} />
          Înapoi la resurse
        </button>

        {/* Badges */}
        <div className="anim-fade-up delay-1" style={{ display: "flex", gap: "7px", marginBottom: "14px", flexWrap: "wrap" }}>
          <span style={{ padding: "3px 10px", borderRadius: "var(--r-full)", background: "rgba(56,189,248,0.12)", border: "1px solid rgba(56,189,248,0.25)", fontSize: "11px", fontWeight: 700, fontFamily: "var(--font-display)", color: "#38bdf8" }}>Articol</span>
          {item.category && (
            <span style={{ padding: "3px 10px", borderRadius: "var(--r-full)", background: "var(--glass-1)", border: "1px solid var(--border)", fontSize: "11px", color: "var(--text-muted)" }}>{item.category}</span>
          )}
        </div>

        {/* Title */}
        <h1 className="anim-fade-up delay-1"
          style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(22px,5vw,36px)", color: "var(--text-primary)", lineHeight: 1.2, letterSpacing: "-0.025em", marginBottom: "20px", overflowWrap: "break-word", wordBreak: "break-word" }}>
          {item.title}
        </h1>

        {/* Meta + actions row */}
        <div className="anim-fade-up delay-2"
          style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "12px", fontSize: "13px", color: "var(--text-muted)", marginBottom: "28px", paddingBottom: "24px", borderBottom: "1px solid var(--border)" }}>
          {item.author && (
            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <User size={13} strokeWidth={1.6} />
              {item.author}
            </span>
          )}
          {item.read_time && (
            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <Clock size={13} strokeWidth={1.6} />
              {item.read_time}
            </span>
          )}
          {item.views != null && (
            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <Eye size={13} strokeWidth={1.6} />
              {item.views}
            </span>
          )}
          {/* Actions — pushed to the right, wrap below on small screens */}
          <div style={{ marginLeft: "auto", display: "flex", gap: "8px", flexShrink: 0 }}>
            <button onClick={handleLike} title={item.is_liked ? "Retrage aprecierea" : "Apreciează"}
              style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", borderRadius: "var(--r-md)", border: `1px solid ${item.is_liked ? "rgba(248,113,113,0.5)" : "var(--border)"}`, background: item.is_liked ? "rgba(248,113,113,0.15)" : "var(--glass-1)", color: item.is_liked ? "#f87171" : "var(--text-muted)", cursor: "pointer", fontSize: "13px", fontFamily: "var(--font-display)", fontWeight: 600, transition: "all var(--t-fast)" }}>
              <Heart size={13} fill={item.is_liked ? "currentColor" : "none"} strokeWidth={2} />
              {item.likes ?? 0}
            </button>
            <button onClick={handleFavorite} title={item.is_favorited ? "Șterge din favorite" : "Salvează"}
              style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", borderRadius: "var(--r-md)", border: `1px solid ${item.is_favorited ? "rgba(139,92,246,0.5)" : "var(--border)"}`, background: item.is_favorited ? "rgba(139,92,246,0.15)" : "var(--glass-1)", color: item.is_favorited ? "var(--accent)" : "var(--text-muted)", cursor: "pointer", fontSize: "13px", fontFamily: "var(--font-display)", fontWeight: 600, transition: "all var(--t-fast)" }}>
              <Bookmark size={13} fill={item.is_favorited ? "currentColor" : "none"} strokeWidth={1.8} />
              {item.is_favorited ? "Salvat" : "Salvează"}
            </button>
          </div>
        </div>

        {/* Description — lead paragraph */}
        {item.description && (
          <p className="anim-fade-up delay-2"
            style={{ fontSize: "17px", color: "var(--text-primary)", lineHeight: 1.8, marginBottom: "28px", fontWeight: 500, opacity: 0.9, overflowWrap: "break-word", wordBreak: "break-word", textAlign: "justify" }}>
            {item.description}
          </p>
        )}

        {/* Article body */}
        {item.content && (
          <div className="anim-fade-up delay-3">
            <ArticleBody content={item.content} />
          </div>
        )}

      </div>
    </div>
  );
}
