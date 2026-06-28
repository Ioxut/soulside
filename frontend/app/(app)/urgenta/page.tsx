"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Square, Wind, Eye, HeartPulse, PenLine, Ear, Hand, Flower2, Utensils, Clock, ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";


const LINES = [
  { name: "Urgențe naționale", number: "112", desc: "Situații de urgență - viață în pericol", color: "#f87171", urgent: true },
  { name: "Alianţa Română de Prevenţie a Suicidului", number: "0800 801 200", desc: "Gratuit, 24/7 - suport emoțional", color: "#8b5cf6" },
  { name: "Telefonul Copilului", number: "116 111", desc: "Gratuit pentru copii și adolescenți", color: "#38bdf8" },
];

const RESOURCES = [
  { name: "Mental Health for Romania", url: "https://mentalhealthforromania.org", desc: "Harta specialiștilor, resurse gratuite și suport pentru sănătate mintală" },
  { name: "Harta Sănătății Mintale", url: "https://hartasanatatiimintale.ro", desc: "Găsește servicii de sănătate mintală aproape de tine, proiect Fundația ESTUAR" },
  { name: "Minte Forte", url: "https://minteforte.ro", desc: "Articole, ghiduri și resurse despre sănătatea mintală în română" },
];


type ExerciseId = "478" | "box" | "sigh" | "grounding" | "bodyscan" | "writing";

type Technique = {
  id: ExerciseId;
  title: string;
  time: string;
  icon: LucideIcon;
  desc: string;
  color: string;
  animated: boolean;
};

const TECHNIQUES: Technique[] = [
  { id: "478",       title: "Respirație 4-7-8",       time: "3 min", icon: Moon,       color: "#8b5cf6", animated: true,  desc: "Inspiră 4 secunde, ții 7, expiri 8. Funcționează bine când ești agitat sau nu poți adormi." },
  { id: "box",       title: "Respirație cutie",        time: "3 min", icon: Square,     color: "#38bdf8", animated: true,  desc: "Patru timpi egali de 4 secunde: inspiri, ții, expiri, ții. Calmează rapid când ești tensionat." },
  { id: "sigh",      title: "Oftat fiziologic",        time: "2 min", icon: Wind,       color: "#34d399", animated: true,  desc: "Două inspirații scurte pe nas, apoi un expir lung pe gură. Resetează rapid starea de tensiune." },
  { id: "grounding", title: "Tehnica 5-4-3-2-1",       time: "3 min", icon: Eye,        color: "#f97316", animated: true,  desc: "Numești lucruri pe care le vezi, auzi, atingi, miroși, guști. Te aduce înapoi în prezent." },
  { id: "bodyscan",  title: "Scanarea corpului",       time: "5 min", icon: HeartPulse, color: "#a78bfa", animated: true,  desc: "Parcurgi mental tot corpul de la picioare la cap și lași fiecare zonă să se relaxeze." },
  { id: "writing",   title: "Scrie ce simți",          time: "5 min", icon: PenLine,    color: "#fbbf24", animated: false, desc: "Scrie tot ce îți trece prin cap, fără să te oprești. Nu trebuie să fie frumos, doar sincer." },
];


type Phase = { label: string; duration: number; scale: number; ease: string };

const BREATHING: Record<string, { phases: Phase[]; color: string }> = {
  "478": {
    color: "#8b5cf6",
    phases: [
      { label: "Inspiră",    duration: 4, scale: 1.45, ease: "easeIn"  },
      { label: "Ține",       duration: 7, scale: 1.45, ease: "linear"  },
      { label: "Expiră",     duration: 8, scale: 0.65, ease: "easeOut" },
    ],
  },
  box: {
    color: "#38bdf8",
    phases: [
      { label: "Inspiră",    duration: 4, scale: 1.45, ease: "easeIn"  },
      { label: "Ține",       duration: 4, scale: 1.45, ease: "linear"  },
      { label: "Expiră",     duration: 4, scale: 0.65, ease: "easeOut" },
      { label: "Ține",       duration: 4, scale: 0.65, ease: "linear"  },
    ],
  },
  sigh: {
    color: "#34d399",
    phases: [
      { label: "Inspiră adânc",  duration: 2, scale: 1.3,  ease: "easeIn"  },
      { label: "Inspiră scurt",  duration: 1, scale: 1.5,  ease: "easeIn"  },
      { label: "Expiră lent",    duration: 5, scale: 0.65, ease: "easeOut" },
    ],
  },
};

