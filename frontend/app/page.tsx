"use client";

import { useRef, useState, useEffect } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useInView,
  useMotionValueEvent,
} from "framer-motion";
import {
  Brain, Shield, Heart, BarChart2, Wind, Users,
  Menu, X, ArrowRight, ChevronDown, Sparkles,
  MessageCircle, CheckCircle,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

const MagicRings = dynamic(() => import("../components/ui/MagicRings"), { ssr: false });

const GlobalStyles = () => (
  <style>{`
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body { background: var(--bg-base); color: var(--text-primary); font-family: var(--font-display); overflow-x: hidden; }

    .glass-card { background: rgba(139,92,246,0.07); border: 1px solid rgba(139,92,246,0.18); border-radius: 16px; backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); }

    .btn-primary { background: linear-gradient(135deg,#8b5cf6 0%,#7c3aed 100%); color:#fff; border:none; border-radius:12px; padding:13px 28px; font-size:15px; font-weight:600; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:8px; text-decoration:none; transition:transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s; box-shadow:0 4px 20px rgba(139,92,246,0.38); font-family:var(--font-display); line-height:1; }
    .btn-primary:hover { box-shadow:0 6px 30px rgba(139,92,246,0.55); transform:scale(1.04); }
    .btn-ghost { background:transparent; color:var(--text-primary); border:1px solid rgba(241,240,245,0.18); border-radius:12px; padding:13px 28px; font-size:15px; font-weight:500; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:8px; text-decoration:none; transition:border-color .2s,background .2s; font-family:var(--font-display); line-height:1; }
    .btn-ghost:hover { border-color:rgba(139,92,246,0.5); background:rgba(139,92,246,0.08); }

    .btn-nav-shine { position: relative; color: rgba(241, 240, 245, 0.85); background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 12px; padding: 8px 18px; font-size: 14px; font-weight: 600; text-decoration: none; overflow: hidden; display: inline-flex; align-items: center; justify-content: center; transition: all 0.3s ease; }
    .btn-nav-shine::after { content: ''; position: absolute; top: 0; left: -150%; width: 50%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent); transform: skewX(-20deg); transition: left 0.6s cubic-bezier(0.4, 0, 0.2, 1); }
    .btn-nav-shine:hover { color: #fff; background: rgba(255, 255, 255, 0.06); border-color: rgba(139, 92, 246, 0.35); box-shadow: 0 0 16px rgba(139, 92, 246, 0.15); }
    .btn-nav-shine:hover::after { left: 200%; }

    .gradient-text { background:linear-gradient(135deg,#a78bfa 0%,#7c3aed 50%,#c4b5fd 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }

    section { position:relative; }

    @keyframes breathe-a {
      0%,100% { opacity:0.55; }
      50%      { opacity:0.62; }
    }
    @keyframes breathe-b {
      0%,100% { opacity:0.40; }
      50%      { opacity:0.47; }
    }

    @keyframes typing-dot {
      0%,60%,100% { transform:translateY(0); opacity:0.4; }
      30%          { transform:translateY(-6px); opacity:1; }
    }
    .typing-dot { width:7px; height:7px; border-radius:50%; background:#a78bfa; animation:typing-dot 1.2s infinite; }
    .typing-dot:nth-child(2) { animation-delay:.2s; }
    .typing-dot:nth-child(3) { animation-delay:.4s; }

    @keyframes spin-border { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

    @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }

    .nav-pill-link {
      padding: 7px 15px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      color: rgba(241,240,245,0.65);
      text-decoration: none;
      transition: background 0.18s ease, color 0.18s ease;
      white-space: nowrap;
    }
    .nav-pill-link:hover { background: rgba(139,92,246,0.14); color: #f1f0f5; }

    .hero-layout { display:grid; grid-template-columns:1fr 1fr; gap:60px; align-items:center; width:100%; max-width:1200px; margin:0 auto; }
    .hero-left { text-align:left; }

    .stats-grid      { display:grid; grid-template-columns:repeat(4,1fr); gap:32px; }
    .features-grid   { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
    .mood-layout     { display:flex; align-items:center; gap:64px; }

    .mockup-grid { display:grid; grid-template-columns:1fr 1.5fr 1fr; gap:24px; align-items:center; max-width:1200px; margin:0 auto; }
    .mockup-side { display:block; }
    @media (max-width:960px) {
      .mockup-grid { grid-template-columns:1fr; max-width:600px; }
      .mockup-side { display:none; }
    }

    @keyframes breathe-ring {
      0%,100% { transform:scale(1); opacity:0.6; }
      50%      { transform:scale(1.15); opacity:0.9; }
    }

    .hero-section { min-height: 100vh; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; padding: 120px 24px 60px; }

    @media (max-width:960px) {
      .hero-section { min-height: auto; padding-top: 150px; padding-bottom: 0px; }
      .nav-desktop { display:none !important; }
      .nav-hamburger { display:flex !important; }
      .hero-layout { grid-template-columns:1fr; gap:40px; }
      .hero-left { text-align:center; }
      .hero-left .hero-badge-wrap { justify-content:center; display:flex; }
      .hero-left .hero-btns { justify-content:center; }
      .hero-left p { margin-left:auto; margin-right:auto; }
    }
    @media (max-width:768px) {
      .stats-grid    { grid-template-columns:1fr 1fr; }
      .features-grid { grid-template-columns:1fr; }
      .mood-layout   { flex-direction:column; }
      .footer-bottom { flex-direction:column !important; gap:6px !important; text-align:center; }
    }
  `}</style>
);



const CHAT_MSGS = [
  { role: "user", text: "Mă simt copleșit și anxios de câteva zile.", time: "14:32" },
  { role: "ai", text: "Înțeleg că treci printr-o perioadă dificilă. Este complet normal ca stresul să se acumuleze uneori.\n\nO tehnică utilă și recomandată clinic pentru reducerea rapidă a anxietății este exercițiul de respirație 4-7-8. Ai mai încercat-o până acum?", time: "14:32", source: { filename: "Tehnici Clinice de Relaxare", page: 3 } },
  { role: "user", text: "Da, dar nu-mi mai amintesc pașii exacti", time: "14:33" },
  { role: "ai", text: "Sigur!\n\nInspiră pe nas 4 secunde\nReține respirația 7 secunde\nExpiră pe gură 8 secunde\n\nRepetă de 4 ori. Activează sistemul nervos parasimpatic și reduce anxietatea rapid. Iar dacă încă persistă poți să vorbești cu unul dintre specialiștii noștri", time: "14:33" },
] as const;

function RealChatMockup() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const [typedText, setTypedText] = useState("");
  const [showTyping, setShowTyping] = useState(true);
  const fullText = CHAT_MSGS[3].text;
  useEffect(() => {
    if (!inView) return;
    let iv: ReturnType<typeof setInterval>;
    const to = setTimeout(() => {
      setShowTyping(false);
      let i = 0;
      iv = setInterval(() => { i++; setTypedText(fullText.slice(0, i)); if (i >= fullText.length) clearInterval(iv); }, 18);
    }, 1800);
    return () => { clearTimeout(to); clearInterval(iv); };
  }, [inView, fullText]);

  return (
    <div ref={ref} style={{ height: "clamp(380px,70vh,520px)", background: "rgba(11,10,30,0.85)", border: "1px solid rgba(139,92,246,0.28)", borderRadius: 20, backdropFilter: "blur(24px)", boxShadow: "0 32px 80px rgba(0,0,0,0.65),0 0 60px rgba(139,92,246,0.1)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(139,92,246,0.18)", display: "flex", alignItems: "center", gap: 10, flexShrink: 0, background: "rgba(11,10,30,0.5)" }}>
        <img src="/logo.png" alt="SoulSide" width={28} height={28} style={{ borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#f1f0f5", margin: 0 }}>SoulSide</p>
          <p style={{ fontSize: 11, color: "#4ade80", display: "flex", alignItems: "center", gap: 4, margin: 0 }}>
            <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#4ade80" }} />Online acum
          </p>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 14 }}>
        {CHAT_MSGS.map((msg, i) => {
          const isUser = msg.role === "user";
          const isLast = i === CHAT_MSGS.length - 1;
          const source = (msg as any).source;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.38 + 0.25, duration: 0.4 }} style={{ display: "flex", gap: 8, alignItems: "flex-start", flexDirection: isUser ? "row-reverse" : "row" }}>
              {isUser
                ? <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, marginTop: 2, background: "linear-gradient(135deg,#8b5cf6,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff" }}>T</div>
                : <img src="/logo.png" alt="" width={28} height={28} style={{ borderRadius: 8, objectFit: "cover", flexShrink: 0, marginTop: 2 }} />
              }
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start", gap: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(241,240,245,0.42)" }}>{isUser ? "Tu" : "SoulSide"}</span>
                  <span style={{ fontSize: 10, color: "rgba(241,240,245,0.28)" }}>{msg.time}</span>
                </div>
                <div style={{ maxWidth: "80%", padding: "10px 14px", borderRadius: isUser ? "15px 4px 15px 15px" : "4px 15px 15px 15px", fontSize: 13, lineHeight: 1.65, whiteSpace: "pre-line", background: isUser ? "rgba(139,92,246,0.18)" : "rgba(139,92,246,0.07)", border: `1px solid ${isUser ? "rgba(139,92,246,0.35)" : "rgba(139,92,246,0.15)"}`, color: "#f1f0f5", wordBreak: "break-word" }}>
                  {isLast ? showTyping ? <div style={{ display: "flex", gap: 5, padding: "2px 0" }}><div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" /></div> : typedText : msg.text}
                </div>
                {!isUser && source && (
                  <div style={{ maxWidth: "80%", marginTop: 3, padding: "6px 10px", borderRadius: 8, background: "rgba(139,92,246,0.05)", border: "1px solid rgba(139,92,246,0.15)" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#8b5cf6", letterSpacing: "0.03em" }}>Sursă</span>
                    <div style={{ marginTop: 2, fontSize: 11, color: "rgba(241,240,245,0.42)" }}>{source.filename}, p. {source.page}</div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
      <div style={{ padding: "10px 14px 12px", flexShrink: 0, borderTop: "1px solid rgba(139,92,246,0.18)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "rgba(139,92,246,0.05)", border: "1.5px solid rgba(139,92,246,0.18)", borderRadius: 16 }}>
          <div style={{ flex: 1, fontSize: 13, color: "rgba(241,240,245,0.32)", userSelect: "none" }}>Mesaj pentru SoulSide...</div>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg,#8b5cf6,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <ArrowRight size={13} color="#fff" />
          </div>
        </div>
      </div>
    </div>
  );
}

const BREATH_PHASES = [
  { name: "Inspiră", duration: 4, targetScale: 1, color: "#a78bfa", ease: "easeIn" as const },
  { name: "Reține", duration: 7, targetScale: 1, color: "#c4b5fd", ease: "linear" as const },
  { name: "Expiră", duration: 8, targetScale: 0.42, color: "#7c3aed", ease: "easeOut" as const },
];

function BreathingCard() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [phase, setPhase] = useState(0);
  const [count, setCount] = useState(4);

  useEffect(() => {
    if (!inView) return;
    const { duration } = BREATH_PHASES[phase];
    setCount(duration);
    const tick = setInterval(() => setCount(c => Math.max(0, c - 1)), 1000);
    const next = setTimeout(() => setPhase(p => (p + 1) % 3), duration * 1000);
    return () => { clearInterval(tick); clearTimeout(next); };
  }, [phase, inView]);

  const current = BREATH_PHASES[phase];

  return (
    <div ref={ref} style={{ background: "rgba(11,10,30,0.75)", border: "1px solid rgba(139,92,246,0.25)", borderRadius: 20, backdropFilter: "blur(20px)", padding: "40px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
      <div style={{ position: "relative", width: 160, height: 160, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: `radial-gradient(circle, ${current.color}20 0%, transparent 70%)`, transition: "background 1s ease" }} />
        <motion.div
          animate={{ scale: current.targetScale }}
          transition={{ duration: current.duration, ease: current.ease }}
          initial={{ scale: 0.42 }}
          style={{ width: 130, height: 130, borderRadius: "50%", border: `2px solid ${current.color}`, background: `radial-gradient(circle, ${current.color}15 0%, transparent 70%)`, boxShadow: `0 0 32px ${current.color}40`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
        >
          <span style={{ fontSize: 32, fontWeight: 900, color: current.color, lineHeight: 1 }}>{count}</span>
          <span style={{ fontSize: 10, color: "rgba(241,240,245,0.45)", fontWeight: 600, letterSpacing: "0.06em" }}>sec</span>
        </motion.div>
      </div>

      <motion.div key={phase} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        style={{ fontSize: 20, fontWeight: 800, color: current.color, letterSpacing: "-0.3px" }}>
        {current.name}
      </motion.div>
    </div>
  );
}

function SpecialistMockup() {
  const [requested, setRequested] = useState(false);

  return (
    <div style={{ background: "rgba(11,10,30,0.75)", border: "1px solid rgba(139,92,246,0.25)", borderRadius: 20, backdropFilter: "blur(20px)", padding: "24px", display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Users size={15} color="#a78bfa" />
        <span style={{ fontSize: 13, fontWeight: 700, color: "#f1f0f5" }}>Exemplu de specialist</span>
      </div>

      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg,#8b5cf6,#6d28d9)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900, color: "#fff", flexShrink: 0, boxShadow: "0 0 20px rgba(139,92,246,0.4)" }}>
          AI
        </div>
        <div>
          <p style={{ fontSize: 15, fontWeight: 800, color: "#f1f0f5", margin: 0, letterSpacing: "-0.2px" }}>Dr. Ana Ionescu</p>
          <p style={{ fontSize: 12, color: "#a78bfa", fontWeight: 600, margin: "2px 0 0" }}>Psiholog clinician</p>
          <p style={{ fontSize: 11, color: "rgba(241,240,245,0.4)", margin: "2px 0 0" }}>București · 8 ani experiență</p>
        </div>
      </div>

      <p style={{ fontSize: 12.5, color: "rgba(241,240,245,0.6)", lineHeight: 1.65, margin: 0 }}>
        Specializată în terapie cognitiv-comportamentală, managementul anxietății și depresiei. Abordare caldă, orientată pe soluții practice.
      </p>


      <motion.button
        onClick={() => setRequested(true)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        style={{ width: "100%", padding: "11px", borderRadius: 12, cursor: "pointer", background: requested ? "rgba(74,222,128,0.15)" : "linear-gradient(135deg,#8b5cf6,#7c3aed)", color: requested ? "#4ade80" : "#fff", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "background 0.3s", border: requested ? "1px solid rgba(74,222,128,0.3)" : "none" } as any}
      >
        {requested ? <><CheckCircle size={14} /> Cerere trimisă!</> : <><ArrowRight size={14} /> Solicită programare</>}
      </motion.button>
    </div>
  );
}

function FeatureCard({ icon, color, title, desc, delay = 0 }: { icon: React.ReactNode; color: string; title: string; desc: string; delay?: number }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      style={{ position: "relative" }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    >
      <motion.div style={{ position: "absolute", inset: -1, borderRadius: 21, overflow: "hidden", opacity: hovered ? 1 : 0, transition: "opacity 0.6s ease" }}>
        <motion.div
          animate={hovered ? { rotate: 360 } : { rotate: 0 }}
          transition={hovered ? { duration: 10, ease: "linear", repeat: Infinity, repeatType: "loop" } : { duration: 0 }}
          style={{
            position: "absolute", width: "300%", height: "300%", top: "-100%", left: "-100%",
            background: `conic-gradient(from 0deg at 50% 50%,
              transparent 0deg,
              transparent 170deg,
              ${color}44 174deg,
              ${color}bb 178deg,
              ${color} 180deg,
              ${color}bb 182deg,
              ${color}44 186deg,
              transparent 190deg,
              transparent 350deg,
              ${color}44 354deg,
              ${color}bb 358deg,
              ${color} 360deg
            )`,
            filter: "blur(2px)",
          }}
        />
      </motion.div>
      <div style={{ position: "absolute", inset: 0, borderRadius: 20, background: color, opacity: hovered ? 0.07 : 0, filter: "blur(28px)", transition: "opacity 0.5s ease", pointerEvents: "none" }} />
      <div style={{ position: "relative", background: "rgba(3,2,8,0.92)", border: `1px solid ${hovered ? `${color}44` : "rgba(139,92,246,0.14)"}`, borderRadius: 20, padding: 28, backdropFilter: "blur(18px)", transition: "border-color 0.4s ease", height: "100%" }}>
        <div style={{ position: "absolute", top: 0, left: "20%", right: "20%", height: 1, background: `linear-gradient(90deg,transparent,${color}60,transparent)`, opacity: hovered ? 1 : 0, transition: "opacity 0.4s" }} />
        <div style={{ position: "absolute", bottom: 0, left: "20%", right: "20%", height: 1, background: `linear-gradient(90deg,transparent,${color}60,transparent)`, opacity: hovered ? 1 : 0, transition: "opacity 0.4s" }} />
        <div style={{ width: 52, height: 52, borderRadius: 14, background: `${color}18`, border: `1px solid ${hovered ? `${color}55` : `${color}28`}`, display: "flex", alignItems: "center", justifyContent: "center", color, marginBottom: 18, boxShadow: hovered ? `0 0 28px ${color}30` : "none", transition: "all 0.3s ease" }}>
          {icon}
        </div>
        <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10, color: "#f1f0f5" }}>{title}</h3>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.65 }}>{desc}</p>
      </div>
    </motion.div>
  );
}

const HOW_STEPS = [
  { num: "01", icon: <MessageCircle size={32} />, title: "Exprimă-te liber", desc: "Scrie-i lui SoulSide despre ce simți, exact așa cum i-ai scrie unui prieten. Fie că ai o zi proastă sau un moment de anxietate, SoulSide e punctul tău de pornire." },
  { num: "02", icon: <Heart size={32} />, title: "Primește ghidare imediată", desc: "SoulSide analizează mesajul, caută în documentele de specialitate din baza de cunoștințe și îți oferă un răspuns plus soluții clare, cum ar fi tehnici pas cu pas de calmare sau respirație." },
  { num: "03", icon: <Brain size={32} />, title: "Continuă oricând discuția", desc: "Conversațiile tale sunt salvate. Când revii, poți deschide o discuție mai veche și poți continua de unde ai rămas." },
];

function HowItWorksSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });
  const [activeStep, setActiveStep] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const progressH = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (latest < 0.34) setActiveStep(0);
    else if (latest < 0.67) setActiveStep(1);
    else setActiveStep(2);
  });

  const sectionHeader = (
    <div style={{ marginBottom: isMobile ? 40 : 64, textAlign: "left" }}>
      <h2 style={{ fontSize: "clamp(28px,4vw,48px)", fontWeight: 800, letterSpacing: "-1px", lineHeight: 1.1, fontFamily: "var(--font-display)" }}>
        Cum funcționează{" "}
        <span style={{ background: "linear-gradient(135deg,#a78bfa,#7c3aed)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>SoulSide</span>
      </h2>
    </div>
  );

  if (isMobile) {
    return (
      <div id="how" style={{ background: "rgba(139,92,246,0.025)", padding: "80px 24px" }}>
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          {sectionHeader}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {HOW_STEPS.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <div style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.22)", borderRadius: 20, padding: "28px 24px", backdropFilter: "blur(18px)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg,#8b5cf6,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>
                      {step.icon}
                    </div>
                    <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: "-2px", lineHeight: 1, background: "linear-gradient(135deg,rgba(139,92,246,0.7),rgba(124,58,237,0.3))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                      {step.num}
                    </div>
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 10, color: "#f1f0f5", fontFamily: "var(--font-display)" }}>{step.title}</h3>
                  <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, margin: 0 }}>{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} id="how" style={{ position: "relative", minHeight: "300vh", background: "rgba(139,92,246,0.025)" }}>
      <div style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden", display: "flex", alignItems: "center" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", width: "100%", padding: "0 24px" }}>

          {sectionHeader}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>

            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ display: "flex", gap: 28 }}>
                <div style={{ position: "relative", width: 3, height: 220, borderRadius: 4, background: "rgba(139,92,246,0.15)", flexShrink: 0 }}>
                  <motion.div style={{ position: "absolute", top: 0, left: 0, right: 0, height: progressH, borderRadius: 4, background: "linear-gradient(to bottom,#8b5cf6,#6d28d9)" }} />
                </div>

                <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: 220 }}>
                  {HOW_STEPS.map((step, i) => (
                    <motion.div
                      key={step.num}
                      animate={{ opacity: activeStep === i ? 1 : 0.3, scale: activeStep === i ? 1 : 0.92 }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                      style={{ display: "flex", alignItems: "center", gap: 16, originX: 0 }}
                    >
                      <div style={{
                        width: 44, height: 44, borderRadius: "50%",
                        border: `2px solid ${activeStep === i ? "#8b5cf6" : "rgba(139,92,246,0.3)"}`,
                        background: activeStep === i ? "rgba(139,92,246,0.2)" : "rgba(139,92,246,0.06)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 800, fontSize: 13, color: activeStep === i ? "#a78bfa" : "rgba(139,92,246,0.5)",
                        flexShrink: 0, transition: "all 0.35s ease",
                      }}>
                        {step.num}
                      </div>
                      <span style={{ fontWeight: 600, fontSize: 15, color: "#f1f0f5" }}>{step.title}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ position: "relative", width: "100%", height: 360 }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeStep}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.38, ease: "easeOut" }}
                    style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center" }}
                  >
                    <div style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.22)", borderRadius: 24, padding: "36px 40px", backdropFilter: "blur(18px)", width: "100%" }}>
                      <div style={{ width: 64, height: 64, borderRadius: 18, background: "linear-gradient(135deg,#8b5cf6,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", marginBottom: 20 }}>
                        {HOW_STEPS[activeStep].icon}
                      </div>
                      <div style={{ fontSize: "clamp(44px,6vw,68px)", fontWeight: 900, letterSpacing: "-3px", lineHeight: 1, background: "linear-gradient(135deg,rgba(139,92,246,0.55),rgba(124,58,237,0.18))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", marginBottom: 14 }}>
                        {HOW_STEPS[activeStep].num}
                      </div>
                      <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12, color: "#f1f0f5", fontFamily: "var(--font-display)" }}>{HOW_STEPS[activeStep].title}</h3>
                      <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.7 }}>{HOW_STEPS[activeStep].desc}</p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

