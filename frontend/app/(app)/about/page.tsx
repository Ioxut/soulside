"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import api from "@/lib/api";

const VALUES = [
  { title: "Confidențialitate", desc: "Datele tale sunt criptate și nu sunt accesibile terților." },
  { title: "Transparență",      desc: "Fiecare răspuns vine cu sursa citată. Nu inventăm, nu presupunem." },
  { title: "Empatie",           desc: "Fiecare interacție e caldă, non-judecativă și susținătoare." },
  { title: "Acuratețe clinică", desc: "Validat de specialiști, bazat exclusiv pe literatura medicală." },
];

const TIMELINE = [
  { year: "Ian 2025", title: "Ideea",           desc: "SoulSide s-a născut din nevoia de a face prim ajutorul psihologic accesibil oricui, oricând.", future: false },
  { year: "Mar 2025", title: "Primele surse",   desc: "Integrarea DSM-5-TR, ghidurilor NIH și manualelor CBT în prima versiune a bazei de cunoștințe.", future: false },
  { year: null,       title: "Parteneriate",    desc: "Colaborări cu psihologi și psihiatri parteneri pentru validarea răspunsurilor.", future: true },
  { year: null,       title: "Lansare publică", desc: "SoulSide devine disponibil publicului larg cu jurnal, calendar și hub de resurse.", future: true },
];

const TEAM = [
  { name: "Chintea Ionuț", role: "Student UVT · Facultatea de Informatică", initials: "CI", color: "#8b5cf6" },
];

interface RagSource { id: number; filename: string; uploaded_at: string; chunk_count: number; }

function cleanFilename(name: string) {
  return name.replace(/\.pdf$/i, "").replace(/[-_]/g, " ");
}