function BreathingExercise({ id, onBack }: { id: string; onBack: () => void }) {
  const { phases, color } = BREATHING[id];
  const info = TECHNIQUES.find(t => t.id === id)!;

  const [pi, setPi]           = useState(0);
  const [tl, setTl]           = useState(phases[0].duration);
  const [running, setRunning] = useState(false);
  const [rounds, setRounds]   = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!running) return;
    if (tl === 0) {
      const next = (pi + 1) % phases.length;
      if (next === 0) setRounds(r => r + 1);
      setPi(next);
      setTl(phases[next].duration);
      return;
    }
    const id = setTimeout(() => setTl(v => v - 1), 1000);
    return () => clearTimeout(id);
  }, [running, tl, pi]);

  const reset = () => { setRunning(false); setStarted(false); setPi(0); setTl(phases[0].duration); setRounds(0); };
  const handleStart = () => { setStarted(true); setRunning(true); };

  const phase     = phases[pi];
  const prevScale = phases[(pi - 1 + phases.length) % phases.length].scale;

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "18px", padding: "4px 0 12px" }}>

      <button onClick={onBack}
        style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: "6px", background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "13px", fontFamily: "var(--font-display)", fontWeight: 600, padding: 0 }}>
        ← Înapoi
      </button>

      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "17px", fontWeight: 800, fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>{info.title}</div>
      </div>

      <div style={{ position: "relative", width: "190px", height: "190px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <motion.div
          key={started ? `ring-${pi}` : "ring-idle"}
          initial={{ scale: started ? prevScale * 0.9 : 0.9 }}
          animate={{ scale: started ? phase.scale * 0.9 : 0.9 }}
          transition={started ? { duration: phase.duration, ease: phase.ease as any } : { duration: 0.4 }}
          style={{ position: "absolute", width: "165px", height: "165px", borderRadius: "50%", border: `1.5px solid ${color}28`, background: `${color}07` }} />
        <motion.div
          key={started ? `blob-${pi}` : "blob-idle"}
          initial={{ scale: started ? prevScale : 1.0 }}
          animate={{ scale: started ? phase.scale : 1.0 }}
          transition={started ? { duration: phase.duration, ease: phase.ease as any } : { duration: 0.4 }}
          style={{ position: "absolute", width: "96px", height: "96px", borderRadius: "50%", background: `radial-gradient(circle at 38% 32%, ${color}ee, ${color}99)`, boxShadow: `0 0 28px ${color}50` }} />
        <div style={{ position: "relative", zIndex: 1, fontSize: "28px", fontWeight: 900, fontFamily: "var(--font-display)", color: "white" }}>{started ? tl : ""}</div>
      </div>

      <div style={{ textAlign: "center", minHeight: "44px" }}>
        <div style={{ fontSize: "19px", fontWeight: 800, fontFamily: "var(--font-display)", color: running ? color : "var(--text-muted)" }}>
          {running ? phase.label : started ? "Pauză" : "Pregătit?"}
        </div>
        {rounds > 0 && <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "3px" }}>Runde: {rounds}</div>}
      </div>

      <div style={{ display: "flex", gap: "10px" }}>
        {!running
          ? <button onClick={handleStart}
              style={{ padding: "11px 36px", borderRadius: "var(--r-md)", background: color, border: "none", color: "white", fontWeight: 700, fontFamily: "var(--font-display)", fontSize: "14px", cursor: "pointer" }}>
              {started ? "Continuă" : "Start"}
            </button>
          : <button onClick={() => setRunning(false)}
              style={{ padding: "11px 36px", borderRadius: "var(--r-md)", background: "var(--glass-2)", border: "1px solid var(--border)", color: "var(--text-primary)", fontWeight: 700, fontFamily: "var(--font-display)", fontSize: "14px", cursor: "pointer" }}>
              Pauză
            </button>
        }
        <button onClick={reset}
          style={{ padding: "11px 16px", borderRadius: "var(--r-md)", background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "15px", cursor: "pointer" }}>↺</button>
      </div>
    </motion.div>
  );
}


const SENSES = [
  { count: 5, sense: "VEZI",         icon: Eye,      color: "#8b5cf6" },
  { count: 4, sense: "AUZI",         icon: Ear,      color: "#38bdf8" },
  { count: 3, sense: "POȚI ATINGE",  icon: Hand,     color: "#34d399" },
  { count: 2, sense: "MIROȘI",       icon: Flower2,  color: "#f97316" },
  { count: 1, sense: "GUȘTI",        icon: Utensils, color: "#f43f5e" },
];

