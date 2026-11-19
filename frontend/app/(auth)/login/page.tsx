"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { Mail, Eye, EyeOff } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import OrbBackground from "@/components/ui/OrbBackground";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Completează toate câmpurile."); return; }
    setLoading(true); setError("");
    try {
      const { data: user } = await api.post("/auth/login", { email, password });
      setUser(user);
      toast.success(`Bine ai venit, ${user.name}!`);
      const next = searchParams.get("next") || "/dashboard";
      router.push(next);
    } catch (err: any) {
      if (err.response?.status === 403) {
        toast("Contul nu este verificat. Îți trimitem un cod nou.");
        router.push(`/register?verify=1&email=${encodeURIComponent(email)}`);
        return;
      }
      setError(err.response?.data?.detail || "Autentificare eșuată. Verifică datele.");
    } finally {
      setLoading(false);
    }
  };

  const inp: React.CSSProperties = { width: "100%", height: "48px", padding: "0 14px", background: "var(--glass-input)", border: "1.5px solid var(--border)", borderRadius: "var(--r-md)", color: "var(--text-primary)", fontFamily: "var(--font-body)", fontSize: "15px", outline: "none", transition: "all var(--t-fast)" };
  const onF = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-glow)"; };
  const onB = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-base)", padding: "clamp(16px,4vw,24px)", position: "relative" }}>
      <OrbBackground />
      <div className="glass-card-raised anim-scale-in" style={{ width: "100%", maxWidth: "420px", padding: "clamp(28px,5vw,44px) clamp(20px,5vw,40px)", position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <img src="/logo.png" alt="SoulSide" style={{ width: "52px", height: "52px", borderRadius: "var(--r-xl)", margin: "0 auto 16px", objectFit: "cover", display: "block" }} />
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(20px,4vw,24px)", color: "var(--text-primary)", letterSpacing: "-0.025em", marginBottom: "6px" }}>Bine ai venit!</h1>
          <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>Intră în contul tău SoulSide</p>
        </div>

        {error && (
          <div role="alert" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", borderRadius: "var(--r-md)", marginBottom: "16px", background: "var(--danger-bg)", border: "1px solid var(--danger-border)", color: "var(--danger)", fontSize: "13px" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label htmlFor="email" className="field-label">Email</label>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                <Mail size={16} color="var(--text-muted)" strokeWidth={1.6} />
              </div>
              <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplu.com" autoComplete="email" required style={{ ...inp, paddingLeft: "44px" }} onFocus={onF} onBlur={onB} />
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <label htmlFor="pass" className="field-label" style={{ marginBottom: 0 }}>Parolă</label>
              <Link href="/forgot-password" style={{ fontSize: "12px", color: "var(--accent-light)", textDecoration: "none", fontFamily: "var(--font-display)", fontWeight: 600 }}>Ai uitat parola?</Link>
            </div>
            <div style={{ position: "relative" }}>
              <input id="pass" type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" required style={{ ...inp, paddingRight: "48px" }} onFocus={onF} onBlur={onB} />
              <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}>
                {showPass ? <EyeOff size={16} strokeWidth={1.6} /> : <Eye size={16} strokeWidth={1.6} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary" style={{ width: "100%", marginTop: "4px" }}>
            {loading ? <><span className="spinner spinner-sm" />Se conectează...</> : "Intră în cont"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "24px", fontSize: "14px", color: "var(--text-muted)" }}>
          Nu ai cont?{" "}
          <Link href="/register" style={{ color: "var(--accent-light)", textDecoration: "none", fontWeight: 700, fontFamily: "var(--font-display)" }}>Înregistrează-te gratuit</Link>
        </p>

        <div className="urgenta-banner" style={{ marginTop: "24px" }}>
          Urgență? <a href="tel:112">112</a> sau <a href="tel:0800801200">0800 801 200</a> (gratuit, 24/7)
        </div>
      </div>
    </div>
  );
}
