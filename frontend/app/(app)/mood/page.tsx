"use client";

import { useEffect, useState, useCallback } from "react";
import { format, subDays } from "date-fns";
import { ro } from "date-fns/locale";
import toast from "react-hot-toast";
import { Frown, Meh, Smile, SmilePlus } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  Tooltip, CartesianGrid, ReferenceLine,
} from "recharts";
import api from "@/lib/api";
import { getMoodLabel, MOOD_EMOJIS } from "@/lib/utils";
import type { MoodLog } from "@/types";

type MoodIcon = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

const MOOD_CFG: Record<number,{label:string;color:string;bg:string;icon:MoodIcon}> = {
  1:  { label:"Îngrozitor",    color:"#ef4444", bg:"rgba(239,68,68,0.15)",   icon:Frown },
  2:  { label:"Foarte rău",    color:"#f97316", bg:"rgba(249,115,22,0.15)",  icon:Frown },
  3:  { label:"Rău",           color:"#f59e0b", bg:"rgba(245,158,11,0.15)",  icon:Frown },
  4:  { label:"Puțin rău",     color:"#eab308", bg:"rgba(234,179,8,0.15)",   icon:Frown },
  5:  { label:"Neutru",        color:"#94a3b8", bg:"rgba(148,163,184,0.15)", icon:Meh },
  6:  { label:"Bine",          color:"#84cc16", bg:"rgba(132,204,22,0.15)",  icon:Smile },
  7:  { label:"Destul de bine",color:"#22c55e", bg:"rgba(34,197,94,0.15)",   icon:Smile },
  8:  { label:"Bine!",         color:"#10b981", bg:"rgba(16,185,129,0.15)",  icon:SmilePlus },
  9:  { label:"Foarte bine!",  color:"#06b6d4", bg:"rgba(6,182,212,0.15)",   icon:SmilePlus },
  10: { label:"Excelent!",     color:"#8b5cf6", bg:"rgba(139,92,246,0.20)",  icon:SmilePlus },
};

const DAYS_RO   = ["Lu","Ma","Mi","Jo","Vi","Sâ","Du"];
const DAYS_FULL = ["Duminică","Luni","Marți","Miercuri","Joi","Vineri","Sâmbătă"];
const MONTHS_RO = ["Ianuarie","Februarie","Martie","Aprilie","Mai","Iunie","Iulie","August","Septembrie","Octombrie","Noiembrie","Decembrie"];

// Parse YYYY-MM-DD as local midnight — avoids UTC-midnight timezone shift
const parseLocalDate = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

type CalEntry = { score: number; notes: string | null };

/* ── Stats computation ── */
function computeStats(logs: MoodLog[]) {
  if (!logs.length) return null;
  const now = new Date();
  const tm = now.getMonth(), ty = now.getFullYear();
  const lm = tm === 0 ? 11 : tm - 1, ly = tm === 0 ? ty - 1 : ty;

  const thisML = logs.filter(l => { const d = parseLocalDate(l.logged_date); return d.getMonth()===tm && d.getFullYear()===ty; });
  const lastML = logs.filter(l => { const d = parseLocalDate(l.logged_date); return d.getMonth()===lm && d.getFullYear()===ly; });
  const avg = (a: MoodLog[]) => a.length ? a.reduce((s,l) => s+l.score,0)/a.length : null;
  const thisAvg = avg(thisML), lastAvg = avg(lastML);
  const trend = thisAvg !== null && lastAvg !== null ? thisAvg - lastAvg : null;

  const byDay: Record<number, number[]> = {};
  for (const l of logs) {
    const dow = parseLocalDate(l.logged_date).getDay();
    if (!byDay[dow]) byDay[dow] = [];
    byDay[dow].push(l.score);
  }
  const dayAvgs = Object.entries(byDay).map(([dow, sc]) => ({ dow:+dow, avg: sc.reduce((s,n)=>s+n,0)/sc.length, label:DAYS_FULL[+dow] }));
  const bestDay  = dayAvgs.length ? dayAvgs.reduce((a,b) => a.avg>b.avg?a:b) : null;
  const worstDay = dayAvgs.length ? dayAvgs.reduce((a,b) => a.avg<b.avg?a:b) : null;

  return { thisAvg, total: logs.length, trend, bestDay: bestDay?.label ?? null, worstDay: worstDay?.label ?? null };
}