function GroundingExercise({ onBack }: { onBack: () => void }) {
  const [si, setSi]         = useState(0);
  const [checked, setChecked] = useState(0);
  const [done, setDone]       = useState(false);
  const s = SENSES[si];

  const tick = () => {
    if (checked + 1 >= s.count) {
      if (si < SENSES.length - 1) { setSi(i => i + 1); setChecked(0); }
      else setDone(true);
    } else {
      setChecked(c => c + 1);
    }
  };

  const btnStyle = (color: string): React.CSSProperties => ({
    padding: "13px 36px", borderRadius: "var(--r-md)", background: color,
    border: "none", color: "white", fontSize: "14px", fontWeight: 700,
    fontFamily: "var(--font-display)", cursor: "pointer",
  });

  const backBtn = (
    <button onClick={onBack}
      style={{ alignSelf: "flex-start", background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "13px", fontFamily: "var(--font-display)", fontWeight: 600, padding: 0 }}>
      ← Înapoi
    </button>
  );

  if (done) return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "4px 0 12px" }}>
      {backBtn}
      <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.3)", display: "flex", alignItems: "center", justifyContent: "center", marginTop: "16px" }}><Eye size={28} color="#34d399" strokeWidth={1.5} /></div>
      <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "19px", color: "var(--text-primary)", textAlign: "center" }}>Ești în prezent</h3>
      <p style={{ fontSize: "13px", color: "var(--text-muted)", maxWidth: "260px", textAlign: "center", lineHeight: 1.6 }}>
        Observă cum te simți acum față de cum te simțeai la început.
      </p>
      <button onClick={() => { setSi(0); setChecked(0); setDone(false); }}
        style={{ padding: "11px 28px", borderRadius: "var(--r-md)", background: "var(--glass-2)", border: "1px solid var(--border)", color: "var(--text-primary)", fontFamily: "var(--font-display)", fontWeight: 700, cursor: "pointer" }}>
        Repetă
      </button>
    </motion.div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "18px", padding: "4px 0 12px" }}>
      {backBtn}

      <div style={{ display: "flex", gap: "8px" }}>
        {SENSES.map((sx, i) => (
          <div key={i} style={{ width: "8px", height: "8px", borderRadius: "50%", background: i < si ? "var(--success)" : i === si ? s.color : "var(--border)", transition: "all 0.3s" }} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={si} initial={{ opacity: 0, x: 22 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -22 }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", textAlign: "center" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: `${s.color}20`, border: `2px solid ${s.color}55`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <s.icon size={28} color={s.color} strokeWidth={1.5} />
          </div>
          <div style={{ fontSize: "60px", fontWeight: 900, fontFamily: "var(--font-display)", color: s.color, lineHeight: 1 }}>{s.count - checked}</div>
          <div style={{ fontSize: "14px", fontWeight: 600, fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
            lucruri pe care le <span style={{ color: s.color }}>{s.sense}</span>
          </div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "center" }}>
            {Array.from({ length: s.count }).map((_, i) => (
              <div key={i} style={{ width: "24px", height: "24px", borderRadius: "50%", border: `2px solid ${i < checked ? s.color : "var(--border)"}`, background: i < checked ? s.color : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.25s" }}>
                {i < checked && <span style={{ color: "white", fontSize: "12px" }}>✓</span>}
              </div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      <button onClick={tick} style={btnStyle(s.color)}>Am identificat ✓</button>
    </motion.div>
  );
}


const BODY_PARTS = [
  { part: "Cap și frunte",    text: "Simte fruntea. Dacă e încordată, las-o pur și simplu să se înmoaie." },
  { part: "Ochi și față",     text: "Lasă ochii să se închidă ușor. Relaxează maxilarul, nu strânge dinții." },
  { part: "Gât și umeri",     text: "Simte cât de grei sunt umerii. Lasă-i să coboare, nu e nevoie să îi ții sus." },
  { part: "Piept",            text: "Observă cum respiră pieptul. La fiecare expirație, lasă-l să se destindă." },
  { part: "Brațe și mâini",   text: "Relaxează brațele de la cot până la fiecare deget. Lasă-le grele." },
  { part: "Abdomen",          text: "Lasă burta să fie moale. Nu controla nimic, doar observă." },
  { part: "Spate",            text: "Simte suprafața pe care stai. Lasă spatele să fie susținut de ea." },
  { part: "Picioare și tălpi",text: "De la coapse până la degete, lasă totul să cedeze. Ești aproape gata." },
];

function BodyScanExercise({ onBack }: { onBack: () => void }) {
  const [idx, setIdx]   = useState(0);
  const [done, setDone] = useState(false);

  const backBtn = (
    <button onClick={onBack}
      style={{ alignSelf: "flex-start", background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "13px", fontFamily: "var(--font-display)", fontWeight: 600, padding: 0 }}>
      ← Înapoi
    </button>
  );

  if (done) return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "4px 0 12px" }}>
      {backBtn}
      <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.3)", display: "flex", alignItems: "center", justifyContent: "center", marginTop: "16px" }}><HeartPulse size={28} color="#a78bfa" strokeWidth={1.5} /></div>
      <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "19px", color: "var(--text-primary)", textAlign: "center" }}>Scanare completă</h3>
      <p style={{ fontSize: "13px", color: "var(--text-muted)", maxWidth: "260px", textAlign: "center", lineHeight: 1.6 }}>
        Corpul tău este relaxat. Rămâi câteva momente în această stare înainte de a te ridica.
      </p>
      <button onClick={() => { setIdx(0); setDone(false); }}
        style={{ padding: "11px 28px", borderRadius: "var(--r-md)", background: "var(--glass-2)", border: "1px solid var(--border)", color: "var(--text-primary)", fontFamily: "var(--font-display)", fontWeight: 700, cursor: "pointer" }}>
        Repetă
      </button>
    </motion.div>
  );

  const bp = BODY_PARTS[idx];
  const progress = ((idx + 1) / BODY_PARTS.length) * 100;

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "18px", padding: "4px 0 12px" }}>
      {backBtn}

      <div style={{ width: "100%", height: "4px", background: "var(--glass-2)", borderRadius: "var(--r-full)", overflow: "hidden" }}>
        <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }}
          style={{ height: "100%", background: "#a78bfa", borderRadius: "var(--r-full)" }} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={idx} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px", textAlign: "center" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}><HeartPulse size={28} color="#a78bfa" strokeWidth={1.5} /></div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-display)" }}>{idx + 1} / {BODY_PARTS.length}</div>
          <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "20px", color: "#a78bfa" }}>{bp.part}</h3>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.7, maxWidth: "280px" }}>{bp.text}</p>
        </motion.div>
      </AnimatePresence>

      <button onClick={() => idx < BODY_PARTS.length - 1 ? setIdx(i => i + 1) : setDone(true)}
        style={{ padding: "13px 36px", borderRadius: "var(--r-md)", background: "#a78bfa", border: "none", color: "white", fontSize: "14px", fontWeight: 700, fontFamily: "var(--font-display)", cursor: "pointer" }}>
        {idx < BODY_PARTS.length - 1 ? "Continuă →" : "Finalizează"}
      </button>
    </motion.div>
  );
}


