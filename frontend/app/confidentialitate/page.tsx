"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const SECTIONS = [
  {
    title: "Ce date colectăm",
    content: [
      "Date de cont: nume, email și parolă stocată criptat cu bcrypt.",
      "Date de utilizare: conversațiile din chat, înregistrările de dispoziție și adresa IP folosită pentru protecție la brute-force.",
      "Date tehnice: cookie-uri httpOnly pentru autentificare: token de acces valid 15 minute, token de refresh valid 7 zile.",
    ],
  },
  {
    title: "De ce le colectăm și pe ce bază legală",
    content: [
      "Datele de cont: executarea contractului, Art. 6(1)(b) GDPR.",
      "Conversațiile și jurnalul emoțional: consimțământul tău explicit, Art. 6(1)(a) și Art. 9(2)(a) GDPR. Sunt date sensibile în sensul GDPR.",
      "Adresa IP pentru rate limiting: interesul legitim de securitate al serviciului, Art. 6(1)(f) GDPR.",
    ],
  },
  {
    title: "Cât timp le păstrăm",
    content: [
      "Datele sunt păstrate cât timp contul tău este activ. La ștergerea contului, toate datele sunt șterse imediat și ireversibil.",
    ],
  },
  {
    title: "Cu cine le partajăm",
    content: [
      "Groq Inc. (SUA) procesează textul conversațiilor pentru a genera răspunsuri AI. Resend Inc. (SUA) trimite emailurile de verificare și recuperare parolă. Neon Inc. (SUA) stochează baza de date PostgreSQL. Oracle Cloud Infrastructure găzduiește serverul backend. Vercel Inc. (SUA) găzduiește frontendul aplicației.",
      "Transferurile către companii din SUA au loc pe baza Clauzelor Contractuale Standard aprobate de Comisia Europeană. Nu vindem datele tale.",
    ],
  },
  {
    title: "Drepturile tale (GDPR Art. 15-22)",
    content: [
      "Ai dreptul să accesezi datele pe care le deținem (Art. 15) și să corectezi datele incorecte (Art. 16). Poți cere ștergerea direct din Setări (Art. 17), restricționarea prelucrării (Art. 18) sau portabilitatea datelor (Art. 20).",
    ],
  },
  {
    title: "Date sensibile",
    content: [
      "Conversațiile și jurnalul emoțional sunt date cu caracter sensibil conform Art. 9 GDPR. Le prelucrăm pe baza consimțământului tău explicit dat la înregistrare.",
    ],
  },
  {
    title: "Cookies",
    content: [
      "Folosim doar cookie-uri httpOnly necesare pentru autentificare. Nu există tracking, publicitate sau Google Analytics.",
    ],
  },
  {
    title: "Securitate",
    content: [
      "Parolele sunt criptate cu bcrypt. Comunicarea este criptată prin HTTPS. Sesiunile sunt invalidate la logout și la schimbarea parolei. Contul se blochează temporar după 5 încercări eșuate.",
    ],
  },
  {
    title: "Plângeri",
    content: [
      "Poți depune o plângere la Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP) la dataprotection.ro.",
    ],
  },
];

export default function ConfidentialitatePage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base, #030208)", padding: "0 0 80px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px" }}>

        <div style={{ position: "sticky", top: 0, background: "rgba(3,2,8,0.95)", backdropFilter: "blur(16px)", padding: "16px 0", marginBottom: "40px", borderBottom: "1px solid rgba(139,92,246,0.12)", display: "flex", alignItems: "center", gap: 16, zIndex: 10 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(241,240,245,0.5)", textDecoration: "none", fontSize: 14, fontWeight: 500, transition: "color 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.color = "rgba(241,240,245,0.9)")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(241,240,245,0.5)")}>
            <ArrowLeft size={16} />
            Înapoi
          </Link>
          <div style={{ width: 1, height: 18, background: "rgba(139,92,246,0.2)" }} />
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <img src="/logo.png" alt="SoulSide" style={{ width: 24, height: 24, borderRadius: 6, objectFit: "cover" }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "rgba(241,240,245,0.7)", fontFamily: "var(--font-display, sans-serif)" }}>SoulSide</span>
          </Link>
        </div>

        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 900, color: "rgba(241,240,245,1)", letterSpacing: "-0.03em", marginBottom: 16, fontFamily: "var(--font-display, sans-serif)", lineHeight: 1.1 }}>
            Politică de confidențialitate
          </h1>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {SECTIONS.map((s, i) => (
            <div key={s.title} style={{ padding: "24px 0", borderBottom: "1px solid rgba(139,92,246,0.08)" }}>
              <div style={{ display: "flex", gap: 16, alignItems: "baseline" }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: "rgba(139,92,246,0.5)", minWidth: 24, fontFamily: "var(--font-display, sans-serif)", letterSpacing: "0.02em" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: "rgba(241,240,245,0.9)", marginBottom: 12, fontFamily: "var(--font-display, sans-serif)", letterSpacing: "-0.01em" }}>
                    {s.title}
                  </h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {s.content.map((paragraph, j) => (
                      <p key={j} style={{ fontSize: 15, color: "rgba(241,240,245,0.6)", lineHeight: 1.75, margin: 0 }}>
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div style={{ padding: "24px 0" }}>
            <div style={{ display: "flex", gap: 16, alignItems: "baseline" }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "rgba(139,92,246,0.5)", minWidth: 24, fontFamily: "var(--font-display, sans-serif)" }}>10</span>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: "rgba(241,240,245,0.9)", marginBottom: 8, fontFamily: "var(--font-display, sans-serif)" }}>
                  Contact
                </h2>
                <p style={{ fontSize: 15, color: "rgba(241,240,245,0.6)", lineHeight: 1.75, marginBottom: 8 }}>
                  Pentru orice întrebare legată de datele tale personale:
                </p>
                <a href="mailto:ionut.chintea24@gmail.com" style={{ fontSize: 15, color: "rgba(139,92,246,0.8)", textDecoration: "none", fontWeight: 500 }}>
                  ionut.chintea24@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>


        <div style={{ marginTop: 32, textAlign: "center" }}>
          <Link href="/termeni" style={{ fontSize: 13, color: "rgba(139,92,246,0.6)", textDecoration: "none", fontWeight: 500 }}
            onMouseEnter={e => (e.currentTarget.style.color = "rgba(139,92,246,0.9)")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(139,92,246,0.6)")}>
            Citește și Termenii de utilizare
          </Link>
        </div>

      </div>
    </div>
  );
}