/* ── Calendar ── */
function MonthCalendar({ year, month, data, selectedDay, onDayClick }: {
  year:number; month:number; data:Record<string,CalEntry>;
  selectedDay:string|null; onDayClick:(d:string,e:CalEntry|null)=>void;
}) {
  const first = new Date(year, month, 1);
  const last  = new Date(year, month+1, 0);
  const startDow = (first.getDay()+6)%7;
  const cells: (number|null)[] = [...Array(startDow).fill(null), ...Array.from({length:last.getDate()},(_,i)=>i+1)];
  while (cells.length%7!==0) cells.push(null);
  const today = new Date().toISOString().split("T")[0];
  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"3px", marginBottom:"6px" }}>
        {DAYS_RO.map(d => <div key={d} style={{ textAlign:"center", fontSize:"11px", fontWeight:700, fontFamily:"var(--font-display)", color:"var(--text-muted)", padding:"4px 0" }}>{d}</div>)}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"3px" }}>
        {cells.map((day,i) => {
          if (!day) return <div key={`e${i}`} style={{ aspectRatio:"1" }}/>;
          const ds = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
          const entry = data[ds]??null;
          const mc = entry ? MOOD_CFG[entry.score] : null;
          const isToday = ds===today, isSel = ds===selectedDay;
          return (
            <button key={ds} onClick={()=>onDayClick(ds,entry)}
              title={entry?`${day}: ${MOOD_CFG[entry.score].label} (${entry.score}/10)`:`${day}: neînregistrat`}
              style={{ aspectRatio:"1", borderRadius:"var(--r-sm)", border:isSel?"2px solid var(--accent)":isToday?"1.5px solid rgba(139,92,246,0.35)":"1px solid transparent", background:mc?mc.bg:"var(--glass-1)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:"1px", transition:"transform var(--t-fast)", position:"relative" }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform="scale(1.12)";(e.currentTarget as HTMLElement).style.zIndex="5";}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform="scale(1)";(e.currentTarget as HTMLElement).style.zIndex="1";}}>
              <span style={{ fontSize:"11px", fontWeight:700, fontFamily:"var(--font-display)", color:mc?mc.color:"var(--text-muted)", lineHeight:1 }}>{day}</span>
              {mc && <span style={{ fontSize:"8px", fontWeight:700, color:mc.color, lineHeight:1 }}>{entry!.score}</span>}
              {isToday && !entry && <div style={{ width:"4px", height:"4px", borderRadius:"50%", background:"var(--accent)", position:"absolute", bottom:"3px" }}/>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Custom Tooltip for chart ── */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const score = payload[0].value as number;
  const mc = MOOD_CFG[Math.round(score)];
  return (
    <div style={{ background:"var(--glass-sidebar)", border:"1px solid var(--border-strong)", borderRadius:"var(--r-md)", padding:"8px 12px", backdropFilter:"blur(16px)" }}>
      <div style={{ fontSize:"11px", color:"var(--text-muted)", marginBottom:"4px" }}>{label}</div>
      <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
        {mc && <mc.icon size={16} color={mc.color} strokeWidth={2} />}
        <span style={{ fontSize:"13px", fontWeight:700, color:mc?.color }}>{score}/10 · {mc?.label}</span>
      </div>
    </div>
  );
}

export default function MoodPage() {
  const [logs, setLogs] = useState<MoodLog[]>([]);
  const [todayLog, setTodayLog] = useState<MoodLog|null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [score, setScore] = useState(7);
  const [notes, setNotes] = useState("");
  const [editingId, setEditingId] = useState<number|null>(null);
  const [calData, setCalData] = useState<Record<string,CalEntry>>({});
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<string|null>(null);
  const [selectedEntry, setSelectedEntry] = useState<CalEntry|null>(null);
  const [chartRange, setChartRange] = useState<7|14|30>(30);
  const [insight, setInsight] = useState<string|null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [showInsight, setShowInsight] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [allRes, todayRes] = await Promise.all([
        api.get("/mood?limit=365"),
        api.get("/mood/today"),
      ]);
      setLogs(allRes.data);
      setTodayLog(todayRes.data);
      const map: Record<string,CalEntry> = {};
      for (const l of allRes.data) map[l.logged_date] = { score:l.score, notes:l.notes??null };
      setCalData(map);
    } catch { toast.error("Nu s-au putut încărca datele"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { score, emoji: MOOD_EMOJIS[score-1], notes, logged_date: format(new Date(),"yyyy-MM-dd") };
      let data: MoodLog;
      if (editingId) {
        data = (await api.put(`/mood/${editingId}`, payload)).data;
      } else {
        data = (await api.post("/mood", payload)).data;
      }
      setTodayLog(data);
      setLogs(prev => [data, ...prev.filter(l=>l.id!==data.id)]);
      setCalData(prev => ({ ...prev, [data.logged_date]:{ score:data.score, notes:data.notes??null } }));
      setEditingId(null);
      toast.success(editingId?"Înregistrare actualizată!":"Starea înregistrată!");
    } catch (err:any) { toast.error(err.response?.data?.detail||"Eroare la salvare"); }
    finally { setSubmitting(false); }
  };

  const startEdit = () => {
    if (!todayLog) return;
    setEditingId(todayLog.id);
    setScore(todayLog.score);
    setNotes(todayLog.notes||"");
    setTodayLog(null);
  };

  const cancelEdit = () => { setEditingId(null); setScore(7); setNotes(""); load(); };

  const fetchInsight = async () => {
    if (insight) { setShowInsight(v=>!v); return; }
    setLoadingInsight(true);
    setShowInsight(true);
    try {
      const { data } = await api.get("/mood/insight");
      setInsight(data.insight);
    } catch { toast.error("Nu s-a putut genera insight-ul"); setShowInsight(false); }
    finally { setLoadingInsight(false); }
  };

  const mc = MOOD_CFG[score];
  const prevMonth = () => { if (calMonth===0){setCalYear(y=>y-1);setCalMonth(11);}else setCalMonth(m=>m-1); };
  const nextMonth = () => { if (calMonth===11){setCalYear(y=>y+1);setCalMonth(0);}else setCalMonth(m=>m+1); };

  /* ── Chart data ── */
  const chartData = (() => {
    const cutoff = subDays(new Date(), chartRange-1);
    const cutoffStr = format(cutoff,"yyyy-MM-dd");
    const filtered = [...logs].filter(l => l.logged_date >= cutoffStr).sort((a,b)=>a.logged_date.localeCompare(b.logged_date));
    return filtered.map(l => ({
      date: format(parseLocalDate(l.logged_date),"d MMM",{locale:ro}),
      score: l.score,
    }));
  })();

  /* ── Stats ── */
  const stats = computeStats(logs);

  if (loading) return (
    <div style={{ padding:"clamp(16px,4vw,36px)", width:"100%", boxSizing:"border-box" }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:"24px" }}>
        {[1,2].map(i => <div key={i} className="glass-card" style={{ height:"400px", borderRadius:"var(--r-xl)", animation:"pulse 1.5s ease-in-out infinite" }}/>)}
      </div>
    </div>
  );

  return (
    <div style={{ padding:"clamp(16px,4vw,36px)", width:"100%", boxSizing:"border-box" }}>

      {/* Header */}
      <div className="anim-fade-up" style={{ marginBottom:"20px" }}>
        <h1 style={{ fontFamily:"var(--font-display)", fontWeight:900, fontSize:"clamp(20px,4vw,28px)", color:"var(--text-primary)", letterSpacing:"-0.025em", marginBottom:"6px" }}>Jurnal de dispoziție</h1>
        <p style={{ fontSize:"14px", color:"var(--text-muted)" }}>Înregistrează cum te simți astăzi și urmărește evoluția pe calendar.</p>
      </div>

      {/* ── Stats chips row ── */}
      {stats && (
        <div className="anim-fade-up" style={{ display:"flex", flexWrap:"wrap", gap:"10px", marginBottom:"24px" }}>
          {/* Media lunii */}
          <div className="glass-card" style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"12px 18px", gap:"2px", minWidth:"110px", flex:"1 1 110px" }}>
            <span style={{ fontSize:"22px", fontWeight:900, fontFamily:"var(--font-display)", color:stats.thisAvg ? MOOD_CFG[Math.round(stats.thisAvg)].color : "var(--text-muted)" }}>
              {stats.thisAvg !== null ? stats.thisAvg.toFixed(1) : "—"}
            </span>
            <span style={{ fontSize:"10px", fontWeight:700, fontFamily:"var(--font-display)", color:"var(--text-muted)", letterSpacing:"0.06em", textTransform:"uppercase", textAlign:"center" }}>Media lunii</span>
          </div>

          {/* Total înregistrări */}
          <div className="glass-card" style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"12px 18px", gap:"2px", minWidth:"110px", flex:"1 1 110px" }}>
            <span style={{ fontSize:"22px", fontWeight:900, fontFamily:"var(--font-display)", color:"var(--accent-light)" }}>{stats.total}</span>
            <span style={{ fontSize:"10px", fontWeight:700, fontFamily:"var(--font-display)", color:"var(--text-muted)", letterSpacing:"0.06em", textTransform:"uppercase", textAlign:"center" }}>Total zile</span>
          </div>

          {/* Cea mai bună zi */}
          <div className="glass-card" style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"12px 18px", gap:"2px", minWidth:"110px", flex:"1 1 110px" }}>
            <span style={{ fontSize:"22px", fontWeight:900, fontFamily:"var(--font-display)", color:"#22c55e" }}>{stats.bestDay ?? "—"}</span>
            <span style={{ fontSize:"10px", fontWeight:700, fontFamily:"var(--font-display)", color:"var(--text-muted)", letterSpacing:"0.06em", textTransform:"uppercase", textAlign:"center" }}>Cea mai bună zi</span>
          </div>

          {/* Cea mai proastă zi */}
          <div className="glass-card" style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"12px 18px", gap:"2px", minWidth:"110px", flex:"1 1 110px" }}>
            <span style={{ fontSize:"22px", fontWeight:900, fontFamily:"var(--font-display)", color:"#f97316" }}>{stats.worstDay ?? "—"}</span>
            <span style={{ fontSize:"10px", fontWeight:700, fontFamily:"var(--font-display)", color:"var(--text-muted)", letterSpacing:"0.06em", textTransform:"uppercase", textAlign:"center" }}>Cea mai grea zi</span>
          </div>

          {/* Tendință față de luna trecută */}
          <div className="glass-card" style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"12px 18px", gap:"2px", minWidth:"130px", flex:"1 1 130px" }}>
            <span style={{ fontSize:"22px", fontWeight:900, fontFamily:"var(--font-display)", color: stats.trend === null ? "var(--text-muted)" : stats.trend >= 0 ? "#22c55e" : "#ef4444" }}>
              {stats.trend === null ? "—" : `${stats.trend >= 0 ? "+" : ""}${stats.trend.toFixed(1)}`}
            </span>
            <span style={{ fontSize:"10px", fontWeight:700, fontFamily:"var(--font-display)", color:"var(--text-muted)", letterSpacing:"0.06em", textTransform:"uppercase", textAlign:"center" }}>vs luna trecută</span>
          </div>
        </div>
      )}

      {/* ── 2-column grid ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:"24px", alignItems:"start" }}>

        {/* LEFT: Logger */}
        <div className="glass-card anim-fade-up" style={{ padding:"clamp(16px,4vw,28px)" }}>
          <div style={{ fontSize:"12px", color:"var(--text-muted)", fontFamily:"var(--font-display)", fontWeight:600, marginBottom:"20px" }}>
            {now.toLocaleDateString("ro-RO",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
          </div>

          {todayLog ? (
            <div>
              <p style={{ fontSize:"11px", fontWeight:700, fontFamily:"var(--font-display)", color:"var(--text-muted)", letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:"16px" }}>Starea de azi</p>
              <div style={{ display:"flex", alignItems:"center", gap:"16px", marginBottom:"16px" }}>
                <div style={{ width:"64px", height:"64px", borderRadius:"var(--r-xl)", flexShrink:0, background:MOOD_CFG[todayLog.score]?.bg??"var(--glass-1)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {(() => { const cfg = MOOD_CFG[todayLog.score]; return cfg ? <cfg.icon size={28} color={cfg.color} strokeWidth={2} /> : null; })()}
                </div>
                <div>
                  <p style={{ fontSize:"20px", fontWeight:800, fontFamily:"var(--font-display)", color:"var(--text-primary)", lineHeight:1.2 }}>
                    {todayLog.score}/10 · {getMoodLabel(todayLog.score)}
                  </p>
                  {todayLog.notes && <p style={{ fontSize:"12px", color:"var(--text-muted)", marginTop:"4px", fontStyle:"italic", lineHeight:1.6, wordBreak:"break-word", overflowWrap:"break-word" }}>"{todayLog.notes}"</p>}
                  <p style={{ fontSize:"11px", color:"var(--text-muted)", marginTop:"4px" }}>
                    {format(parseLocalDate(todayLog.logged_date),"d MMMM yyyy",{locale:ro})}
                  </p>
                </div>
              </div>
              <button onClick={startEdit} className="btn-glass" style={{ width:"100%", fontSize:"13px", marginBottom:"10px" }}>
                Editează înregistrarea de azi
              </button>

              {/* AI Insight button */}
              <button onClick={fetchInsight} disabled={loadingInsight} className="btn-glass" style={{ width:"100%", fontSize:"13px", borderColor:"rgba(139,92,246,0.3)", color:showInsight?"var(--accent-light)":"var(--text-muted)" }}>
                {loadingInsight
                  ? <><span className="spinner spinner-sm" />Se generează...</>
                  : showInsight ? "Ascunde insight-ul AI" : "Insight AI: cum e dispoziția mea?"}
              </button>
              {showInsight && insight && (
                <div className="anim-fade-up" style={{ marginTop:"12px", padding:"14px", background:"rgba(139,92,246,0.08)", border:"1px solid rgba(139,92,246,0.2)", borderRadius:"var(--r-lg)" }}>
                  <p style={{ fontSize:"13px", color:"var(--text-secondary)", lineHeight:1.7, margin:0 }}>{insight}</p>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {editingId && (
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"16px", padding:"8px 12px", background:"rgba(139,92,246,0.1)", borderRadius:"var(--r-md)", border:"1px solid rgba(139,92,246,0.2)" }}>
                  <span style={{ fontSize:"12px", color:"var(--accent-light)", fontWeight:600 }}>Editezi înregistrarea de azi</span>
                  <button type="button" onClick={cancelEdit} style={{ fontSize:"11px", color:"var(--text-muted)", background:"none", border:"none", cursor:"pointer", padding:0 }}>Anulează</button>
                </div>
              )}
              <div style={{ textAlign:"center", marginBottom:"24px" }}>
                <div style={{ width:"72px", height:"72px", borderRadius:"50%", background:`${mc.color}22`, border:`2px solid ${mc.color}55`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 10px", transition:"all .25s" }}>
                  <mc.icon size={38} color={mc.color} strokeWidth={1.5} />
                </div>
                <div style={{ fontFamily:"var(--font-display)", fontWeight:900, fontSize:"clamp(48px,8vw,68px)", color:mc.color, lineHeight:1, marginBottom:"5px", transition:"color .25s" }}>{score}</div>
                <div style={{ fontSize:"16px", fontWeight:700, fontFamily:"var(--font-display)", color:mc.color, transition:"color .25s" }}>{mc.label}</div>
              </div>
              <div style={{ marginBottom:"20px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"8px" }}>
                  <span style={{ fontSize:"11px", color:"var(--text-muted)", fontFamily:"var(--font-display)", fontWeight:600 }}>1: Îngrozitor</span>
                  <span style={{ fontSize:"11px", color:"var(--text-muted)", fontFamily:"var(--font-display)", fontWeight:600 }}>10: Excelent</span>
                </div>
                <input type="range" min={1} max={10} value={score} onChange={e=>setScore(Number(e.target.value))}
                  style={{ width:"100%", height:"6px", appearance:"none", background:`linear-gradient(to right, ${mc.color} ${(score-1)/9*100}%, rgba(139,92,246,0.15) ${(score-1)/9*100}%)`, borderRadius:"var(--r-full)", outline:"none", cursor:"pointer", transition:"background .2s" }}/>
                <div style={{ display:"flex", justifyContent:"space-between", marginTop:"8px", gap:"3px" }}>
                  {Array.from({length:10},(_,i)=>i+1).map(n=>(
                    <button key={n} type="button" onClick={()=>setScore(n)}
                      style={{ flex:1, height:"26px", borderRadius:"var(--r-sm)", border:`1px solid ${score===n?mc.color:"var(--border)"}`, background:score===n?mc.bg:"transparent", color:score===n?mc.color:"var(--text-muted)", fontSize:"11px", fontWeight:700, cursor:"pointer", fontFamily:"var(--font-display)", transition:"all var(--t-fast)" }}>{n}</button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom:"18px" }}>
                <label htmlFor="journal" className="field-label">Cum a fost ziua? <span style={{ color:"var(--text-muted)", textTransform:"none", letterSpacing:0, fontWeight:400 }}>(opțional)</span></label>
                <textarea id="journal" value={notes} onChange={e=>setNotes(e.target.value)}
                  placeholder="Descrie cum te-ai simțit, ce s-a întâmplat..." rows={4} maxLength={1000}
                  className="glass-input" style={{ height:"auto", padding:"14px 16px", resize:"vertical", lineHeight:1.65, minHeight:"110px", boxSizing:"border-box", width:"100%" }}/>
                <div style={{ textAlign:"right", fontSize:"11px", color:"var(--text-muted)", marginTop:"3px" }}>{notes.length}/1000</div>
              </div>
              <button type="submit" disabled={submitting} className="btn-primary" style={{ width:"100%" }}>
                {submitting
                  ? <><span className="spinner spinner-sm" />Se salvează...</>
                  : editingId ? "Actualizează înregistrarea" : "Salvează înregistrarea"}
              </button>
            </form>
          )}
        </div>

        {/* RIGHT: Calendar */}
        <div className="glass-card anim-fade-up delay-2" style={{ padding:"clamp(16px,4vw,28px)" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"20px" }}>
            <h2 className="section-title" style={{ marginBottom:0 }}>Evoluție lunară</h2>
            <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
              <button onClick={prevMonth} className="btn-glass" style={{ height:"30px", width:"30px", padding:0, fontSize:"18px" }}>‹</button>
              <span style={{ fontSize:"13px", fontWeight:700, fontFamily:"var(--font-display)", color:"var(--text-primary)", minWidth:"120px", textAlign:"center" }}>{MONTHS_RO[calMonth]} {calYear}</span>
              <button onClick={nextMonth} className="btn-glass" style={{ height:"30px", width:"30px", padding:0, fontSize:"18px" }}>›</button>
            </div>
          </div>

          <MonthCalendar year={calYear} month={calMonth} data={calData} selectedDay={selectedDay}
            onDayClick={(d,e)=>{setSelectedDay(d);setSelectedEntry(e);}}/>

          {selectedDay && (
            <div className="anim-scale-in" style={{ marginTop:"16px", padding:"14px", background:selectedEntry?MOOD_CFG[selectedEntry.score].bg:"var(--glass-1)", border:`1px solid ${selectedEntry?MOOD_CFG[selectedEntry.score].color+"44":"var(--border)"}`, borderRadius:"var(--r-lg)" }}>
              <div style={{ fontSize:"13px", fontWeight:700, fontFamily:"var(--font-display)", color:"var(--text-primary)", marginBottom:"8px" }}>
                {parseLocalDate(selectedDay).toLocaleDateString("ro-RO",{weekday:"long",day:"numeric",month:"long"})}
              </div>
              {selectedEntry ? (
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:selectedEntry.notes?"10px":0 }}>
                    {(() => { const cfg = MOOD_CFG[selectedEntry.score]; return <cfg.icon size={26} color={cfg.color} strokeWidth={2} />; })()}
                    <div style={{ fontSize:"15px", fontWeight:700, color:MOOD_CFG[selectedEntry.score].color }}>
                      {selectedEntry.score}/10 · {MOOD_CFG[selectedEntry.score].label}
                    </div>
                  </div>
                  {selectedEntry.notes && (
                    <p style={{ fontSize:"12px", color:"var(--text-muted)", fontStyle:"italic", lineHeight:1.6, margin:0, paddingLeft:"36px", wordBreak:"break-word", overflowWrap:"break-word" }}>"{selectedEntry.notes}"</p>
                  )}
                </div>
              ) : (
                <div style={{ fontSize:"13px", color:"var(--text-muted)" }}>Nicio înregistrare pentru această zi.</div>
              )}
            </div>
          )}

          {/* Legend 1-10 */}
          <div style={{ marginTop:"16px", paddingTop:"14px", borderTop:"1px solid var(--border)" }}>
            <div style={{ fontSize:"11px", fontWeight:700, fontFamily:"var(--font-display)", color:"var(--text-muted)", letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:"8px" }}>Legendă</div>
            <div style={{ display:"flex", gap:"4px", flexWrap:"wrap" }}>
              {[1,2,3,4,5,6,7,8,9,10].map(n=>(
                <div key={n} style={{ display:"flex", alignItems:"center", gap:"3px" }}>
                  <div style={{ width:"13px", height:"13px", borderRadius:"3px", background:MOOD_CFG[n].bg, border:`1px solid ${MOOD_CFG[n].color}44` }}/>
                  <span style={{ fontSize:"10px", color:"var(--text-muted)", fontFamily:"var(--font-display)", fontWeight:600 }}>{n}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Trend chart ── */}
      <div className="glass-card anim-fade-up delay-3" style={{ marginTop:"24px", padding:"clamp(16px,4vw,28px)" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"20px", flexWrap:"wrap", gap:"12px" }}>
          <h2 className="section-title" style={{ marginBottom:0 }}>Trend dispoziție</h2>
          <div style={{ display:"flex", gap:"6px" }}>
            {([7,14,30] as const).map(r => (
              <button key={r} onClick={()=>setChartRange(r)} className={chartRange===r?"btn-primary":"btn-glass"}
                style={{ height:"28px", padding:"0 12px", fontSize:"12px", fontWeight:700 }}>
                {r}z
              </button>
            ))}
          </div>
        </div>

        {chartData.length < 2 ? (
          <div style={{ height:"200px", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text-muted)", fontSize:"14px" }}>
            Nu sunt suficiente date pentru a afișa trendul. Înregistrează cel puțin 2 zile.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top:5, right:8, left:-20, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fontSize:11, fill:"var(--text-muted)", fontFamily:"var(--font-display)" }} axisLine={false} tickLine={false} />
              <YAxis domain={[1,10]} ticks={[1,2,3,4,5,6,7,8,9,10]} tick={{ fontSize:11, fill:"var(--text-muted)", fontFamily:"var(--font-display)" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <ReferenceLine y={5} stroke="rgba(148,163,184,0.2)" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="score" stroke="var(--accent)" strokeWidth={2.5} dot={{ fill:"var(--accent)", strokeWidth:0, r:4 }} activeDot={{ r:6, fill:"var(--accent-light)" }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

    </div>
  );
}