// ── 3D scroll card for timeline ───────────────────────────────────────────────
function TimelineCard({ item, index }: { item: typeof TIMELINE[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const y       = useTransform(scrollYProgress, [0, 1], [40, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.4], [0, 1]);
  const rotateX = useTransform(scrollYProgress, [0, 1], [10, 0]);
  const scale   = useTransform(scrollYProgress, [0, 1], [0.94, 1]);

  return (
    <motion.div ref={ref} style={{ y, opacity, rotateX, scale, perspective: "800px", transformStyle: "preserve-3d" }}>
      <div style={{
        display: "flex", gap: "0", alignItems: "stretch",
        opacity: item.future ? 0.65 : 1,
      }}>
        {/* Left: dot + line */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginRight: "20px", flexShrink: 0 }}>
          <div style={{
            width: "14px", height: "14px", borderRadius: "50%", flexShrink: 0, marginTop: "4px",
            background: item.future ? "transparent" : "var(--accent)",
            border: item.future ? "2px dashed rgba(139,92,246,0.4)" : "2px solid var(--bg-base)",
            boxShadow: item.future ? "none" : "0 0 12px var(--accent-glow)",
            zIndex: 1,
          }} />
          {index < TIMELINE.length - 1 && (
            <div style={{
              flex: 1, width: "2px", marginTop: "6px",
              background: item.future
                ? "repeating-linear-gradient(to bottom, rgba(139,92,246,0.2) 0px, rgba(139,92,246,0.2) 4px, transparent 4px, transparent 10px)"
                : "linear-gradient(to bottom, var(--accent), rgba(139,92,246,0.15))",
              minHeight: "32px",
            }} />
          )}
        </div>

        {/* Right: card */}
        <div className="glass-card" style={{
          flex: 1, padding: "16px 20px", marginBottom: "16px",
          borderStyle: item.future ? "dashed" : "solid",
          borderColor: item.future ? "rgba(139,92,246,0.2)" : undefined,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", flexWrap: "wrap" }}>
            {item.future ? (
              <span style={{
                fontSize: "11px", padding: "2px 10px", borderRadius: "var(--r-full)",
                background: "rgba(139,92,246,0.08)", border: "1px dashed rgba(139,92,246,0.3)",
                color: "var(--accent-light)", fontFamily: "var(--font-display)", fontWeight: 700,
                letterSpacing: "0.04em",
              }}>
                În curând
              </span>
            ) : (
              <span style={{
                fontSize: "11px", fontWeight: 700, fontFamily: "var(--font-display)",
                color: "var(--accent-light)", letterSpacing: "0.07em", textTransform: "uppercase",
              }}>
                {item.year}
              </span>
            )}
          </div>
          <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "15px",
            color: item.future ? "var(--text-secondary)" : "var(--text-primary)", marginBottom: "6px" }}>
            {item.title}
          </h3>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.65, fontWeight: 300 }}>
            {item.desc}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function AboutPage() {
  const [sources, setSources] = useState<RagSource[]>([]);

  useEffect(() => {
    api.get("/rag/sources").then(r => setSources(r.data)).catch(() => {});
  }, []);

  const sec: React.CSSProperties = {
    padding: "clamp(28px,4vw,48px) clamp(16px,4vw,48px)",
    borderBottom: "1px solid var(--border)",
  };

  return (
    <div style={{ width: "100%", minHeight: "100%" }}>

      {/* ── Hero ── */}
      <div style={{ ...sec }}>
        <div className="anim-fade-up">
          <div style={{ display: "inline-block", padding: "4px 14px", borderRadius: "var(--r-full)",
            background: "var(--accent-subtle)", border: "1px solid var(--border-glow)",
            fontSize: "12px", fontFamily: "var(--font-display)", fontWeight: 700,
            color: "var(--accent-light)", marginBottom: "18px" }}>
            Misiunea noastră
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900,
            fontSize: "clamp(24px,5vw,44px)", color: "var(--text-primary)",
            letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "16px", maxWidth: "700px" }}>
            Sănătatea mintală nu ar trebui să fie un lux.
          </h1>
          <p style={{ fontSize: "clamp(14px,2vw,17px)", color: "var(--text-secondary)",
            lineHeight: 1.7, maxWidth: "600px", fontWeight: 300 }}>
            SoulSide a fost construit pentru a face prim ajutorul psihologic accesibil oricui, 
            indiferent de oră, locație sau resurse financiare. Nu înlocuim terapia, o facem mai accesibilă.
          </p>
        </div>
      </div>

      {/* ── Valori ── */}
      <div style={{ ...sec }}>
        <h2 className="section-title anim-fade-up">Valorile noastre</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "14px" }}>
          {VALUES.map(({ title, desc }, i) => (
            <div key={title} className={`glass-card glass-interactive anim-fade-up delay-${i + 1}`}
              style={{ padding: "20px" }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "14px",
                color: "var(--text-primary)", marginBottom: "7px" }}>{title}</h3>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6, fontWeight: 300 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Timeline ── */}
      <div style={{ ...sec }}>
        <h2 className="section-title anim-fade-up">Povestea noastră</h2>
        <div style={{ maxWidth: "560px" }}>
          {TIMELINE.map((item, i) => (
            <TimelineCard key={item.title} item={item} index={i} />
          ))}
        </div>
      </div>

      {/* ── Echipa ── */}
      <div style={{ ...sec }}>
        <h2 className="section-title anim-fade-up">Echipa</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,240px))", gap: "14px" }}>
          {TEAM.map(({ name, role, initials, color }, i) => (
            <div key={name} className={`glass-card glass-interactive anim-fade-up delay-${i + 1}`}
              style={{ padding: "24px", textAlign: "center" }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "50%", margin: "0 auto 14px",
                background: `linear-gradient(135deg,${color}33,${color}11)`,
                border: `2px solid ${color}55`, display: "flex", alignItems: "center",
                justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 900,
                fontSize: "20px", color, boxShadow: `0 0 16px ${color}33` }}>
                {initials}
              </div>
              <div style={{ fontSize: "15px", fontWeight: 700, fontFamily: "var(--font-display)",
                color: "var(--text-primary)", marginBottom: "5px" }}>{name}</div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5 }}>{role}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Surse ── */}
      <div style={{ padding: "clamp(28px,4vw,48px) clamp(16px,4vw,48px)" }}>
        <h2 className="section-title anim-fade-up">Surse medicale utilizate</h2>

        {sources.length === 0 ? (
          <div style={{ padding: "16px 20px", background: "var(--glass-1)", border: "1px solid var(--border)",
            borderRadius: "var(--r-md)", fontSize: "13px", color: "var(--text-muted)", marginBottom: "20px" }}>
            Niciun document încărcat în baza de cunoștințe.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
            {sources.map((s, i) => (
              <div key={s.id} className={`anim-fade-up delay-${(i % 3) + 1}`}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                  gap: "12px", padding: "11px 16px", background: "var(--glass-1)",
                  border: "1px solid var(--border)", borderRadius: "var(--r-md)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                  <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="var(--accent-light)"
                    strokeWidth="1.6" strokeLinecap="round" style={{ flexShrink: 0 }}>
                    <path d="M4 2h8l4 4v12a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z"/>
                    <path d="M12 2v4h4"/>
                  </svg>
                  <span style={{ fontSize: "13px", color: "var(--text-secondary)",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {cleanFilename(s.filename)}
                  </span>
                </div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", whiteSpace: "nowrap", flexShrink: 0 }}>
                  {s.chunk_count} fragmente
                </span>
              </div>
            ))}
          </div>
        )}

        {/* gap explicit between list and disclaimer */}
        <div style={{ height: "8px" }} />

        <div style={{ padding: "16px 20px", background: "var(--danger-bg)",
          border: "1px solid var(--danger-border)", borderRadius: "var(--r-lg)" }}>
          <p style={{ fontSize: "13px", color: "rgba(248,113,113,0.85)", lineHeight: 1.7 }}>
            <strong style={{ color: "var(--danger)" }}>Important:</strong>{" "}
            SoulSide nu este un serviciu medical și nu înlocuiește consultul unui specialist.
            În situații de urgență contactați <strong>112</strong> sau <strong>0800 801 200</strong>.
          </p>
        </div>
      </div>

    </div>
  );
}