const EMOTION_COLORS: Record<string, string> = {
  fericit: "#4ade80", anxios: "#fb923c", trist: "#60a5fa",
  frustrat: "#f87171", linistit: "#a78bfa", neutru: "rgba(241,240,245,0.2)",
};
const CALENDAR_DATA = [
  "linistit", "fericit", "fericit", "neutru", "anxios", "trist", "linistit",
  "fericit", "linistit", "anxios", "anxios", "frustrat", "linistit", "fericit",
  "neutru", "fericit", "fericit", "linistit", "linistit", "fericit", "anxios",
  "trist", "linistit", "fericit", "fericit", "neutru", "linistit", "fericit",
  "fericit", "linistit",
];

function MoodCalendar() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  return (
    <div ref={ref} className="glass-card" style={{ padding: 24 }}>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
        <span>Martie 2026</span>
        <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 400 }}>30 zile înregistrate</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 8 }}>
        {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => <div key={i} style={{ textAlign: "center", fontSize: 11, color: "var(--text-secondary)", fontWeight: 600 }}>{d}</div>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6 }}>
        {CALENDAR_DATA.map((emotion, i) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0 }} animate={inView ? { opacity: 1, scale: 1 } : {}} transition={{ delay: i * 0.025, type: "spring", stiffness: 260, damping: 18 }} title={emotion} whileHover={{ scale: 1.3 }} style={{ width: "100%", aspectRatio: "1", borderRadius: "50%", background: EMOTION_COLORS[emotion], cursor: "pointer" }} />
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 20 }}>
        {[["Fericit", "fericit"], ["Anxios", "anxios"], ["Trist", "trist"], ["Frustrat", "frustrat"], ["Liniștit", "linistit"]].map(([label, key]) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-secondary)" }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: EMOTION_COLORS[key] }} />{label}
          </div>
        ))}
      </div>
    </div>
  );
}

