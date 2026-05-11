"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const SECTIONS = [
  {
    title: "Ce este SoulSide",
    content: "SoulSide este un asistent AI care te ajută să procesezi emoțiile, să urmărești starea de spirit și să accesezi tehnici de relaxare. Răspunsurile sunt generate de un model AI bazat pe documente validate, dar AI-ul poate greși. Nu lua decizii medicale pe baza ce îți spune SoulSide.",
  },
  {
    title: "Ce nu e permis",
    content: "Nu poți folosi SoulSide ca să răspândești informații false, să accesezi datele altor utilizatori, să automatizezi cereri prin scraping sau boți, sau să folosești serviciul în scopuri comerciale fără acordul nostru.",
  },
  {
    title: "Disponibilitate",
    content: "Serviciul poate fi oprit temporar pentru mentenanță. Nu garantăm disponibilitate 100%.",
  },
  {
    title: "Conținut generat de AI",
    content: "Răspunsurile SoulSide sunt generate de Groq API. Citarea surselor nu garantează acuratețea completă. Exercițiile recomandate sunt bazate pe surse validate, dar nu înlocuiesc consultul medical.",
  },
  {
    title: "Contul tău",
    content: "Ești responsabil de securitatea contului tău. Dacă bănuiești că cineva l-a accesat fără permisiunea ta, contactează-ne imediat.",
  },
  {
    title: "Ștergerea contului",
    content: "Poți șterge contul oricând din Setări. La ștergere, toate datele tale sunt șterse permanent.",
  },
  {
    title: "Modificări",
    content: "Putem actualiza acești termeni. Te vom notifica prin email dacă schimbările sunt semnificative. Continuarea utilizării după notificare înseamnă acceptarea termenilor noi.",
  },
  {
    title: "Răspundere limitată",
    content: "SoulSide este un proiect educațional. Nu răspundem pentru decizii luate pe baza conținutului generat de AI. În caz de urgență psihiatrică, sună 112.",
  },
];

export default function TermeniPage() {
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
            Termeni de utilizare
          </h1>
          <p style={{ fontSize: 16, color: "rgba(241,240,245,0.55)", lineHeight: 1.7 }}>
            SoulSide este un serviciu de suport emoțional creat de Ionut Chintea (ionut.chintea24@gmail.com). Nu suntem o clinică, nu avem medici și nu oferim diagnostic sau tratament medical.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {SECTIONS.map((s, i) => (
            <div key={s.title} style={{ padding: "24px 0", borderBottom: "1px solid rgba(139,92,246,0.08)" }}>
              <div style={{ display: "flex", gap: 16, alignItems: "baseline" }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: "rgba(139,92,246,0.5)", minWidth: 24, fontFamily: "var(--font-display, sans-serif)", letterSpacing: "0.02em" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: "rgba(241,240,245,0.9)", marginBottom: 8, fontFamily: "var(--font-display, sans-serif)", letterSpacing: "-0.01em" }}>
                    {s.title}
                  </h2>
                  <p style={{ fontSize: 15, color: "rgba(241,240,245,0.6)", lineHeight: 1.75 }}>
                    {s.content}
                  </p>
                </div>
              </div>
            </div>
          ))}

          <div style={{ padding: "24px 0" }}>
            <div style={{ display: "flex", gap: 16, alignItems: "baseline" }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "rgba(139,92,246,0.5)", minWidth: 24, fontFamily: "var(--font-display, sans-serif)" }}>09</span>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: "rgba(241,240,245,0.9)", marginBottom: 8, fontFamily: "var(--font-display, sans-serif)" }}>
                  Contact
                </h2>
                <a href="mailto:ionut.chintea24@gmail.com" style={{ fontSize: 15, color: "rgba(139,92,246,0.8)", textDecoration: "none", fontWeight: 500 }}>
                  ionut.chintea24@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 48, padding: "20px 24px", background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)", borderRadius: 12 }}>
          <p style={{ fontSize: 13, color: "rgba(241,240,245,0.45)", lineHeight: 1.65, margin: 0 }}>
            Citind acești termeni, ai înțeles că SoulSide nu este un serviciu medical. Dacă ai nevoie de ajutor în criză, sună <strong style={{ color: "rgba(241,240,245,0.7)" }}>112</strong> sau <strong style={{ color: "rgba(241,240,245,0.7)" }}>0800 801 200</strong> (gratuit, 24/7).
          </p>
        </div>

        <div style={{ marginTop: 32, textAlign: "center" }}>
          <Link href="/confidentialitate" style={{ fontSize: 13, color: "rgba(139,92,246,0.6)", textDecoration: "none", fontWeight: 500 }}
            onMouseEnter={e => (e.currentTarget.style.color = "rgba(139,92,246,0.9)")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(139,92,246,0.6)")}>
            Citește și Politica de confidențialitate
          </Link>
        </div>

      </div>
    </div>
  );
}
