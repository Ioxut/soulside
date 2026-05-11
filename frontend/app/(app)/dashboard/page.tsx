"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, parseISO, startOfWeek } from "date-fns";
import { ro } from "date-fns/locale";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { getMoodColor, getMoodLabel } from "@/lib/utils";
import { MessageCircle, Lightbulb } from "lucide-react";
import type { MoodLog, ContentItem } from "@/types";

const TIPS = [
  "Când simți anxietate, respiră adânc de câteva ori. Ajută mai mult decât pare.",
  "Scrie câteva rânduri în fiecare zi. Îți ordonează capul.",
  "Dacă dormi la ore fixe, te vei simți mai bine fără să faci altceva diferit.",
  "Mișcarea chiar funcționează pe starea de spirit. Ceva e întotdeauna mai bun decât nimic.",
  "Seara, înainte să adormi, gândește-te la un lucru bun din ziua asta, oricât de mic.",
  "Oprește-te din când în când când lucrezi. O pauză scurtă îți redă concentrarea.",
  "Bea apă regulat. Mulți oameni sunt irascibili și obosiți pur și simplu pentru că nu beau suficient.",
  "Mai puțin timp pe telefon seara înseamnă somn mai bun dimineața.",
  "O plimbare afară, chiar scurtă, face mai mult pentru starea ta decât statul în casă.",
  "Când ești copleșit, sună pe cineva. Nu trebuie să dai explicații, ajunge să vorbești.",
  "Culcă-te și trezește-te cam la aceleași ore. Corpul tău o să îți mulțumească.",
  "Mănâncă cel puțin o masă pe zi fără telefon sau TV. E mai odihnitor decât pare.",
  "Când ești furios, nu răspunde imediat. Câteva secunde fac o diferență mare.",
  "Corpul îți dă semnale înainte să cedeze. Ascultă-le.",
  "Perfecționismul obosește. Uneori bun e suficient.",
  "Încearcă să nu te judeci când simți ceva negativ. Emoțiile trec mai repede când le lași să fie.",
  "Fă ceva nou din când în când, orice. Schimbarea rutinei te menține alert.",
  "Spune nu când nu vrei. E sănătos, nu egoist.",
  "Zâmbește chiar și când nu ai chef. Pare stupid, dar funcționează.",
  "Ascultă muzică care îți place când ești jos. E unul dintre cele mai rapide remedii.",
  "Dacă îngrijești ceva, o plantă sau un animal, te simți mai ancorat în prezent.",
  "Seara, notează un lucru pe care l-ai făcut bine azi. Chiar și ceva mic.",
  "Anxietatea despre viitor scade când te concentrezi pe ce poți face azi.",
  "Oamenii cu care alegi să fii contează mai mult pentru fericirea ta decât orice altceva.",
  "Uneori nu ești obosit fizic, ci emoțional. Somnul nu ajută la fel de mult în cazul ăsta.",
  "Fii mai blând cu tine însuți. Face parte din a fi rezilient.",
  "Ieși afară în fiecare zi, indiferent de vreme. Lumina naturală chiar contează pentru starea ta.",
  "Fă o listă cu lucrurile care te energizează și planifică una pe săptămână.",
  "Încearcă asta când ești agitat: inspiră 4 secunde, ține 7, expiră 8. Repetă de câteva ori.",
  "Când ești blocat, schimbă locul. Uneori chiar și o altă cameră ajută.",
  "Cititul îți liniștește mintea mai repede decât crezi. Încearcă câteva pagini seara.",
  "Ce vezi pe rețele sociale nu e viața reală a nimănui. Nu te compara cu ce e pus acolo.",
  "Mișcarea fizică regulată ajută serios la anxietate și la depresie ușoară. Nu e un mit.",
  "Fii curios față de emoțiile tale în loc să le eviți. De obicei au ceva de spus.",
  "Lasă telefonul afară din dormitor. Somnul și dimineața ta vor fi altfel.",
  "Oprește ecranele cu o oră înainte de culcare. Lasă capul să se liniștească.",
  "Mănâncă regulat. Sărind peste mese ajungi irascibil și anxios fără să înțelegi de ce.",
  "Ajutând pe cineva, fie și cu un lucru mic, te simți mai bine și tu.",
  "Respiră adânc din burtă dimineața, câteva minute. Începi ziua altfel.",
  "Nu trebuie să fii bine în fiecare zi. Tristețea și oboseala sunt și ele parte din viață.",
  "Scrie ce simți când ești copleșit. Scoțând gândurile din cap, devin mai ușor de dus.",
];