function FaqItem({ question, answer, delay = 0 }: { question: string; answer: string; delay?: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay, duration: 0.4 }}
      style={{ background: open ? "rgba(139,92,246,0.1)" : "rgba(255,255,255,0.04)", borderRadius: 16, border: `1px solid ${open ? "#8b5cf6" : "rgba(255,255,255,0.08)"}`, boxShadow: open ? "0 0 32px rgba(139,92,246,0.2)" : "none", transition: "background 0.3s, border-color 0.3s, box-shadow 0.3s" }}
    >
      <button onClick={() => setOpen(!open)} style={{ width: "100%", padding: "22px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}>
        <span style={{ fontSize: 16, fontWeight: 600, paddingRight: 16, color: open ? "#fff" : "rgba(241,240,245,0.85)", transition: "color 0.3s", fontFamily: "var(--font-display)" }}>{question}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ type: "spring", stiffness: 220, damping: 22 }} style={{ flexShrink: 0 }}>
          <ChevronDown size={22} color={open ? "#8b5cf6" : "rgba(241,240,245,0.38)"} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1, transition: { height: { type: "spring", stiffness: 180, damping: 22 }, opacity: { duration: 0.22, delay: 0.06 } } }}
            exit={{ height: 0, opacity: 0, transition: { height: { type: "spring", stiffness: 260, damping: 28 }, opacity: { duration: 0.16 } } }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "0 24px 22px" }}>
              <div style={{ height: 1, background: "linear-gradient(90deg,transparent,rgba(139,92,246,0.5),transparent)", marginBottom: 14 }} />
              <p style={{ fontSize: 15, lineHeight: 1.7, color: "rgba(241,240,245,0.68)" }}>{answer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
          style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(3,2,8,0.97)", backdropFilter: "blur(24px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 32 }}>
          <button onClick={onClose} style={{ position: "absolute", top: 24, right: 24, background: "transparent", border: "none", cursor: "pointer", color: "#f1f0f5" }}><X size={28} /></button>
          {[{ label: "Funcționalități", href: "#features" }, { label: "Cum funcționează", href: "#how" }, { label: "Specialiști", href: "/specialists" }, { label: "FAQ", href: "#faq" }].map((item, i) => (
            <motion.a key={item.label} href={item.href} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} onClick={onClose} style={{ fontSize: 28, fontWeight: 700, color: "#f1f0f5", textDecoration: "none" }}>{item.label}</motion.a>
          ))}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "80%", maxWidth: 280 }}>
            <Link href="/login" onClick={onClose} className="btn-ghost" style={{ justifyContent: "center" }}>Autentificare</Link>
            <Link href="/register" onClick={onClose} className="btn-primary" style={{ justifyContent: "center" }}>Încearcă acum <ArrowRight size={16} /></Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [contentKey, setContentKey] = useState(0);

  useEffect(() => {
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      setContentKey(k => k + 1);
    });
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth > 960);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const FEATURES = [
    { icon: <Brain size={26} />, color: "#8b5cf6", title: "Chat AI", desc: "Tehnologia RAG caută în timp real în peste 30 de documente de specialitate, iar sub fiecare răspuns vezi sursa folosită." },
    { icon: <Shield size={26} />, color: "#06b6d4", title: "Securitate", desc: "Parolele sunt stocate cu bcrypt, sesiunile folosesc JWT în cookie-uri httpOnly, iar toată comunicarea e criptată prin HTTPS. Nu vindem datele tale." },
    { icon: <Heart size={26} />, color: "#ec4899", title: "Empatic", desc: "SoulSide te ascultă fără să judece. Conversațiile tale sunt salvate, așa că poți relua oricând o discuție de unde ai rămas, la orice oră." },
    { icon: <BarChart2 size={26} />, color: "#f59e0b", title: "Jurnal de Dispoziție", desc: "Înregistrează emoțiile zilnic pe un calendar vizual. Descoperă tipare, urmărești progresul și primești insight-uri personalizate în timp real." },
    { icon: <Wind size={26} />, color: "#10b981", title: "Exerciții de Urgență", desc: "Respirație 4-7-8, box breathing, grounding 5-4-3-2-1, body scan ghidat. Instrumente clinice la un click distanță, oricând ai nevoie." },
    { icon: <Users size={26} />, color: "#a78bfa", title: "Specialiști", desc: "Când ai nevoie de mai mult decât asistentul AI, găsești în aplicație un director de psihologi și psihiatri și le poți trimite o cerere de programare." },
  ];

  const FAQS = [
    { question: "Datele mele sunt private și securizate?", answer: "Parolele sunt stocate cu bcrypt, sesiunile folosesc JWT în cookie-uri httpOnly, iar toată comunicarea e criptată prin HTTPS. Nu vindem datele tale și nu le folosim pentru antrenarea modelelor. Textul conversațiilor e procesat de Groq pentru a genera răspunsurile. Detalii găsești în Politica de confidențialitate." },
    { question: "Ce este tehnologia RAG și cum mă ajută?", answer: "RAG (Retrieval-Augmented Generation) înseamnă că, înainte să răspundă, SoulSide caută în peste 30 de documente de specialitate și folosește pasajele relevante. Răspunsurile și exercițiile recomandate se bazează pe aceste surse, iar sursa e afișată sub mesaj. SoulSide nu înlocuiește însă un specialist." },
    { question: "SoulSide înlocuiește un terapeut uman?", answer: "Nu. SoulSide este un instrument de suport complementar, nu un înlocuitor al terapiei profesionale. Te ajutăm să procesezi emoțiile zilnic și să rămâi conectat la starea ta mintală, și îți facilităm accesul la specialiști atunci când ai nevoie." },
    { question: "Este disponibil 24/7, chiar și noaptea?", answer: "Da. SoulSide rulează non-stop. Fie că ai o criză de anxietate la 3 dimineața sau vrei să-ți înregistrezi starea înainte de somn - AI-ul și exercițiile de urgență sunt întotdeauna disponibile." },
    { question: "Cum pot contacta un specialist prin aplicație?", answer: "În secțiunea Specialiști poți vedea profilul și specialitățile psihologilor și psihiatrilor din director și le poți trimite o cerere de consultație." },
  ];

  const NAV_LINKS = [
    { label: "Funcționalități", href: "#features" },
    { label: "Cum funcționează", href: "#how" },
    { label: "Specialiști", href: "/specialists" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <>
      <GlobalStyles />
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: "14px 24px", pointerEvents: "none" }}>
        <motion.nav
          initial={{ y: -90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 28, delay: 0.1 }}
          style={{
            maxWidth: 1100, margin: "0 auto",
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
            background: scrolled ? "rgba(6,4,18,0.92)" : "rgba(6,4,18,0.78)",
            backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(139,92,246,0.15)",
            borderRadius: 16,
            padding: "10px 14px 10px 16px",
            boxShadow: scrolled ? "0 8px 32px rgba(0,0,0,0.45), 0 0 0 1px rgba(139,92,246,0.06), inset 0 1px 0 rgba(255,255,255,0.04)" : "none",
            pointerEvents: "all",
            transition: "all 0.3s ease",
          }}
        >
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0 }}>
            <img src="/logo.png" alt="SoulSide" width={34} height={34} style={{ borderRadius: 9, filter: "drop-shadow(0 0 10px rgba(139,92,246,0.7))" }} />
            <span style={{ fontSize: 18, fontWeight: 800, color: "#f1f0f5", letterSpacing: "-0.4px", fontFamily: "var(--font-display)" }}>SoulSide</span>
          </Link>

          <div className="nav-desktop" style={{ display: "flex", alignItems: "center", gap: 2 }}>
            {NAV_LINKS.map(({ label, href }) => (
              <a key={label} href={href} className="nav-pill-link">{label}</a>
            ))}
          </div>

          <div className="nav-desktop" style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <Link href="/login" className="btn-nav-shine">Autentificare</Link>
            <Link href="/register" className="btn-nav-shine" style={{ background: "linear-gradient(135deg,#8b5cf6 0%,#7c3aed 100%)", borderColor: "transparent", color: "#fff" }}>Încearcă acum</Link>
          </div>

          <button className="nav-hamburger" style={{ display: "none", background: "transparent", border: "none", cursor: "pointer", color: "#f1f0f5", pointerEvents: "all" }} onClick={() => setMenuOpen(true)}>
            <Menu size={24} />
          </button>
        </motion.nav>
      </div>

      <section className="hero-section">
        {isDesktop && (
          <div style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none" }}>
            <MagicRings
              color="#a78bfa"
              colorTwo="#7c3aed"
              ringCount={6}
              speed={1}
              attenuation={10}
              lineThickness={2}
              baseRadius={0.43}
              radiusStep={0.1}
              scaleRate={0.1}
              opacity={1}
              noiseAmount={0.08}
              ringGap={1.5}
              fadeIn={0.7}
              fadeOut={0.5}
              followMouse={false}
              mouseInfluence={0}
              hoverScale={1}
              parallax={0}
              clickBurst={false}
            />
          </div>
        )}

        <div style={{ position: "relative", zIndex: 2, textAlign: "center", padding: "0 24px", maxWidth: 720 }}>
          <motion.h1
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.7 }}
            style={{ fontSize: "clamp(38px,5.5vw,72px)", fontWeight: 900, lineHeight: 1.08, letterSpacing: "-2px", marginBottom: 24, fontFamily: "var(--font-display)" }}>
            Sănătatea ta mintală<br /><span className="gradient-text">merită îngrijire reală</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            style={{ fontSize: "clamp(15px,1.8vw,18px)", color: "var(--text-secondary)", lineHeight: 1.65, maxWidth: 480, margin: "0 auto" }}>
            Sprijin emoțional 24/7. Te ascultă, te înțelege, te ghidează cu soluții reale.
          </motion.p>
        </div>
      </section>

      <section style={{ padding: "40px 24px 80px" }}>
        <motion.div className="mockup-grid" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
          <div className="mockup-side"><BreathingCard /></div>
          <RealChatMockup />
          <div className="mockup-side"><SpecialistMockup /></div>
        </motion.div>
      </section>

      <div key={contentKey}>


        <section id="features" style={{ padding: "100px 24px" }}>
          <div style={{ maxWidth: 1080, margin: "0 auto" }}>
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: "center", marginBottom: 64 }}>
              <h2 style={{ fontSize: "clamp(28px,4vw,48px)", fontWeight: 800, letterSpacing: "-1px", marginBottom: 16, fontFamily: "var(--font-display)" }}>
                Funcționalități construite<br /><span className="gradient-text">pentru bunăstarea ta</span>
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: 17, maxWidth: 520, margin: "0 auto" }}>
                Fiecare funcționalitate a fost gândită cu atenție pentru a crea un ecosistem complet de suport emoțional.
              </p>
            </motion.div>
            <div className="features-grid">
              {FEATURES.map((f, i) => <FeatureCard key={f.title} {...f} delay={i * 0.08} />)}
            </div>
          </div>
        </section>

        <HowItWorksSection />

        <section style={{ padding: "100px 24px" }}>
          <div style={{ maxWidth: 1080, margin: "0 auto" }}>
            <div className="mood-layout">
              <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} style={{ flex: 1 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)", borderRadius: 100, padding: "6px 16px", fontSize: 13, color: "#a78bfa", fontWeight: 600, marginBottom: 20 }}>
                  Jurnal de Dispoziție
                </div>
                <h2 style={{ fontSize: "clamp(26px,3.5vw,44px)", fontWeight: 800, letterSpacing: "-1px", marginBottom: 20, fontFamily: "var(--font-display)" }}>
                  Înțelege-ți emoțiile<br /><span className="gradient-text">zi de zi</span>
                </h2>
                <p style={{ color: "var(--text-secondary)", fontSize: 16, lineHeight: 1.7, marginBottom: 28 }}>
                  Înregistrează cum te simți în fiecare zi pe un calendar vizual colorat. SoulSide detectează tipare, evidențiază tendințele și îți oferă insight-uri despre starea ta.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {["Calendar lunar cu vizualizare emoțională", "Jurnal în care poți să-ți verși toate gândurile", "Grafice cu evoluția stării tale de spirit", "Statistici despre cum te simți de-a lungul timpului"].map(item => (
                    <div key={item} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <CheckCircle size={13} color="#a78bfa" />
                      </div>
                      <span style={{ fontSize: 15, color: "var(--text-secondary)" }}>{item}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.15 }} style={{ flex: 1 }}>
                <MoodCalendar />
              </motion.div>
            </div>
          </div>
        </section>

        <section id="faq" style={{ padding: "100px 24px", background: "rgba(139,92,246,0.025)" }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: "center", marginBottom: 56 }}>
              <h2 style={{ fontSize: "clamp(26px,4vw,44px)", fontWeight: 800, letterSpacing: "-1px", marginBottom: 12, fontFamily: "var(--font-display)" }}>
                Întrebări <span className="gradient-text">frecvente</span>
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: 16 }}>Tot ce trebuie să știi înainte să începi.</p>
            </motion.div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {FAQS.map((faq, i) => <FaqItem key={faq.question} {...faq} delay={i * 0.07} />)}
            </div>
          </div>
        </section>


        <footer style={{ borderTop: "1px solid rgba(139,92,246,0.1)", padding: "44px 24px 28px", background: "rgba(3,2,8,0.55)" }}>
          <div style={{ maxWidth: 1080, margin: "0 auto" }}>

            <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", gap: 48, flexWrap: "wrap", marginBottom: 38 }}>
              <Link href="/" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 26, textDecoration: "none" }}>
                <img src="/logo.png" alt="SoulSide" width={90} height={90} style={{ borderRadius: 22, objectFit: "cover", filter: "drop-shadow(0 0 28px rgba(139,92,246,0.75))" }} />
                <span style={{ fontSize: 44, fontWeight: 900, color: "#f1f0f5", letterSpacing: "-1.5px", fontFamily: "var(--font-display)" }}>SoulSide</span>
              </Link>

              <div style={{ display: "flex", gap: 56, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 11, color: "rgba(241,240,245,0.4)", marginBottom: 16, textTransform: "uppercase", letterSpacing: "1px" }}>Produs</div>
                  {[{ label: "Funcționalități", href: "#features" }, { label: "Cum funcționează", href: "#how" }].map(({ label, href }) => (
                    <div key={label} style={{ marginBottom: 10 }}>
                      <a href={href} style={{ color: "var(--text-secondary)", fontSize: 14, textDecoration: "none", transition: "color 0.2s" }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#f1f0f5")} onMouseLeave={e => (e.currentTarget.style.color = "var(--text-secondary)")}>{label}</a>
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 11, color: "rgba(241,240,245,0.4)", marginBottom: 16, textTransform: "uppercase", letterSpacing: "1px" }}>Companie</div>
                  {[{ label: "Despre", href: "/about" }, { label: "Confidențialitate", href: "/confidentialitate" }, { label: "Termeni", href: "/termeni" }].map(({ label, href }) => (
                    <div key={label} style={{ marginBottom: 10 }}>
                      <Link href={href} style={{ color: "var(--text-secondary)", fontSize: 14, textDecoration: "none", transition: "color 0.2s" }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#f1f0f5")} onMouseLeave={e => (e.currentTarget.style.color = "var(--text-secondary)")}>{label}</Link>
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 11, color: "rgba(241,240,245,0.4)", marginBottom: 16, textTransform: "uppercase", letterSpacing: "1px" }}>Suport</div>
                  {[{ label: "FAQ", href: "#faq" }, { label: "Urgență", href: "/urgenta" }].map(({ label, href }) => (
                    <div key={label} style={{ marginBottom: 10 }}>
                      <a href={href} style={{ color: "var(--text-secondary)", fontSize: 14, textDecoration: "none", transition: "color 0.2s" }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#f1f0f5")} onMouseLeave={e => (e.currentTarget.style.color = "var(--text-secondary)")}>{label}</a>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="footer-bottom" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, paddingTop: 20, borderTop: "1px solid rgba(139,92,246,0.08)" }}>
              <p style={{ color: "rgba(241,240,245,0.3)", fontSize: 13 }}>© 2026 SoulSide. Toate drepturile rezervate.</p>
              <p style={{ color: "rgba(241,240,245,0.3)", fontSize: 13, display: "flex", alignItems: "center", gap: 5 }}>Construit cu <Heart size={12} color="#8b5cf6" fill="#8b5cf6" /> în România</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