export default function UrgentaPage() {
  const [active, setActive] = useState<ExerciseId | null>(null);

  return (
    <div style={{ padding: "clamp(16px,4vw,36px)", width: "100%", boxSizing: "border-box" }}>
      <div className="anim-fade-up" style={{ marginBottom: "28px" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(20px,4vw,30px)", color: "var(--text-primary)", letterSpacing: "-0.025em", marginBottom: "8px" }}>
          Resurse de urgență
        </h1>
        <p style={{ fontSize: "15px", color: "var(--text-muted)", lineHeight: 1.6, maxWidth: "600px" }}>
          Dacă ești în dificultate sau cineva este în pericol, nu ești singur. Ajutorul există.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: "24px" }}>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <h2 className="section-title">Linii de urgență</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {LINES.map(({ name, number, desc, color, urgent }, i) => (
                <div key={name} className={`glass-card anim-fade-up delay-${i + 1}`}
                  style={{ padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px", borderLeft: urgent ? `3px solid ${color}` : "1px solid var(--border)", background: urgent ? `${color}08` : "var(--glass-1)" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px", flexWrap: "wrap" }}>
                      {urgent && <span style={{ fontSize: "10px", fontWeight: 700, fontFamily: "var(--font-display)", padding: "2px 7px", borderRadius: "var(--r-full)", background: `${color}22`, border: `1px solid ${color}44`, color }}>URGENT</span>}
                      <span style={{ fontSize: "14px", fontWeight: 600, fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>{name}</span>
                    </div>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>{desc}</p>
                  </div>
                  <a href={`tel:${number.replace(/\s/g, "")}`}
                    style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 14px", borderRadius: "var(--r-md)", background: `${color}15`, border: `1px solid ${color}33`, color, textDecoration: "none", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "14px", whiteSpace: "nowrap", flexShrink: 0, transition: "all var(--t-fast)" }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = `${color}28`; el.style.transform = "scale(1.04)"; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = `${color}15`; el.style.transform = "scale(1)"; }}>
                    {number}
                  </a>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="section-title">Resurse online</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {RESOURCES.map(({ name, url, desc }) => (
                <a key={name} href={url} target="_blank" rel="noopener noreferrer" className="glass-card glass-interactive"
                  style={{ padding: "13px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", textDecoration: "none", gap: "12px" }}>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 600, fontFamily: "var(--font-display)", color: "var(--accent-light)", marginBottom: "2px" }}>{name}</div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{desc}</div>
                  </div>
                  <ChevronRight size={14} color="var(--text-muted)" strokeWidth={1.6} />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          <div className="glass-card" style={{ padding: "20px", minHeight: "420px", display: "flex", flexDirection: "column" }}>
            <AnimatePresence mode="wait">
              {active ? (
                <motion.div key="exercise" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ flex: 1 }}>
                  {(active === "478" || active === "box" || active === "sigh") && (
                    <BreathingExercise id={active} onBack={() => setActive(null)} />
                  )}
                  {active === "grounding" && <GroundingExercise onBack={() => setActive(null)} />}
                  {active === "bodyscan"  && <BodyScanExercise  onBack={() => setActive(null)} />}
                  {active === "writing"   && null}
                </motion.div>
              ) : (
                <motion.div key="cards" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <h2 className="section-title" style={{ marginBottom: "14px" }}>Tehnici de calmare rapidă</h2>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
                    {TECHNIQUES.map((t, i) => (
                      <div key={t.id}
                        onClick={() => { if (t.animated) setActive(t.id); }}
                        className={`glass-card anim-fade-up delay-${i + 1}`}
                        style={{ padding: "14px", borderLeft: `3px solid ${t.color}`, cursor: t.animated ? "pointer" : "default", transition: "all var(--t-fast)", display: "flex", flexDirection: "column", gap: "8px" }}
                        onMouseEnter={e => { if (t.animated) { const el = e.currentTarget as HTMLElement; el.style.background = "var(--glass-hover)"; el.style.transform = "translateY(-2px)"; } }}
                        onMouseLeave={e => { if (t.animated) { const el = e.currentTarget as HTMLElement; el.style.background = "var(--glass-1)"; el.style.transform = "translateY(0)"; } }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: `${t.color}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <t.icon size={16} color={t.color} strokeWidth={1.6} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: "12px", fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--text-primary)", lineHeight: 1.3 }}>{t.title}</div>
                            <div style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-display)", display: "flex", alignItems: "center", gap: "3px" }}><Clock size={10} strokeWidth={1.6} /> {t.time}</div>
                          </div>
                        </div>
                        <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>{t.desc}</p>
                        {t.animated && (
                          <div style={{ fontSize: "11px", color: t.color, fontWeight: 700, fontFamily: "var(--font-display)", marginTop: "2px" }}>▶ Începe</div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div style={{ padding: "20px", background: "var(--danger-bg)", border: "1px solid var(--danger-border)", borderRadius: "var(--r-xl)", position: "sticky", top: "24px" }}>
            <div style={{ fontSize: "14px", fontWeight: 800, fontFamily: "var(--font-display)", color: "var(--danger)", marginBottom: "10px" }}>Gânduri de autovătămare?</div>
            <p style={{ fontSize: "13px", color: "rgba(248,113,113,0.85)", lineHeight: 1.65, marginBottom: "14px" }}>Sunați imediat la 112 sau mergeți la cel mai apropiat spital. Nu sunteți singur.</p>
            <a href="tel:112"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "48px", borderRadius: "var(--r-md)", background: "var(--danger)", color: "white", textDecoration: "none", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "18px", transition: "all var(--t-fast)" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = "scale(1.02)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "scale(1)"}>
              Sună 112
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}
