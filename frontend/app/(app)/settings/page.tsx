"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ro } from "date-fns/locale";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

const SECTIONS = [
  { id: "profile", label: "Profil" },
  { id: "security", label: "Securitate" },
  { id: "notifs", label: "Notificări" },
  { id: "danger", label: "Cont" },
];

export default function SettingsPage() {
  const router = useRouter();
  const { user, setUser, logout } = useAuthStore();
  const [section, setSection] = useState("profile");

  /* Profile */
  const [name, setName] = useState(user?.name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? "");
  const [avatarError, setAvatarError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  /* Security */
  const [passwords, setPasswords] = useState({ current: "", newP: "", confirm: "" });
  const [changingPass, setChangingPass] = useState(false);

  /* Danger */
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  const initials = (user?.name ?? "?").split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
  const memberSince = user?.created_at ? format(parseISO(user.created_at), "MMMM yyyy", { locale: ro }) : null;

  const inp: React.CSSProperties = { width: "100%", height: "46px", padding: "0 14px", background: "var(--glass-input)", border: "1.5px solid var(--border)", borderRadius: "var(--r-md)", color: "var(--text-primary)", fontFamily: "var(--font-body)", fontSize: "15px", outline: "none", transition: "all var(--t-fast)", boxSizing: "border-box" };
  const onF = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-glow)"; };
  const onB = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { data } = await api.patch("/auth/me", {
        name: name || undefined,
        avatar_url: avatarUrl || null,
      });
      setUser(data);
      setSaved(true); setTimeout(() => setSaved(false), 2500);
      toast.success("Profil actualizat!");
    } catch { toast.error("Eroare la salvare"); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newP.length < 8) { toast.error("Parola trebuie să aibă cel puțin 8 caractere"); return; }
    if (passwords.newP !== passwords.confirm) { toast.error("Parolele nu coincid"); return; }
    setChangingPass(true);
    try {
      await api.post("/auth/change-password", { current_password: passwords.current, new_password: passwords.newP });
      toast.success("Parola schimbată!");
      setPasswords({ current: "", newP: "", confirm: "" });
    } catch (err: any) { toast.error(err.response?.data?.detail || "Parolă curentă incorectă"); }
    finally { setChangingPass(false); }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "STERGE") return;
    setDeleting(true);
    try {
      await api.delete("/auth/me");
      logout();
      router.replace("/login");
      toast.success("Contul a fost șters.");
    } catch { toast.error("Eroare la ștergerea contului"); setDeleting(false); }
  };

  return (
    <div style={{ padding: "clamp(16px,4vw,36px)", width: "100%", boxSizing: "border-box" }}>
      <div className="anim-fade-up" style={{ marginBottom: "28px" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(20px,4vw,28px)", color: "var(--text-primary)", letterSpacing: "-0.025em", marginBottom: "6px" }}>Setări</h1>
        <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>Gestionează contul și preferințele tale.</p>
      </div>

      <div style={{ display: "flex", gap: "20px", alignItems: "start", flexWrap: "wrap" }}>

        {/* Tabs — horizontal on mobile, vertical on desktop */}
        <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: "2px", width: "100%" }} className="settings-tabs-mobile">
          <style>{`
            @media (min-width: 640px) {
              .settings-tabs-mobile { flex-direction: column !important; width: 170px !important; flex-shrink: 0; flex-wrap: nowrap !important; }
              .settings-panel { flex: 1 !important; min-width: 0; }
            }
          `}</style>
          {SECTIONS.map(({ id, label }) => (
            <button key={id} onClick={() => setSection(id)}
              style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", borderRadius: "var(--r-md)", background: section === id ? "var(--glass-active)" : "transparent", border: `1px solid ${section === id ? "var(--border-strong)" : "transparent"}`, color: section === id ? "var(--text-primary)" : "var(--text-muted)", fontSize: "14px", fontFamily: "var(--font-display)", fontWeight: section === id ? 700 : 500, cursor: "pointer", transition: "all var(--t-fast)", textAlign: "left", minHeight: "42px", borderLeft: section === id ? "2px solid var(--accent)" : "2px solid transparent", whiteSpace: "nowrap", position: "relative" }}>
              {label}
              {id === "notifs" && <span style={{ marginLeft: "auto", fontSize: "9px", fontWeight: 800, letterSpacing: "0.04em", color: "var(--accent-light)", background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: "var(--r-full)", padding: "2px 6px", textTransform: "uppercase" }}>în curând</span>}
            </button>
          ))}
        </div>

        {/* Panel */}
        <div className="glass-card settings-panel" style={{ width: "100%", padding: "clamp(16px,4vw,28px)" }}>

          {/* PROFILE */}
          {section === "profile" && (
            <div className="anim-fade-up" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "17px", color: "var(--text-primary)", margin: 0 }}>Profil public</h2>
                {memberSince && (
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-display)", fontWeight: 600 }}>
                    Membru din {memberSince}
                  </span>
                )}
              </div>

              {/* Avatar preview */}
              <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                <div style={{ width: "70px", height: "70px", borderRadius: "50%", background: (avatarUrl && !avatarError) ? "transparent" : "linear-gradient(135deg,var(--accent),var(--accent-deep))", border: "2px solid var(--border-strong)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", boxShadow: "0 0 20px var(--accent-glow)", flexShrink: 0 }}>
                  {(avatarUrl && !avatarError)
                    ? <img src={avatarUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={() => setAvatarError(true)} />
                    : <span style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "22px", color: "white" }}>{initials}</span>
                  }
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.6 }}>
                  Introdu un URL de imagine
                </div>
              </div>

              <div>
                <label className="field-label">URL avatar <span style={{ textTransform: "none", letterSpacing: 0, fontWeight: 400, color: "var(--text-muted)" }}>(opțional)</span></label>
                <input type="url" value={avatarUrl} onChange={e => { setAvatarUrl(e.target.value); setAvatarError(false); }} placeholder="https://..." style={inp} onFocus={onF} onBlur={onB} />
              </div>
              <div>
                <label htmlFor="uname" className="field-label">Nume utilizator</label>
                <input id="uname" type="text" value={name} onChange={e => setName(e.target.value)} style={inp} onFocus={onF} onBlur={onB} />
              </div>
              <div>
                <label className="field-label">Email <span style={{ textTransform: "none", letterSpacing: 0, fontWeight: 400, color: "var(--text-muted)" }}>(nu poate fi schimbat)</span></label>
                <input type="email" value={user?.email ?? ""} readOnly style={{ ...inp, opacity: .6, cursor: "not-allowed" }} />
              </div>
              <button onClick={handleSaveProfile} disabled={saving} className="btn-primary" style={{ alignSelf: "flex-start", height: "44px", padding: "0 24px" }}>
                {saving ? <><span className="spinner spinner-sm" />Se salvează...</> : saved ? "✓ Salvat!" : "Salvează modificările"}
              </button>
            </div>
          )}

          {/* SECURITY */}
          {section === "security" && (
            <form onSubmit={handleChangePassword} className="anim-fade-up" style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "17px", color: "var(--text-primary)" }}>Securitate cont</h2>
              {[
                { key: "current", label: "Parolă curentă", ac: "current-password" },
                { key: "newP", label: "Parolă nouă", ac: "new-password" },
                { key: "confirm", label: "Confirmă parola nouă", ac: "new-password" },
              ].map(({ key, label, ac }) => (
                <div key={key}>
                  <label className="field-label">{label}</label>
                  <input type="password" placeholder="••••••••" autoComplete={ac}
                    value={passwords[key as keyof typeof passwords]}
                    onChange={e => setPasswords(p => ({ ...p, [key]: e.target.value }))}
                    style={inp} onFocus={onF} onBlur={onB} />
                </div>
              ))}
              <button type="submit" disabled={changingPass} className="btn-primary" style={{ alignSelf: "flex-start", height: "44px", padding: "0 24px" }}>
                {changingPass ? "Se schimbă..." : "Schimbă parola"}
              </button>
            </form>
          )}

          {/* NOTIFICATIONS */}
          {section === "notifs" && (
            <div className="anim-fade-up" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px", flexWrap: "wrap" }}>
                <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "17px", color: "var(--text-primary)", margin: 0 }}>Preferințe notificări</h2>
                <span style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.06em", color: "var(--accent-light)", background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: "var(--r-full)", padding: "3px 8px", textTransform: "uppercase" }}>în curând</span>
              </div>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.6, margin: 0 }}>
                Setările de notificări vor fi disponibile în curând. Vei putea alege ce notificări primești prin email sau push.
              </p>
              {[
                { k: "daily", l: "Reminder zilnic jurnal", d: "Notificare zilnică să înregistrezi starea" },
                { k: "weekly", l: "Raport săptămânal", d: "Rezumat al evoluției emoționale" },
                { k: "tips", l: "Sfaturi și resurse noi", d: "Notificări despre conținut nou" },
                { k: "urgenta", l: "Alerte de urgență", d: "Linii de suport disponibile" },
              ].map(({ k, l, d }) => (
                <div key={k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px", background: "var(--glass-1)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", gap: "16px", opacity: 0.5 }}>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 600, fontFamily: "var(--font-display)", color: "var(--text-primary)", marginBottom: "2px" }}>{l}</div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{d}</div>
                  </div>
                  <div style={{ width: "44px", height: "24px", borderRadius: "var(--r-full)", background: "var(--glass-2)", position: "relative", flexShrink: 0 }}>
                    <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: "white", position: "absolute", top: "3px", left: "3px", boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* DANGER */}
          {section === "danger" && (
            <div className="anim-fade-up" style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "17px", color: "var(--text-primary)" }}>Gestionare cont</h2>
              <div style={{ padding: "20px", background: "var(--danger-bg)", border: "1px solid var(--danger-border)", borderRadius: "var(--r-lg)" }}>
                <div style={{ fontSize: "15px", fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--danger)", marginBottom: "8px" }}>Ștergere cont</div>
                <p style={{ fontSize: "13px", color: "rgba(248,113,113,0.8)", lineHeight: 1.6, marginBottom: "14px" }}>Această acțiune este ireversibilă. Toate datele (mesaje, jurnal, cereri) vor fi șterse permanent.</p>
                <button onClick={() => setShowDeleteModal(true)}
                  style={{ padding: "10px 20px", borderRadius: "var(--r-md)", border: "1px solid var(--danger-border)", background: "transparent", color: "var(--danger)", fontSize: "14px", fontFamily: "var(--font-display)", fontWeight: 700, cursor: "pointer", transition: "all var(--t-fast)" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.1)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                  Șterge contul meu
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete modal */}
      {showDeleteModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
          <div className="glass-card-raised anim-scale-in" style={{ maxWidth: "400px", width: "100%", padding: "28px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--danger-bg)", border: "1px solid var(--danger-border)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", fontSize: "24px" }}>⚠</div>
            <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "18px", color: "var(--text-primary)", textAlign: "center", marginBottom: "10px" }}>Ești sigur?</h3>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", textAlign: "center", lineHeight: 1.65, marginBottom: "20px" }}>Scrie <strong style={{ color: "var(--text-primary)" }}>STERGE</strong> pentru a confirma. Acțiunea este ireversibilă.</p>
            <input type="text" value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} placeholder="Scrie STERGE" className="glass-input" style={{ marginBottom: "14px", textAlign: "center" }} />
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => { setShowDeleteModal(false); setDeleteConfirm(""); }} className="btn-glass" style={{ flex: 1 }}>Anulează</button>
              <button onClick={handleDeleteAccount} disabled={deleteConfirm !== "STERGE" || deleting}
                style={{ flex: 1, height: "44px", borderRadius: "var(--r-md)", border: "none", background: deleteConfirm === "STERGE" ? "var(--danger)" : "var(--glass-1)", color: deleteConfirm === "STERGE" ? "white" : "var(--text-muted)", fontSize: "14px", fontWeight: 700, fontFamily: "var(--font-display)", cursor: deleteConfirm === "STERGE" ? "pointer" : "not-allowed", transition: "all var(--t-fast)" }}>
                {deleting ? "Se șterge..." : "Șterge definitiv"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
