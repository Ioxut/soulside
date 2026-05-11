"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Mail, Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import api from "@/lib/api";
import OrbBackground from "@/components/ui/OrbBackground";

const STEPS = ["Email", "Cod", "Parolă", "Gata"];

const inp: React.CSSProperties = {
  width: "100%", height: "48px", padding: "0 14px 0 42px",
  background: "var(--glass-input)", border: "1.5px solid var(--border)",
  borderRadius: "var(--r-md)", color: "var(--text-primary)",
  fontFamily: "var(--font-body)", fontSize: "15px", outline: "none",
  transition: "all var(--t-fast)", boxSizing: "border-box",
};
const onF = (e: React.FocusEvent<HTMLInputElement>) => {
  e.currentTarget.style.borderColor = "var(--accent)";
  e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-glow)";
};
const onB = (e: React.FocusEvent<HTMLInputElement>) => {
  e.currentTarget.style.borderColor = "var(--border)";
  e.currentTarget.style.boxShadow = "none";
};

function StepBar({ active }: { active: number }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", marginBottom: "28px" }}>
      {STEPS.map((label, i) => (
        <div key={label} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
            <div style={{
              width: "26px", height: "26px", borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "11px", fontWeight: 700,
              background: i <= active ? "var(--accent)" : "rgba(255,255,255,0.05)",
              color: i <= active ? "#fff" : "var(--text-muted)",
              border: i <= active ? "none" : "1px solid var(--border)",
              boxShadow: i <= active ? "0 0 10px var(--accent-glow)" : "none",
              transition: "all 0.35s",
            }}>
              {i < active ? "✓" : i + 1}
            </div>
            <span style={{ fontSize: "9px", fontWeight: 600, whiteSpace: "nowrap",
              color: i <= active ? "var(--accent-light)" : "var(--text-muted)" }}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div style={{ flex: 1, height: "1px", margin: "0 5px 18px",
              background: i < active ? "rgba(139,92,246,0.5)" : "rgba(255,255,255,0.06)",
              transition: "background 0.35s" }} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── Step 1: send code ──────────────────────────────────────────────────────
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error("Introdu adresa de email"); return; }
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setStep(1);
    } catch {
      toast.error("Eroare la trimitere. Încearcă din nou.");
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (val: string, idx: number) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[idx] = digit;
    setCode(next);
    if (digit && idx < 5) codeRefs.current[idx + 1]?.focus();
  };
  const handleCodeKey = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === "Backspace" && !code[idx] && idx > 0) codeRefs.current[idx - 1]?.focus();
  };
  const handleCodePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(""));
      codeRefs.current[5]?.focus();
    }
  };
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const full = code.join("");
    if (full.length < 6) { toast.error("Introdu codul de 6 cifre"); return; }
    setLoading(true);
    try {
      await api.post("/auth/verify-reset-code", { email, code: full });
      setStep(2);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Cod invalid sau expirat");
      setCode(["", "", "", "", "", ""]);
      codeRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { toast.error("Parola trebuie să aibă cel puțin 8 caractere"); return; }
    if (password !== confirm) { toast.error("Parolele nu coincid"); return; }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { email, code: code.join(""), new_password: password });
      setStep(3);
      setTimeout(() => router.push("/login"), 2500);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Cod invalid sau expirat");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg-base)", padding: "clamp(16px,4vw,24px)", position: "relative" }}>
      <OrbBackground />
      <div className="glass-card-raised anim-scale-in"
        style={{ width: "100%", maxWidth: "420px", padding: "clamp(24px,4vw,36px) clamp(20px,4vw,32px)", position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
          <img src="/logo.png" alt="SoulSide" style={{ width: "40px", height: "40px", borderRadius: "var(--r-xl)", objectFit: "cover", flexShrink: 0 }} />
          <div>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, color: "var(--text-primary)", fontSize: "15px", lineHeight: 1 }}>SoulSide</p>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "3px" }}>Recuperare cont</p>
          </div>
        </div>

        <StepBar active={step} />

        {}
        {step === 0 && (
          <>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "20px",
              color: "var(--text-primary)", marginBottom: "6px" }}>Ai uitat parola?</h2>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "20px", lineHeight: 1.55 }}>
              Introdu emailul contului tău. Îți trimitem un cod de 6 cifre.
            </p>
            <form onSubmit={handleSendCode} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label htmlFor="email" className="field-label">Adresă email</label>
                <div style={{ position: "relative" }}>
                  <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                    <Mail size={15} color="var(--text-muted)" strokeWidth={1.6} />
                  </div>
                  <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="email@exemplu.com" autoComplete="email" required
                    style={inp} onFocus={onF} onBlur={onB} />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary" style={{ width: "100%" }}>
                {loading
                  ? <><span className="spinner spinner-sm" />Se trimite...</>
                  : "Trimite cod"}
              </button>
            </form>
          </>
        )}

        {/* ── STEP 1: Cod OTP ── */}
        {step === 1 && (
          <>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "20px",
              color: "var(--text-primary)", marginBottom: "6px" }}>Verifică emailul</h2>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "20px", lineHeight: 1.55 }}>
              Am trimis un cod de 6 cifre la{" "}
              <span style={{ color: "var(--accent-light)", fontWeight: 600 }}>{email}</span>.
              Codul expiră în 15 minute.
            </p>
            <form onSubmit={handleVerifyCode} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <label className="field-label">Cod de verificare</label>
                <div style={{ display: "flex", gap: "8px", justifyContent: "center" }} onPaste={handleCodePaste}>
                  {code.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => { codeRefs.current[i] = el; }}
                      type="text" inputMode="numeric" maxLength={1}
                      value={digit}
                      onChange={e => handleCodeChange(e.target.value, i)}
                      onKeyDown={e => handleCodeKey(e, i)}
                      style={{
                        width: "44px", height: "52px", textAlign: "center",
                        fontSize: "22px", fontWeight: 800, fontFamily: "var(--font-display)",
                        background: "var(--glass-input)", border: digit ? "1.5px solid var(--accent)" : "1.5px solid var(--border)",
                        borderRadius: "var(--r-md)", color: "var(--text-primary)",
                        outline: "none", transition: "all 0.2s",
                        boxShadow: digit ? "0 0 0 3px var(--accent-glow)" : "none",
                        caretColor: "var(--accent)",
                      }}
                    />
                  ))}
                </div>
              </div>
              <button type="submit" className="btn-primary" style={{ width: "100%" }}
                disabled={code.join("").length < 6 || loading}>
                {loading ? <><span className="spinner spinner-sm" />Se verifică...</> : "Verifică codul →"}
              </button>
              <p style={{ textAlign: "center", fontSize: "12px", color: "var(--text-muted)" }}>
                Nu ai primit nimic?{" "}
                <button type="button" onClick={() => { setStep(0); setCode(["","","","","",""]); }}
                  style={{ background: "none", border: "none", color: "var(--accent-light)",
                    fontWeight: 600, cursor: "pointer", fontSize: "12px", padding: 0 }}>
                  Retrimite codul
                </button>
              </p>
            </form>
          </>
        )}

        {/* ── STEP 2: Parolă nouă ── */}
        {step === 2 && (
          <>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "20px",
              color: "var(--text-primary)", marginBottom: "6px" }}>Parolă nouă</h2>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "20px" }}>
              Alege o parolă sigură pentru contul tău.
            </p>
            <form onSubmit={handleReset} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label htmlFor="pass" className="field-label">Parolă nouă</label>
                <div style={{ position: "relative" }}>
                  <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                    <Lock size={15} color="var(--text-muted)" strokeWidth={1.6} />
                  </div>
                  <input id="pass" type={showPass ? "text" : "password"} value={password}
                    onChange={e => setPassword(e.target.value)} placeholder="Minim 8 caractere"
                    autoComplete="new-password" required
                    style={{ ...inp, paddingRight: "48px" }} onFocus={onF} onBlur={onB} />
                  <button type="button" onClick={() => setShowPass(s => !s)}
                    style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", padding: 0 }}>
                    {showPass ? <EyeOff size={16} strokeWidth={1.6} /> : <Eye size={16} strokeWidth={1.6} />}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="confirm" className="field-label">Confirmă parola</label>
                <div style={{ position: "relative" }}>
                  <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                    <Lock size={15} color="var(--text-muted)" strokeWidth={1.6} />
                  </div>
                  <input id="confirm" type={showPass ? "text" : "password"} value={confirm}
                    onChange={e => setConfirm(e.target.value)} placeholder="Repetă parola nouă"
                    autoComplete="new-password" required
                    style={inp} onFocus={onF} onBlur={onB} />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary" style={{ width: "100%", marginTop: "4px" }}>
                {loading
                  ? <><span className="spinner spinner-sm" />Se salvează...</>
                  : "Setează parola →"}
              </button>
            </form>
          </>
        )}

        {/* ── STEP 3: Gata ── */}
        {step === 3 && (
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "16px",
              background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <CheckCircle size={28} color="#4ade80" strokeWidth={2} />
            </div>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "18px",
              color: "var(--text-primary)", marginBottom: "8px" }}>Parolă resetată!</h2>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.6 }}>
              Ești redirecționat către login…
            </p>
          </div>
        )}

        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <Link href="/login" style={{ fontSize: "13px", color: "var(--accent-light)", textDecoration: "none" }}>
            Înapoi la login
          </Link>
        </div>

        <div className="urgenta-banner" style={{ marginTop: "16px" }}>
          Urgență? <a href="tel:112">112</a> sau <a href="tel:0800801200">0800 801 200</a> (gratuit, 24/7)
        </div>
      </div>
    </div>
  );
}