const getDailyTip = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000);
  return TIPS[dayOfYear % TIPS.length];
};

const QUICK = [
  { href: "/chat", label: "Chat cu AI", desc: "Vorbește cu SoulSide", color: "#8b5cf6" },
  { href: "/mood", label: "Jurnal", desc: "Înregistrează cum te simți", color: "#ec4899" },
  { href: "/specialists", label: "Contact specialist", desc: "Programare cu un medic", color: "#38bdf8" },
  { href: "/urgenta", label: "Resurse de urgență", desc: "Ajutor imediat disponibil", color: "#f87171" },
];


export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [moodLogs, setMoodLogs] = useState<MoodLog[]>([]);
  const [todayMood, setTodayMood] = useState<MoodLog | null>(null);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [allSessions, setAllSessions] = useState<any[]>([]);
  const [favCount, setFavCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [logsRes, todayRes, contentRes, sessRes, favRes] = await Promise.all([
          api.get("/mood?limit=14"),
          api.get("/mood/today"),
          api.get("/content?limit=4"),
          api.get("/chat/sessions"),
          api.get("/content/favorites/count"),
        ]);
        setMoodLogs([...logsRes.data].reverse());
        setTodayMood(todayRes.data);
        setContent(contentRes.data);
        const allSess = sessRes.data ?? [];
        setAllSessions(allSess);
        setSessions(allSess.slice(0, 3));
        setFavCount(favRes.data?.count ?? 0);
      } catch {
        toast.error("Nu s-au putut încărca datele");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const streak = (() => {
    let count = 0;
    const sorted = [...moodLogs].sort((a, b) => b.logged_date.localeCompare(a.logged_date));
    for (let i = 0; i < sorted.length; i++) {
      const expected = format(new Date(Date.now() - i * 86400000), "yyyy-MM-dd");
      if (sorted[i]?.logged_date === expected) count++;
      else break;
    }
    return count;
  })();

  const recentLogs = moodLogs.slice(-7);
  const avgScore = recentLogs.length
    ? Math.round((recentLogs.reduce((a, b) => a + b.score, 0) / recentLogs.length) * 10) / 10
    : null;

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const sessionsThisWeek = allSessions.filter((s: any) => {
    try { return new Date(s.started_at) >= weekStart; } catch { return false; }
  }).length;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bună dimineața" : hour < 18 ? "Bună ziua" : "Bună seara";
  const tip = getDailyTip();

  const avgColor = avgScore
    ? avgScore >= 7 ? "#22c55e" : avgScore >= 5 ? "#eab308" : "#f87171"
    : "var(--accent)";

  const STATS = [
    {
      label: "Conversații",
      value: allSessions.length ? `${allSessions.length}` : "—",
      delta: sessionsThisWeek > 0 ? `+${sessionsThisWeek} săptămâna asta` : "Nicio conversație în această săptămână",
      color: "#8b5cf6", bg: "rgba(139,92,246,0.12)",
      href: "/chat-history",
    },
    {
      label: "Streak jurnal",
      value: streak ? `${streak}` : "—",
      delta: streak > 1 ? "zile consecutive" : streak === 1 ? "zi consecutivă" : "Începe azi",
      color: "#f59e0b", bg: "rgba(245,158,11,0.12)",
      href: "/mood",
    },
    {
      label: "Stare medie 7 zile",
      value: avgScore ? `${avgScore}` : "—",
      delta: avgScore ? `din 10 · ${getMoodLabel(Math.round(avgScore))}` : "Fără date încă",
      color: avgColor, bg: `${avgColor}20`,
      href: "/mood",
    },
    {
      label: "Resurse salvate",
      value: favCount > 0 ? `${favCount}` : "—",
      delta: favCount > 0 ? `${favCount === 1 ? "resursă adăugată" : "resurse adăugate"} la favorite` : "Niciuna salvată încă",
      color: "#f472b6", bg: "rgba(244,114,182,0.12)",
      href: "/resources",
    },
  ];

  if (loading) {
    return (
      <div style={{ padding: "clamp(20px,4vw,40px)", width: "100%" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "14px", marginBottom: "24px" }}>
          {[1, 2, 3, 4].map(i => <div key={i} className="glass-card" style={{ height: "108px", animation: "pulse 1.5s ease-in-out infinite" }} />)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          {[1, 2].map(i => <div key={i} className="glass-card" style={{ height: "260px", animation: "pulse 1.5s ease-in-out infinite" }} />)}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "clamp(20px,4vw,40px)", width: "100%", overflowX: "hidden", boxSizing: "border-box" }}>

      <div className="anim-fade-up" style={{
        marginBottom: "28px", display: "flex",
        alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px"
      }}>
        <div>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "4px" }}>{greeting},</p>
          <h1 style={{
            fontFamily: "var(--font-display)", fontWeight: 900,
            fontSize: "clamp(20px,4vw,30px)", color: "var(--text-primary)",
            letterSpacing: "-0.025em", marginBottom: "4px"
          }}>
            {user?.name}
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", textTransform: "capitalize" }}>
            {format(new Date(), "EEEE, d MMMM yyyy", { locale: ro })}
          </p>
        </div>
        <button onClick={() => router.push("/chat")} className="btn-primary"
          style={{ height: "40px", padding: "0 18px", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
          <MessageCircle size={16} /> Chat nou
        </button>
      </div>

      <div className="glass-card anim-fade-up delay-1" style={{
        display: "flex", alignItems: "flex-start",
        gap: "14px", padding: "16px 20px", marginBottom: "28px",
        borderLeft: "3px solid var(--accent)", background: "var(--accent-subtle)"
      }}>
        <div style={{
          width: "34px", height: "34px", borderRadius: "var(--r-md)", flexShrink: 0,
          background: "linear-gradient(135deg,var(--accent),var(--accent-deep))",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 12px var(--accent-glow)"
        }}>
          <Lightbulb size={15} color="white" strokeWidth={1.8} />
        </div>
        <div>
          <div style={{
            fontSize: "10px", fontWeight: 700, fontFamily: "var(--font-display)",
            color: "var(--accent-light)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "4px"
          }}>
            Sfatul zilei
          </div>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.55 }}>{tip}</p>
        </div>
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(170px,100%),1fr))",
        gap: "14px", marginBottom: "28px"
      }}>
        {STATS.map(({ label, value, delta, color, bg, href }, i) => (
          <div key={label}
            className={`glass-card glass-interactive anim-fade-up delay-${i + 1}`}
            style={{ padding: "20px", cursor: "pointer" }}
            onClick={() => router.push(href)}>
            <div style={{
              fontSize: "11px", fontWeight: 700, fontFamily: "var(--font-display)",
              color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase",
              marginBottom: "12px"
            }}>
              {label}
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", marginBottom: "5px" }}>
              <span style={{
                fontFamily: "var(--font-display)", fontWeight: 900,
                fontSize: "clamp(26px,4vw,32px)", color, lineHeight: 1
              }}>
                {value}
              </span>
              {value !== "—" && (
                <div style={{
                  width: "8px", height: "8px", borderRadius: "50%",
                  background: color, boxShadow: `0 0 8px ${color}`, marginBottom: "6px"
                }} />
              )}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.4 }}>{delta}</div>
          </div>
        ))}
      </div>

      <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "28px", minWidth: 0 }}>

        <div className="anim-fade-up delay-3" style={{ minWidth: 0, overflow: "hidden" }}>
          <h2 className="section-title">Acces rapid</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {QUICK.map(({ href, label, desc }) => {
              return (
                <Link key={href} href={href} style={{ textDecoration: "none", display: "block" }}>
                  <div className="glass-card glass-interactive"
                    style={{ display: "flex", alignItems: "center", gap: "12px", padding: "13px 16px" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: "16px", fontWeight: 700, fontFamily: "var(--font-display)",
                        color: "var(--text-primary)"
                      }}>
                        {label} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>- {desc}</span>
                      </div>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none"
                      stroke="var(--text-muted)" strokeWidth="1.6" strokeLinecap="round">
                      <path d="M7 5l5 5-5 5" />
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="anim-fade-up delay-4" style={{ minWidth: 0, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <h2 className="section-title" style={{ marginBottom: 0 }}>Conversații recente</h2>
            <Link href="/chat-history" style={{
              fontSize: "13px", color: "var(--accent-light)",
              textDecoration: "none", fontWeight: 700, fontFamily: "var(--font-display)"
            }}>
              Toate →
            </Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {sessions.length > 0 ? sessions.map((s: any) => (
              <Link key={s.id} href={`/chat?session=${s.id}`} style={{ textDecoration: "none", display: "block" }}>
                <div className="glass-card glass-interactive"
                  style={{ padding: "13px 16px", display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    width: "32px", height: "32px", flexShrink: 0,
                    borderRadius: "var(--r-md)", background: "var(--accent-subtle)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "var(--accent-light)"
                  }}>
                    <MessageCircle size={16} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: "13px", fontWeight: 700, fontFamily: "var(--font-display)",
                      color: "var(--text-primary)", marginBottom: "2px",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                    }}>
                      {s.title || "Conversație"}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      {s.updated_at ? format(parseISO(s.updated_at), "d MMM, HH:mm", { locale: ro }) : ""}
                    </div>
                  </div>
                </div>
              </Link>
            )) : (
              <div className="glass-card" style={{
                padding: "20px", textAlign: "center",
                color: "var(--text-muted)", fontSize: "13px"
              }}>
                Nicio conversație încă
              </div>
            )}
            <Link href="/chat" style={{ textDecoration: "none", display: "block" }}>
              <div style={{
                padding: "12px 16px", border: "1.5px dashed var(--border-glow)",
                borderRadius: "var(--r-lg)", display: "flex", alignItems: "center",
                justifyContent: "center", gap: "8px", color: "var(--accent-light)",
                fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "13px",
                cursor: "pointer", transition: "all var(--t-fast)"
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--glass-active)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                + Conversație nouă
              </div>
            </Link>
          </div>
        </div>
      </div>

      {content.length > 0 && (
        <div className="anim-fade-up delay-5">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <h2 className="section-title" style={{ marginBottom: 0 }}>Resurse recomandate</h2>
            <Link href="/resources" style={{
              fontSize: "13px", color: "var(--accent-light)",
              textDecoration: "none", fontWeight: 700, fontFamily: "var(--font-display)"
            }}>
              Toate →
            </Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "12px" }}>
            {content.map((c: ContentItem) => (
              <Link key={c.id} href={`/resources?open=${c.id}`} style={{ textDecoration: "none", display: "block" }}>
                <div className="glass-card glass-interactive" style={{ padding: "16px" }}>
                  <span style={{
                    fontSize: "10px", color: "var(--accent-light)", fontWeight: 700,
                    fontFamily: "var(--font-display)", textTransform: "uppercase", letterSpacing: "0.06em"
                  }}>
                    {c.type}
                  </span>
                  <h4 style={{
                    fontSize: "13px", fontWeight: 700, fontFamily: "var(--font-display)",
                    color: "var(--text-primary)", marginTop: "6px", marginBottom: "6px", lineHeight: 1.4,
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden"
                  }}>
                    {c.title}
                  </h4>
                  {(c.read_time || c.author) && (
                    <p style={{
                      fontSize: "11px", color: "var(--text-muted)",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                    }}>
                      {[c.read_time, c.author].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
