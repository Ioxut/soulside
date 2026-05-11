"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { Doctor, SpecialistRequest } from "@/types";

const STATUS_CFG: Record<string,{label:string;color:string;bg:string;border:string}> = {
  pending:  { label:"În așteptare", color:"var(--text-muted)",  bg:"var(--glass-1)", border:"var(--border)" },
  approved: { label:"Aprobată",    color:"var(--success)",     bg:"var(--success-bg)", border:"var(--success-border)" },
  rejected: { label:"Respinsă",    color:"var(--danger)",      bg:"var(--danger-bg)",  border:"var(--danger-border)" },
};
const STEPS = [
  { n:"01", title:"Selectezi specialistul",  desc:"Filtrezi după specialitate și locație." },
  { n:"02", title:"Completezi formularul",   desc:"Descrii pe scurt cu ce ai nevoie de ajutor." },
  { n:"03", title:"Ești contactat",          desc:"Specialistul te contactează în maxim 24h." },
];

export default function SpecialistsPage() {
  const { user } = useAuthStore();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [myRequests, setMyRequests] = useState<SpecialistRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "", preferred_date: "" });
  const [errors, setErrors] = useState<Record<string,string>>({});

  useEffect(() => {
    Promise.all([api.get("/specialists/doctors"), api.get("/specialists/requests/my")])
      .then(([dr, rr]) => { setDoctors(dr.data); setMyRequests(rr.data); })
      .catch(() => toast.error("Nu s-au putut încărca datele"))
      .finally(() => setLoading(false));
    if (user) setForm(f => ({ ...f, name: user.name, email: user.email }));
  }, [user]);

  const validate = () => {
    const e: Record<string,string> = {};
    if (!selectedId) e.specialist = "Selectează un specialist din listă";
    if (!form.name.trim()) e.name = "Obligatoriu";
    if (!form.email) e.email = "Obligatoriu";
    if (!form.message.trim()) e.message = "Obligatoriu";
    if (!form.preferred_date) e.preferred_date = "Selectează o dată";
    setErrors(e); return !Object.keys(e).length;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await api.post("/specialists/requests", { ...form, doctor_id: selectedId });
      toast.success("Cerere trimisă cu succes!");
      api.get("/specialists/requests/my").then(r => setMyRequests(r.data)).catch(() => {});
      setSent(true);
      setForm(f => ({ ...f, message: "", preferred_date: "" }));
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Eroare la trimitere");
    } finally { setSubmitting(false); }
  };

  const filtered = doctors.filter(d =>
    !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.specialty?.toLowerCase().includes(search.toLowerCase())
  );

  const sel = doctors.find(d => d.id === selectedId);

  const inp: React.CSSProperties = { width:"100%", height:"44px", padding:"0 14px", background:"var(--glass-input)", border:"1.5px solid var(--border)", borderRadius:"var(--r-md)", color:"var(--text-primary)", fontFamily:"var(--font-body)", fontSize:"14px", outline:"none", transition:"all var(--t-fast)", boxSizing:"border-box" };
  const onF = (e: React.FocusEvent<HTMLInputElement|HTMLTextAreaElement>) => { e.currentTarget.style.borderColor="var(--accent)"; e.currentTarget.style.boxShadow="0 0 0 3px var(--accent-glow)"; };
  const onB = (e: React.FocusEvent<HTMLInputElement|HTMLTextAreaElement>) => { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.boxShadow="none"; };

  return (
    <div style={{ padding:"clamp(20px,4vw,40px)", width:"100%" }}>
      <div className="anim-fade-up" style={{ marginBottom:"24px" }}>
        <h1 style={{ fontFamily:"var(--font-display)", fontWeight:900, fontSize:"clamp(20px,4vw,28px)", color:"var(--text-primary)", letterSpacing:"-0.025em", marginBottom:"6px" }}>Contact specialist</h1>
        <p style={{ fontSize:"14px", color:"var(--text-muted)" }}>Conectează-te cu psihologi și psihiatri verificați.</p>
      </div>

      {/* Steps */}
      <div className="anim-fade-up delay-1" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1px", background:"var(--border)", borderRadius:"var(--r-xl)", overflow:"hidden", marginBottom:"28px" }}>
        {STEPS.map(({ n, title, desc }) => (
          <div key={n} style={{ padding:"18px 22px", background:"var(--glass-1)", backdropFilter:"blur(20px)" }}>
            <div style={{ fontFamily:"var(--font-display)", fontWeight:900, fontSize:"28px", color:"rgba(139,92,246,0.18)", lineHeight:1, marginBottom:"8px" }}>{n}</div>
            <div style={{ fontSize:"14px", fontWeight:700, fontFamily:"var(--font-display)", color:"var(--text-primary)", marginBottom:"4px" }}>{title}</div>
            <div style={{ fontSize:"12px", color:"var(--text-muted)", lineHeight:1.5 }}>{desc}</div>
          </div>
        ))}
      </div>

      <div className="specialist-grid" style={{ display:"grid", gridTemplateColumns:"1fr 360px", gap:"24px", alignItems:"start" }}>

        {/* LEFT */}
        <div>
          <div style={{ position:"relative", marginBottom:"12px" }}>
            <div style={{ position:"absolute", left:"14px", top:"50%", transform:"translateY(-50%)", color:"var(--text-muted)", pointerEvents:"none" }}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="9" cy="9" r="5"/><path d="M16 16l-3-3"/></svg>
            </div>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Caută specialist..." className="glass-input" style={{ paddingLeft:"40px", height:"40px" }}/>
          </div>

          {loading ? (
            <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
              {[1,2,3].map(i => <div key={i} className="glass-card" style={{ height:"90px", borderRadius:"var(--r-xl)", animation:"pulse 1.5s ease-in-out infinite" }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign:"center", padding:"48px", color:"var(--text-muted)", fontSize:"14px" }}>Niciun specialist găsit.</div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
              {filtered.map((d: Doctor, i) => {
                const isSel = selectedId === d.id;
                const color = "#8b5cf6";
                return (
                  <div key={d.id} className={`anim-fade-up delay-${Math.min(i+1,4)}`}
                    onClick={() => { setSelectedId(isSel?null:d.id); setSent(false); }}
                    style={{ padding:"16px 18px", display:"flex", alignItems:"flex-start", gap:"14px", background:isSel?"var(--glass-active)":"var(--glass-1)", backdropFilter:"blur(20px)", borderTop:`1px solid ${isSel?"var(--border-strong)":"var(--border)"}`, borderRight:`1px solid ${isSel?"var(--border-strong)":"var(--border)"}`, borderBottom:`1px solid ${isSel?"var(--border-strong)":"var(--border)"}`, borderLeft:isSel?`3px solid ${color}`:`1px solid var(--border)`, borderRadius:"var(--r-xl)", cursor:"pointer", transition:"all var(--t-normal)", boxShadow:isSel?"var(--shadow-glow)":"none" }}
                    onMouseEnter={e=>{if(!isSel){(e.currentTarget as HTMLElement).style.background="var(--glass-hover)";(e.currentTarget as HTMLElement).style.borderColor="var(--border-hover)";}}}
                    onMouseLeave={e=>{if(!isSel){(e.currentTarget as HTMLElement).style.background="var(--glass-1)";(e.currentTarget as HTMLElement).style.borderColor="var(--border)";}}}
                  >
                    <div style={{ width:"48px", height:"48px", borderRadius:"50%", flexShrink:0, background:`linear-gradient(135deg,${color}33,${color}11)`, border:`2px solid ${color}44`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--font-display)", fontWeight:900, fontSize:"15px", color, overflow:"hidden" }}>
                      {d.photo_url
                        ? <img src={d.photo_url} alt={d.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e => { (e.currentTarget as HTMLImageElement).style.display="none"; (e.currentTarget.parentElement as HTMLElement).innerText=d.name.split(" ").map((w:string)=>w[0]).slice(0,2).join("").toUpperCase(); }} />
                        : d.name.split(" ").map((w:string)=>w[0]).slice(0,2).join("").toUpperCase()
                      }
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:"15px", fontWeight:700, fontFamily:"var(--font-display)", color:"var(--text-primary)", marginBottom:"3px" }}>{d.name}</div>
                      <div style={{ display:"flex", alignItems:"center", gap:"6px", flexWrap:"wrap", marginBottom:"6px" }}>
                        <span style={{ fontSize:"12px", color:"var(--accent-light)", fontWeight:600, fontFamily:"var(--font-display)" }}>{d.specialty}</span>
                        {d.location && <><span style={{ fontSize:"11px", color:"var(--text-muted)", opacity:0.5 }}>·</span><span style={{ fontSize:"12px", color:"var(--text-muted)" }}>{d.location}</span></>}
                        {d.years_experience > 0 && <><span style={{ fontSize:"11px", color:"var(--text-muted)", opacity:0.5 }}>·</span><span style={{ fontSize:"12px", color:"var(--text-muted)" }}>{d.years_experience} ani exp.</span></>}
                      </div>
                      {d.bio && <div style={{ fontSize:"12px", color:"var(--text-muted)", lineHeight:1.5 }}>{d.bio.length > 300 ? d.bio.slice(0, 300) + "…" : d.bio}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* My requests */}
          {myRequests.length > 0 && (
            <div style={{ marginTop:"28px" }}>
              <h2 className="section-title">Cererile mele</h2>
              <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                {myRequests.map((r: SpecialistRequest) => {
                  const sc = STATUS_CFG[r.status] ?? STATUS_CFG.pending;
                  return (
                    <div key={r.id} className="glass-card" style={{ padding:"12px 16px", display:"flex", alignItems:"center", gap:"12px" }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:"13px", fontWeight:700, fontFamily:"var(--font-display)", color:"var(--text-primary)", marginBottom:"3px" }}>{r.doctor_name ?? "Specialist"}</div>
                        <div style={{ fontSize:"11px", color:"var(--text-muted)" }}>{r.preferred_date ?? ""}</div>
                      </div>
                      <span style={{ fontSize:"11px", fontWeight:700, fontFamily:"var(--font-display)", padding:"3px 10px", borderRadius:"var(--r-full)", background:sc.bg, border:`1px solid ${sc.border}`, color:sc.color }}>{sc.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: form */}
        <div className="spec-sticky" style={{ position:"sticky", top:"24px" }}>
          <div className="glass-card-raised" style={{ padding:"24px" }}>
            {sent ? (
              <div style={{ textAlign:"center", padding:"20px 0" }}>
                <div style={{ fontSize:"40px", marginBottom:"14px" }}>✅</div>
                <div style={{ fontFamily:"var(--font-display)", fontWeight:800, fontSize:"16px", color:"var(--text-primary)", marginBottom:"8px" }}>Cerere trimisă!</div>
                <p style={{ fontSize:"13px", color:"var(--text-secondary)", lineHeight:1.6, marginBottom:"16px" }}>{sel?.name ?? "Specialistul"} te va contacta în maxim 24 de ore.</p>
                <button onClick={()=>{setSent(false);setSelectedId(null);}} className="btn-glass" style={{ height:"38px", padding:"0 18px", fontSize:"13px" }}>Trimite altă cerere</button>
              </div>
            ) : (
              <>
                <h2 style={{ fontFamily:"var(--font-display)", fontWeight:800, fontSize:"16px", color:"var(--text-primary)", marginBottom:"12px" }}>
                  {sel ? `Programare cu ${sel.name}` : "Solicită o programare"}
                </h2>
                {sel && (
                  <div style={{ display:"flex", alignItems:"center", gap:"10px", padding:"10px 12px", background:"var(--glass-1)", border:"1px solid var(--border)", borderRadius:"var(--r-md)", marginBottom:"16px" }}>
                    <div style={{ width:"30px", height:"30px", borderRadius:"50%", background:"rgba(139,92,246,0.2)", border:"2px solid rgba(139,92,246,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"12px", fontWeight:900, fontFamily:"var(--font-display)", color:"var(--accent-light)", flexShrink:0 }}>
                      {sel.name.split(" ").map((w:string)=>w[0]).slice(0,2).join("")}
                    </div>
                    <div>
                      <div style={{ fontSize:"13px", fontWeight:700, fontFamily:"var(--font-display)", color:"var(--text-primary)" }}>{sel.name}</div>
                      <div style={{ fontSize:"11px", color:"var(--text-muted)" }}>{sel.specialty} · {sel.location}</div>
                    </div>
                  </div>
                )}
                {!sel && <p style={{ fontSize:"13px", color:"var(--text-muted)", marginBottom:"8px", lineHeight:1.5 }}>Selectează un specialist din lista din stânga pentru a continua.</p>}
                {errors.specialist && <p style={{ fontSize:"12px", color:"var(--danger)", marginBottom:"10px", padding:"8px 12px", background:"var(--danger-bg)", border:"1px solid var(--danger-border)", borderRadius:"var(--r-md)" }}>{errors.specialist}</p>}
                <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
                  {[
                    { id:"sp-name",  label:"Nume complet *", type:"text",  val:form.name,    key:"name",    ph:"Ion Popescu",       ac:"name" },
                    { id:"sp-email", label:"Email *",        type:"email", val:form.email,   key:"email",   ph:"email@exemplu.com", ac:"email" },
                  ].map(({ id, label, type, val, key, ph, ac }) => (
                    <div key={id}>
                      <label htmlFor={id} className="field-label">{label}</label>
                      <input id={id} type={type} value={val} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} placeholder={ph} autoComplete={ac} style={inp} onFocus={onF} onBlur={onB}/>
                      {errors[key] && <p style={{ marginTop:"4px", fontSize:"12px", color:"var(--danger)" }}>{errors[key]}</p>}
                    </div>
                  ))}
                  <div>
                    <label htmlFor="sp-date" className="field-label">Dată preferată *</label>
                    <input id="sp-date" type="date" value={form.preferred_date} onChange={e=>setForm(f=>({...f,preferred_date:e.target.value}))} style={{ ...inp, colorScheme:"dark" }} onFocus={onF} onBlur={onB}/>
                    {errors.preferred_date && <p style={{ marginTop:"4px", fontSize:"12px", color:"var(--danger)" }}>{errors.preferred_date}</p>}
                  </div>
                  <div>
                    <label htmlFor="sp-msg" className="field-label">Mesaj *</label>
                    <textarea id="sp-msg" value={form.message} onChange={e=>setForm(f=>({...f,message:e.target.value}))} placeholder="Descrie pe scurt cu ce ai nevoie de ajutor..." rows={3}
                      style={{ ...inp, height:"auto", padding:"10px 14px", resize:"vertical", lineHeight:1.6 }} onFocus={onF} onBlur={onB}/>
                    {errors.message && <p style={{ marginTop:"4px", fontSize:"12px", color:"var(--danger)" }}>{errors.message}</p>}
                  </div>
                  <button type="submit" disabled={submitting} className="btn-primary" style={{ height:"46px", marginTop:"2px" }}>
                    {submitting ? <><span className="spinner spinner-sm" />Se trimite...</> : "Trimite cererea de programare"}
                  </button>
                </form>
              </>
            )}
          </div>
          <div className="urgenta-banner" style={{ marginTop:"10px" }}>
            Urgență? <a href="tel:112">112</a> sau <a href="tel:0800801200">0800 801 200</a>
          </div>
        </div>
      </div>
    </div>
  );
}
