"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { User, Mail, Lock, Eye, EyeOff, Check } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import OrbBackground from "@/components/ui/OrbBackground";

const inpStyle: React.CSSProperties = {
  width: "100%", height: "44px", padding: "0 14px", background: "var(--glass-input)",
  border: "1.5px solid var(--border)", borderRadius: "var(--r-md)",
  color: "var(--text-primary)", fontFamily: "var(--font-body)",
  fontSize: "14px", outline: "none", transition: "all var(--t-fast)",
  boxSizing: "border-box"
};

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [consent, setConsent] = useState({ terms: false, data: false });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Numele este obligatoriu";
    if (!form.email) e.email = "Email-ul este obligatoriu";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Email invalid";
    if (form.password.length < 8) e.password = "Parola trebuie să aibă cel puțin 8 caractere";
    if (form.password !== form.confirm) e.confirm = "Parolele nu coincid";
    if (!consent.terms) e.terms = "Trebuie să accepți termenii pentru a continua";
    if (!consent.data) e.data = "Consimțământul pentru prelucrarea datelor este obligatoriu";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const strength = () => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };

  const strengthColors = ["#ef4444", "#f97316", "#eab308", "#22c55e"];
  const strVal = strength();

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { data: user } = await api.post("/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password,
      });
      setUser(user);
      toast.success(`Bun venit, ${user.name}!`);
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Înregistrare eșuată");
    } finally {
      setLoading(false);
    }
  };

  const onF = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = "var(--accent)";
    e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-glow)";
  };
  const onB = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = errors[e.currentTarget.dataset.field || ""] ? "var(--danger)" : "var(--border)";
    e.currentTarget.style.boxShadow = "none";
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-base)", padding: "clamp(16px,4vw,24px)", position: "relative" }}>
      <OrbBackground />
      <div className="glass-card-raised anim-scale-in" style={{ width: "100%", maxWidth: "420px", padding: "clamp(20px,4vw,32px) clamp(18px,4vw,32px)", position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <img src="/logo.png" alt="SoulSide" style={{ width: "44px", height: "44px", borderRadius: "var(--r-xl)", margin: "0 auto 12px", objectFit: "cover", display: "block" }} />
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(20px,4vw,24px)", color: "var(--text-primary)", letterSpacing: "-0.025em", marginBottom: "6px" }}>Creează-ți contul</h1>
          <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>Alătură-te SoulSide</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>

          <div>
            <label htmlFor="name" className="field-label">Nume complet</label>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                <User size={15} color="var(--text-muted)" strokeWidth={1.6} />
              </div>
              <input id="name" type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ion Popescu" autoComplete="name" data-field="name" style={{ ...inpStyle, paddingLeft: "42px", borderColor: errors.name ? "var(--danger)" : undefined }} onFocus={onF} onBlur={onB} />
            </div>
            {errors.name && <p style={{ marginTop: "5px", fontSize: "12px", color: "var(--danger)" }}>{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="email" className="field-label">Email</label>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                <Mail size={15} color="var(--text-muted)" strokeWidth={1.6} />
              </div>
              <input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="tu@exemplu.com" autoComplete="email" data-field="email" style={{ ...inpStyle, paddingLeft: "42px", borderColor: errors.email ? "var(--danger)" : undefined }} onFocus={onF} onBlur={onB} />
            </div>
            {errors.email && <p style={{ marginTop: "5px", fontSize: "12px", color: "var(--danger)" }}>{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="pass" className="field-label">Parolă</label>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                <Lock size={15} color="var(--text-muted)" strokeWidth={1.6} />
              </div>
              <input id="pass" type={showPass ? "text" : "password"} value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="Minim 8 caractere" autoComplete="new-password" data-field="password"
                style={{ ...inpStyle, paddingLeft: "42px", paddingRight: "48px", borderColor: errors.password ? "var(--danger)" : undefined }}
                onFocus={onF} onBlur={onB} />
              <button type="button" onClick={() => setShowPass(s => !s)}
                style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0, display: "flex" }}>
                {showPass ? <EyeOff size={16} strokeWidth={1.6} /> : <Eye size={16} strokeWidth={1.6} />}
              </button>
            </div>
            {errors.password && <p style={{ marginTop: "5px", fontSize: "12px", color: "var(--danger)" }}>{errors.password}</p>}
            {form.password && (
              <div style={{ display: "flex", gap: "4px", marginTop: "8px" }}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} style={{ height: "4px", flex: 1, borderRadius: "2px", background: i <= strVal ? strengthColors[strVal - 1] : "rgba(255,255,255,0.08)", transition: "all 0.3s" }} />
                ))}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="confirm" className="field-label">Confirmă parola</label>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                <Lock size={15} color="var(--text-muted)" strokeWidth={1.6} />
              </div>
              <input id="confirm" type={showPass ? "text" : "password"} value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} placeholder="Repetă parola" autoComplete="new-password" data-field="confirm" style={{ ...inpStyle, paddingLeft: "42px", borderColor: errors.confirm ? "var(--danger)" : undefined }} onFocus={onF} onBlur={onB} />
            </div>
            {errors.confirm && <p style={{ marginTop: "5px", fontSize: "12px", color: "var(--danger)" }}>{errors.confirm}</p>}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "14px", background: "rgba(139,92,246,0.05)", border: "1px solid rgba(139,92,246,0.18)", borderRadius: "var(--r-md)", marginTop: "4px" }}>

            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}
              onClick={() => setConsent(c => ({ ...c, terms: !c.terms }))}>
              <div style={{ width: 18, height: 18, minWidth: 18, borderRadius: 5, border: `2px solid ${consent.terms ? "var(--accent)" : errors.terms ? "var(--danger)" : "var(--border)"}`, background: consent.terms ? "var(--accent)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1, transition: "all var(--t-fast)", flexShrink: 0 }}>
                {consent.terms && <Check size={11} color="#fff" strokeWidth={3} />}
              </div>
              <span style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Am citit și accept{" "}
                <Link href="/termeni" onClick={e => e.stopPropagation()} style={{ color: "var(--accent-light)", textDecoration: "underline" }}>Termenii de utilizare</Link>
                {" "}și{" "}
                <Link href="/confidentialitate" onClick={e => e.stopPropagation()} style={{ color: "var(--accent-light)", textDecoration: "underline" }}>Politica de confidențialitate</Link>
                {" "}ale SoulSide.
              </span>
            </div>
            {errors.terms && <p style={{ fontSize: "11px", color: "var(--danger)", margin: 0, paddingLeft: "28px" }}>{errors.terms}</p>}

            <div style={{ height: "1px", background: "rgba(139,92,246,0.12)" }} />

            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}
              onClick={() => setConsent(c => ({ ...c, data: !c.data }))}>
              <div style={{ width: 18, height: 18, minWidth: 18, borderRadius: 5, border: `2px solid ${consent.data ? "var(--accent)" : errors.data ? "var(--danger)" : "var(--border)"}`, background: consent.data ? "var(--accent)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1, transition: "all var(--t-fast)", flexShrink: 0 }}>
                {consent.data && <Check size={11} color="#fff" strokeWidth={3} />}
              </div>
              <span style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Îmi exprim consimțământul explicit pentru prelucrarea datelor cu caracter sensibil - conversații și jurnal emoțional, în scopul furnizării serviciului, conform <strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>art. 9(2)(a) GDPR</strong>.
              </span>
            </div>
            {errors.data && <p style={{ fontSize: "11px", color: "var(--danger)", margin: 0, paddingLeft: "28px" }}>{errors.data}</p>}
          </div>

          <button type="submit" disabled={loading} className="btn-primary" style={{ width: "100%", marginTop: "4px" }}>
            {loading ? <><span className="spinner spinner-sm" />Se creează contul...</> : "Creează-ți contul"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "14px", fontSize: "13px", color: "var(--text-muted)" }}>
          Ai deja cont?{" "}
          <Link href="/login" style={{ color: "var(--accent-light)", textDecoration: "none", fontWeight: 700, fontFamily: "var(--font-display)" }}>Intră în cont</Link>
        </p>

        <div className="urgenta-banner" style={{ marginTop: "14px" }}>
          Urgență? <a href="tel:112">112</a> sau <a href="tel:0800801200">0800 801 200</a> (gratuit, 24/7)
        </div>
      </div>
    </div>
  );
}
