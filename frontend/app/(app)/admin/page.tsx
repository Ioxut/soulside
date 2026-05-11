"use client";

import { useEffect, useState, useRef, lazy, Suspense } from "react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { FileUp, FileText, Pencil, Trash2, AlertCircle } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import type { SourceDocument, ContentItem, Doctor, SpecialistRequest } from "@/types";

const RichTextEditor = lazy(() => import("@/app/components/ui/RichTextEditor"));

type Tab = "stats" | "documents" | "content" | "doctors" | "requests";

interface Stats {
  total_users: number;
  total_sessions: number;
  total_documents: number;
  total_content: number;
  pending_requests: number;
  mood_avg: number | null;
}

const TABS: { id: Tab; label: string }[] = [
  { id: "stats",     label: "Statistici" },
  { id: "documents", label: "Documente" },
  { id: "content",   label: "Conținut" },
  { id: "doctors",   label: "Specialiști" },
  { id: "requests",  label: "Cereri" },
];

const inp: React.CSSProperties = { width: "100%", height: "42px", padding: "0 12px", background: "var(--glass-input)", border: "1.5px solid var(--border)", borderRadius: "var(--r-md)", color: "var(--text-primary)", fontFamily: "var(--font-body)", fontSize: "14px", outline: "none", boxSizing: "border-box" };
const selStyle: React.CSSProperties = { ...inp, cursor: "pointer", appearance: "none" };

const CONTENT_FORM_DEFAULT = { type: "articol", title: "", description: "", category: "", author: "", read_time: "", url: "", content: "" };

const PREDEFINED_CATEGORIES = ["Anxietate", "Depresie", "Stres", "Somn", "Relații", "Mindfulness", "Dezvoltare personală", "Nutriție", "Sport", "Crize"];
const DOCTOR_FORM_DEFAULT  = { name: "", specialty: "", location: "", bio: "", photo_url: "", years_experience: "" };

export default function AdminPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("stats");
  const [stats, setStats] = useState<Stats | null>(null);
  const [docs, setDocs] = useState<SourceDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Content
  const [content, setContent] = useState<ContentItem[]>([]);
  const [showContentForm, setShowContentForm] = useState(false);
  const [editingContent, setEditingContent] = useState<ContentItem | null>(null);
  const [contentForm, setContentForm] = useState(CONTENT_FORM_DEFAULT);

  // Doctors
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [showDoctorForm, setShowDoctorForm] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [doctorForm, setDoctorForm] = useState(DOCTOR_FORM_DEFAULT);

  // Content PDF upload
  const contentFileRef = useRef<HTMLInputElement>(null);
  const [contentFile, setContentFile] = useState<File | null>(null);
  const [uploadingContent, setUploadingContent] = useState(false);

  // Requests
  const [requests, setRequests] = useState<SpecialistRequest[]>([]);
  const [requestDoctorFilter, setRequestDoctorFilter] = useState<number | "all">("all");
  const [requestDoctors, setRequestDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteDocId, setDeleteDocId] = useState<number | null>(null);
  const [reindexingId, setReindexingId] = useState<number | null>(null);
  const [reindexingAll, setReindexingAll] = useState(false);

  useEffect(() => {
    if (user && !user.is_admin) { router.replace("/dashboard"); }
  }, [user]);

  useEffect(() => { loadTab(); }, [tab]);

  const loadTab = async () => {
    setLoading(true);
    try {
      if (tab === "stats")     { const r = await api.get("/admin/stats");            setStats(r.data); }
      if (tab === "documents") { const r = await api.get("/admin/documents");        setDocs(r.data); }
      if (tab === "content")   { const r = await api.get("/content?limit=100");     setContent(r.data); }
      if (tab === "doctors")   { const r = await api.get("/specialists/doctors");    setDoctors(r.data); }
      if (tab === "requests")  {
        const [rr, dr] = await Promise.all([api.get("/specialists/requests"), api.get("/specialists/doctors")]);
        setRequests(rr.data); setRequestDoctors(dr.data);
      }
    } catch { toast.error("Nu s-au putut încărca datele"); }
    finally { setLoading(false); }
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.name.endsWith(".pdf")) { toast.error("Doar fișiere PDF"); return; }
    setUploading(true); setUploadProgress(0);
    const fd = new FormData(); fd.append("file", file);
    try {
      const { data } = await api.post("/admin/documents/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (pe) => setUploadProgress(Math.round((pe.loaded * 100) / (pe.total || 1))),
      });
      setDocs(prev => [data, ...prev]);
      toast.success(`${file.name} procesat · ${data.chunk_count} bucăți`);
    } catch (err: any) { toast.error(err.response?.data?.detail || "Eroare la upload"); }
    finally { setUploading(false); setUploadProgress(0); if (fileRef.current) fileRef.current.value = ""; }
  };

  const deleteDoc = async (id: number) => {
    try {
      await api.delete(`/admin/documents/${id}`);
      setDocs(prev => prev.filter(d => d.id !== id));
      toast.success("Document șters");
    } catch {}
    setDeleteDocId(null);
  };

  const reindexDoc = async (id: number, filename: string) => {
    setReindexingId(id);
    try {
      const { data } = await api.post(`/admin/documents/${id}/reindex`);
      toast.success(`${filename} re-indexat · ${data.reindexed} vectori regenerați`);
    } catch (err: any) { toast.error(err.response?.data?.detail || "Eroare la re-indexare"); }
    finally { setReindexingId(null); }
  };

  const reindexAll = async () => {
    setReindexingAll(true);
    try {
      const { data } = await api.post("/admin/documents/reindex-all");
      toast.success(`Re-indexare completă · ${data.reindexed} vectori regenerați`);
    } catch (err: any) { toast.error(err.response?.data?.detail || "Eroare la re-indexare"); }
    finally { setReindexingAll(false); }
  };

  const saveContent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let finalForm = { ...contentForm };
      // Upload PDF file first if selected
      if (contentForm.type === "pdf" && contentFile) {
        setUploadingContent(true);
        const fd = new FormData(); fd.append("file", contentFile);
        const { data: fileData } = await api.post("/admin/content/upload-file", fd, { headers: { "Content-Type": "multipart/form-data" } });
        finalForm = { ...finalForm, url: fileData.url };
        setUploadingContent(false);
      }
      if (editingContent) {
        const { data } = await api.patch(`/content/${editingContent.id}`, finalForm);
        setContent(prev => prev.map(c => c.id === editingContent.id ? data : c));
        toast.success("Actualizat");
      } else {
        const { data } = await api.post("/content", finalForm);
        setContent(prev => [data, ...prev]);
        toast.success("Adăugat");
      }
      setShowContentForm(false); setEditingContent(null); setContentForm(CONTENT_FORM_DEFAULT); setContentFile(null);
    } catch (err: any) { setUploadingContent(false); toast.error(err.response?.data?.detail || "Eroare"); }
  };

  const deleteContent = async (id: number) => {
    if (!confirm("Ștergi conținutul?")) return;
    await api.delete(`/content/${id}`).catch(() => {});
    setContent(prev => prev.filter(c => c.id !== id));
  };

  const saveDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...doctorForm, years_experience: parseInt(doctorForm.years_experience) || 0 };
    try {
      if (editingDoctor) {
        const { data } = await api.patch(`/specialists/doctors/${editingDoctor.id}`, payload);
        setDoctors(prev => prev.map(d => d.id === editingDoctor.id ? data : d));
        toast.success("Actualizat");
      } else {
        const { data } = await api.post("/specialists/doctors", payload);
        setDoctors(prev => [data, ...prev]);
        toast.success("Adăugat");
      }
      setShowDoctorForm(false); setEditingDoctor(null); setDoctorForm(DOCTOR_FORM_DEFAULT);
    } catch (err: any) { toast.error(err.response?.data?.detail || "Eroare"); }
  };

  const deleteDoctor = async (id: number) => {
    if (!confirm("Ștergi specialistul?")) return;
    await api.delete(`/specialists/doctors/${id}`).catch(() => {});
    setDoctors(prev => prev.filter(d => d.id !== id));
  };

  const openEditContent = (c: ContentItem) => {
    setEditingContent(c);
    setContentForm({ type: c.type, title: c.title, description: c.description, category: c.category, author: c.author, read_time: c.read_time, url: c.url || "", content: c.content || "" });
    setShowContentForm(true);
  };

  const openEditDoctor = (d: Doctor) => {
    setEditingDoctor(d);
    setDoctorForm({ name: d.name, specialty: d.specialty, location: d.location, bio: d.bio, photo_url: d.photo_url || "", years_experience: String(d.years_experience) });
    setShowDoctorForm(true);
  };

  const updateRequestStatus = async (id: number, status: string) => {
    try {
      const { data } = await api.patch(`/specialists/requests/${id}`, { status });
      setRequests(prev => prev.map(r => r.id === id ? data : r));
      toast.success("Status actualizat");
    } catch { toast.error("Eroare la actualizare"); }
  };

  const statusColor = (s: string) => s === "approved"
    ? { bg: "var(--success-bg)", border: "var(--success-border)", color: "var(--success)" }
    : s === "rejected"
    ? { bg: "var(--danger-bg)", border: "var(--danger-border)", color: "var(--danger)" }
    : { bg: "var(--glass-1)", border: "var(--border)", color: "var(--text-muted)" };

  return (
    <div style={{ padding: "clamp(16px,4vw,40px)", width: "100%" }}>

      {/* Header */}
      <div className="anim-fade-up" style={{ marginBottom: "24px" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(20px,4vw,28px)", color: "var(--text-primary)", letterSpacing: "-0.025em", marginBottom: "6px" }}>Panou admin</h1>
        <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>Gestionează baza de cunoștințe și conținutul platformei.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "24px", background: "var(--glass-1)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "4px", width: "fit-content", flexWrap: "wrap", maxWidth: "100%" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: "8px 14px", borderRadius: "var(--r-md)", border: "none", background: tab === t.id ? "var(--accent)" : "transparent", color: tab === t.id ? "white" : "var(--text-muted)", fontSize: "13px", fontFamily: "var(--font-display)", fontWeight: 600, cursor: "pointer", transition: "all var(--t-fast)", whiteSpace: "nowrap", boxShadow: tab === t.id ? "0 0 12px var(--accent-glow)" : "none" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── STATS TAB ── */}
      {tab === "stats" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: "16px" }}>
          {loading ? (
            [1,2,3,4,5,6].map(i => <div key={i} className="glass-card" style={{ height: "120px", animation: "pulse 1.5s ease-in-out infinite" }}/>)
          ) : stats ? (
            [
              { label: "Utilizatori",           desc: "conturi înregistrate",    value: stats.total_users,      color: "#8b5cf6" },
              { label: "Conversații AI",         desc: "sesiuni totale",          value: stats.total_sessions,   color: "#38bdf8" },
              { label: "Documente",              desc: "fișiere în baza RAG",     value: stats.total_documents,  color: "#34d399" },
              { label: "Resurse",                desc: "articole și ghiduri",     value: stats.total_content,    color: "#f97316" },
              { label: "Cereri în așteptare",    desc: "de la utilizatori",       value: stats.pending_requests, color: "#fbbf24" },
              { label: "Medie stare emoțională", desc: "scor mediu jurnal",       value: stats.mood_avg !== null ? `${stats.mood_avg}/10` : "—", color: "#f472b6" },
            ].map(({ label, desc, value, color }, i) => (
              <div key={label} className={`glass-card anim-fade-up delay-${i + 1}`} style={{ padding: "24px 20px", textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "36px", color, lineHeight: 1, marginBottom: "8px" }}>{value}</div>
                <div style={{ fontSize: "12px", fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--text-primary)", letterSpacing: "0.03em", textTransform: "uppercase", marginBottom: "4px" }}>{label}</div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{desc}</div>
              </div>
            ))
          ) : null}
        </div>
      )}

      {/* ── DOCUMENTS TAB ── */}
      {tab === "documents" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Upload zone */}
          <div className="glass-card"
            onClick={() => !uploading && fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files); }}
            style={{ padding: "clamp(28px,5vw,48px) 24px", textAlign: "center", cursor: "pointer", borderTop: `2px dashed ${dragOver ? "var(--accent)" : "var(--border-glow)"}`, borderLeft: `2px dashed ${dragOver ? "var(--accent)" : "var(--border-glow)"}`, borderRight: `2px dashed ${dragOver ? "var(--accent)" : "var(--border-glow)"}`, borderBottom: `2px dashed ${dragOver ? "var(--accent)" : "var(--border-glow)"}`, background: dragOver ? "var(--glass-active)" : "var(--glass-1)", transition: "all var(--t-normal)", borderRadius: "var(--r-xl)" }}
            onMouseEnter={e => { if (!uploading) { (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)"; (e.currentTarget as HTMLElement).style.background = "var(--glass-hover)"; }}}
            onMouseLeave={e => { if (!dragOver) { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-glow)"; (e.currentTarget as HTMLElement).style.background = "var(--glass-1)"; }}}>
            <input ref={fileRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={e => handleUpload(e.target.files)}/>
            {uploading ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                <span className="spinner spinner-lg" style={{ color: "var(--accent)" }} />
                <div style={{ fontSize: "15px", fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>Se procesează… {uploadProgress}%</div>
                <div style={{ width: "180px", height: "4px", background: "var(--glass-2)", borderRadius: "var(--r-full)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${uploadProgress}%`, background: "var(--accent)", borderRadius: "var(--r-full)", transition: "width var(--t-fast)" }}/>
                </div>
              </div>
            ) : (
              <>
                <FileUp width={36} height={36} stroke="var(--accent-light)" strokeWidth={1.4} style={{ marginBottom: "12px", opacity: 0.7 }} />
                <div style={{ fontSize: "15px", fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--text-primary)", marginBottom: "6px" }}>
                  Trage PDF-ul aici sau <span style={{ color: "var(--accent-light)", textDecoration: "underline" }}>alege fișier</span>
                </div>
                <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>Suportă fișiere PDF · Max 50MB</div>
              </>
            )}
          </div>

          {/* Table */}
          <div className="glass-card" style={{ overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
              <h2 className="section-title" style={{ marginBottom: 0 }}>Documente active ({docs.length})</h2>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  onClick={reindexAll}
                  disabled={reindexingAll}
                  style={{ padding: "5px 14px", borderRadius: "var(--r-md)", border: "1px solid var(--accent)", background: "transparent", color: "var(--accent)", fontSize: "12px", fontFamily: "var(--font-display)", fontWeight: 700, cursor: reindexingAll ? "not-allowed" : "pointer", opacity: reindexingAll ? 0.6 : 1, whiteSpace: "nowrap" }}
                >
                  {reindexingAll ? "Se procesează..." : "Reindexează tot"}
                </button>
                <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--success)" }}/>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-display)", fontWeight: 600 }}>
                  {docs.reduce((a, d) => a + (d.chunk_count || 0), 0)} vectori totali
                </span>
              </div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "420px" }}>
                <thead>
                  <tr style={{ background: "rgba(139,92,246,0.04)" }}>
                    {["Document","Vectori","Adăugat",""].map(h => (
                      <th key={h} style={{ padding: "10px 16px", textAlign: h === "" ? "center" : "left", fontSize: "11px", fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? [1,2,3].map(i => (
                    <tr key={i}><td colSpan={4} style={{ padding: "14px 16px" }}><div style={{ height: "18px", background: "var(--glass-1)", borderRadius: "var(--r-sm)", animation: "pulse 1.5s ease-in-out infinite" }}/></td></tr>
                  )) : docs.map(d => (
                    <tr key={d.id} style={{ borderBottom: "1px solid rgba(139,92,246,0.06)", transition: "background var(--t-fast)" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--glass-1)"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <FileText size={15} color="var(--accent-light)" strokeWidth={1.6} />
                          <span style={{ fontSize: "13px", fontWeight: 600, fontFamily: "var(--font-display)", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "clamp(120px,30vw,300px)" }}>{d.filename}</span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ display: "inline-flex", padding: "2px 9px", borderRadius: "var(--r-full)", background: "var(--success-bg)", border: "1px solid var(--success-border)", fontSize: "12px", fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--success)", whiteSpace: "nowrap" }}>{d.chunk_count} chunks</span>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: "12px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{format(new Date(d.uploaded_at), "dd MMM yyyy, HH:mm")}</td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                        <button
                          onClick={() => reindexDoc(d.id, d.filename)}
                          disabled={reindexingId === d.id}
                          title="Regenerează vectorii pentru acest document"
                          style={{ padding: "4px 12px", borderRadius: "var(--r-md)", border: "1px solid var(--accent)", background: "transparent", color: "var(--accent)", fontSize: "12px", fontFamily: "var(--font-display)", fontWeight: 700, cursor: reindexingId === d.id ? "not-allowed" : "pointer", opacity: reindexingId === d.id ? 0.6 : 1, whiteSpace: "nowrap" }}
                        >
                          {reindexingId === d.id ? "..." : "Reindex"}
                        </button>
                        <button onClick={() => setDeleteDocId(d.id)} style={{ padding: "4px 12px", borderRadius: "var(--r-md)", border: "1px solid var(--danger-border)", background: "transparent", color: "var(--danger)", fontSize: "12px", fontFamily: "var(--font-display)", fontWeight: 700, cursor: "pointer", transition: "all var(--t-fast)", whiteSpace: "nowrap" }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--danger-bg)"}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                          Șterge
                        </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!loading && docs.length === 0 && (
                    <tr><td colSpan={4} style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>Niciun document încărcat</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── CONTENT TAB ── */}
      {tab === "content" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Add / form toggle */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button className={showContentForm && !editingContent ? "btn-glass" : "btn-primary"} style={{ height: "40px", padding: "0 18px", fontSize: "14px" }}
              onClick={() => {
                if (showContentForm && !editingContent) { setShowContentForm(false); }
                else { setEditingContent(null); setContentForm(CONTENT_FORM_DEFAULT); setShowContentForm(true); }
              }}>
              {showContentForm && !editingContent ? "✕ Anulează" : "+ Adaugă conținut"}
            </button>
          </div>

          {/* Inline form — dynamic per type */}
          {showContentForm && (
            <div className="glass-card anim-fade-up" style={{ padding: "24px" }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "15px", color: "var(--text-primary)", marginBottom: "18px" }}>
                {editingContent ? "Editează conținut" : "Conținut nou"}
              </h3>
              <form onSubmit={saveContent} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {/* Type selector — always shown */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "12px" }}>
                  <div>
                    <label className="field-label">Tip</label>
                    <select value={contentForm.type} onChange={e => { setContentForm({ ...CONTENT_FORM_DEFAULT, type: e.target.value }); setContentFile(null); }} style={selStyle}>
                      <option value="articol">Articol (scris)</option>
                      <option value="articol_extern">Articol extern (link)</option>
                      <option value="video">Video (URL)</option>
                      <option value="ghid">Ghid extern (link)</option>
                      <option value="pdf">PDF (fișier)</option>
                    </select>
                  </div>
                  <div>
                    <label className="field-label">Categorie</label>
                    <select
                      value={PREDEFINED_CATEGORIES.includes(contentForm.category) ? contentForm.category : (contentForm.category === "" ? "" : "__custom__")}
                      onChange={e => setContentForm({ ...contentForm, category: e.target.value === "__custom__" ? "" : e.target.value })}
                      required={PREDEFINED_CATEGORIES.includes(contentForm.category) || contentForm.category !== ""}
                      style={selStyle}>
                      <option value="">Alege categorie…</option>
                      {PREDEFINED_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      <option value="__custom__">Altele…</option>
                    </select>
                    {(!PREDEFINED_CATEGORIES.includes(contentForm.category)) && (
                      <input value={contentForm.category} onChange={e => setContentForm({ ...contentForm, category: e.target.value })} placeholder="Denumire categorie…" required style={{ ...inp, marginTop: "8px" }}/>
                    )}
                  </div>
                </div>

                {/* Title — always shown */}
                <div>
                  <label className="field-label">Titlu</label>
                  <input value={contentForm.title} onChange={e => setContentForm({ ...contentForm, title: e.target.value })} required style={inp}/>
                </div>

                {/* Description — always shown */}
                <div>
                  <label className="field-label">Descriere</label>
                  <textarea value={contentForm.description} onChange={e => setContentForm({ ...contentForm, description: e.target.value })} rows={3} required style={{ ...inp, height: "auto", padding: "10px 12px", resize: "vertical" }}/>
                </div>

                {/* VIDEO: just URL */}
                {contentForm.type === "video" && (
                  <div>
                    <label className="field-label">URL Video</label>
                    <input value={contentForm.url} onChange={e => setContentForm({ ...contentForm, url: e.target.value })} placeholder="https://youtube.com/..." required style={inp}/>
                  </div>
                )}

                {/* ARTICOL EXTERN / GHID: just URL */}
                {(contentForm.type === "articol_extern" || contentForm.type === "ghid") && (
                  <div>
                    <label className="field-label">URL {contentForm.type === "ghid" ? "Ghid" : "Articol"}</label>
                    <input value={contentForm.url} onChange={e => setContentForm({ ...contentForm, url: e.target.value })} placeholder="https://..." required style={inp}/>
                  </div>
                )}

                {/* PDF: file upload */}
                {contentForm.type === "pdf" && (
                  <div>
                    <label className="field-label">Fișier PDF</label>
                    <input ref={contentFileRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={e => setContentFile(e.target.files?.[0] ?? null)}/>
                    <div onClick={() => contentFileRef.current?.click()}
                      style={{ ...inp, height: "auto", padding: "10px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", color: contentFile ? "var(--text-primary)" : "var(--text-muted)" }}>
                      <FileUp size={14} strokeWidth={1.6} />
                      <span style={{ fontSize: "13px" }}>{contentFile ? contentFile.name : "Alege fișier PDF…"}</span>
                    </div>
                  </div>
                )}

                {/* ARTICOL (internal): author + read_time + full content */}
                {contentForm.type === "articol" && (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "12px" }}>
                      <div>
                        <label className="field-label">Autor</label>
                        <input value={contentForm.author} onChange={e => setContentForm({ ...contentForm, author: e.target.value })} required style={inp}/>
                      </div>
                      <div>
                        <label className="field-label">Timp citire <span style={{ fontWeight: 400, color: "var(--text-muted)", fontSize: "11px" }}>(opțional)</span></label>
                        <input value={contentForm.read_time} onChange={e => setContentForm({ ...contentForm, read_time: e.target.value })} placeholder="5 min" style={inp}/>
                      </div>
                    </div>
                    <div>
                      <label className="field-label">Conținut articol</label>
                      <Suspense fallback={<div style={{ ...inp, height: "200px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "13px" }}>Se încarcă editorul...</div>}>
                        <RichTextEditor
                          value={contentForm.content}
                          onChange={html => setContentForm(f => ({ ...f, content: html }))}
                          placeholder="Scrie conținutul articolului..."
                        />
                      </Suspense>
                    </div>
                  </>
                )}

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "4px" }}>
                  <button type="submit" disabled={uploadingContent} className="btn-primary" style={{ flex: 1, minWidth: "120px", height: "42px" }}>
                    {uploadingContent ? "Se încarcă..." : "Salvează"}
                  </button>
                  <button type="button" className="btn-glass" style={{ height: "42px", padding: "0 20px" }}
                    onClick={() => { setShowContentForm(false); setEditingContent(null); setContentForm(CONTENT_FORM_DEFAULT); setContentFile(null); }}>
                    Anulează
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Table */}
          <div className="glass-card" style={{ overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "520px" }}>
                <thead>
                  <tr style={{ background: "rgba(139,92,246,0.04)" }}>
                    {["Titlu","Tip","Categorie","Autor","Vizualizări",""].map(h => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: h === "" ? "center" : "left", fontSize: "11px", fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? [1,2,3].map(i => (
                    <tr key={i}><td colSpan={6} style={{ padding: "14px" }}><div style={{ height: "18px", background: "var(--glass-1)", borderRadius: "var(--r-sm)", animation: "pulse 1.5s ease-in-out infinite" }}/></td></tr>
                  )) : content.map(c => (
                    <tr key={c.id} style={{ borderBottom: "1px solid rgba(139,92,246,0.06)", transition: "background var(--t-fast)" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--glass-1)"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                      <td style={{ padding: "11px 14px", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</td>
                      <td style={{ padding: "11px 14px" }}>
                        <span style={{ padding: "2px 8px", borderRadius: "var(--r-full)", background: "var(--accent-subtle)", border: "1px solid var(--border-glow)", fontSize: "11px", fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--accent-light)" }}>{c.type}</span>
                      </td>
                      <td style={{ padding: "11px 14px", fontSize: "12px", color: "var(--text-muted)" }}>{c.category}</td>
                      <td style={{ padding: "11px 14px", fontSize: "12px", color: "var(--text-muted)" }}>{c.author}</td>
                      <td style={{ padding: "11px 14px", fontSize: "12px", color: "var(--text-muted)" }}>{c.views}</td>
                      <td style={{ padding: "11px 14px", textAlign: "center" }}>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                          <button onClick={() => openEditContent(c)}
                            style={{ width: "30px", height: "30px", borderRadius: "var(--r-sm)", border: "1px solid var(--border)", background: "var(--glass-1)", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all var(--t-fast)" }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--accent-light)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}>
                            <Pencil size={13} strokeWidth={1.8} />
                          </button>
                          <button onClick={() => deleteContent(c.id)}
                            style={{ width: "30px", height: "30px", borderRadius: "var(--r-sm)", border: "1px solid var(--border)", background: "var(--glass-1)", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all var(--t-fast)" }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--danger)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--danger-border)"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}>
                            <Trash2 size={13} strokeWidth={1.8} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!loading && content.length === 0 && (
                    <tr><td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>Niciun conținut adăugat</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── DOCTORS TAB ── */}
      {tab === "doctors" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Add / form toggle */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button className={showDoctorForm && !editingDoctor ? "btn-glass" : "btn-primary"} style={{ height: "40px", padding: "0 18px", fontSize: "14px" }}
              onClick={() => {
                if (showDoctorForm && !editingDoctor) { setShowDoctorForm(false); }
                else { setEditingDoctor(null); setDoctorForm(DOCTOR_FORM_DEFAULT); setShowDoctorForm(true); }
              }}>
              {showDoctorForm && !editingDoctor ? "✕ Anulează" : "+ Adaugă specialist"}
            </button>
          </div>

          {/* Inline form */}
          {showDoctorForm && (
            <div className="glass-card anim-fade-up" style={{ padding: "24px" }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "15px", color: "var(--text-primary)", marginBottom: "18px" }}>
                {editingDoctor ? "Editează specialist" : "Specialist nou"}
              </h3>
              <form onSubmit={saveDoctor} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label className="field-label">Nume complet</label>
                  <input value={doctorForm.name} onChange={e => setDoctorForm({ ...doctorForm, name: e.target.value })} required style={inp}/>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "12px" }}>
                  <div>
                    <label className="field-label">Specialitate</label>
                    <input value={doctorForm.specialty} onChange={e => setDoctorForm({ ...doctorForm, specialty: e.target.value })} required style={inp}/>
                  </div>
                  <div>
                    <label className="field-label">Locație</label>
                    <input value={doctorForm.location} onChange={e => setDoctorForm({ ...doctorForm, location: e.target.value })} required style={inp}/>
                  </div>
                </div>
                <div>
                  <label className="field-label">Bio</label>
                  <textarea value={doctorForm.bio} onChange={e => setDoctorForm({ ...doctorForm, bio: e.target.value })} rows={3} required style={{ ...inp, height: "auto", padding: "10px 12px", resize: "vertical" }}/>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "12px" }}>
                  <div>
                    <label className="field-label">Ani experiență</label>
                    <input type="number" value={doctorForm.years_experience} onChange={e => setDoctorForm({ ...doctorForm, years_experience: e.target.value })} required style={inp}/>
                  </div>
                  <div>
                    <label className="field-label">URL Foto (opțional)</label>
                    <input value={doctorForm.photo_url} onChange={e => setDoctorForm({ ...doctorForm, photo_url: e.target.value })} style={inp}/>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "4px" }}>
                  <button type="submit" className="btn-primary" style={{ flex: 1, minWidth: "120px", height: "42px" }}>Salvează</button>
                  <button type="button" className="btn-glass" style={{ height: "42px", padding: "0 20px" }}
                    onClick={() => { setShowDoctorForm(false); setEditingDoctor(null); setDoctorForm(DOCTOR_FORM_DEFAULT); }}>
                    Anulează
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Cards grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: "12px" }}>
            {loading ? [1,2,3].map(i => <div key={i} className="glass-card" style={{ height: "100px", animation: "pulse 1.5s ease-in-out infinite" }}/>) :
            doctors.map(d => {
              const initials = d.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
              return (
                <div key={d.id} className="glass-card" style={{ padding: "16px", display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <div style={{ width: "42px", height: "42px", borderRadius: "var(--r-md)", background: "var(--accent-subtle)", border: "1px solid var(--border-glow)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "15px", color: "var(--accent-light)", flexShrink: 0 }}>{initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "14px", fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--text-primary)", marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</div>
                    <div style={{ fontSize: "12px", color: "var(--accent-light)", marginBottom: "2px" }}>{d.specialty}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{d.location} · {d.years_experience}y</div>
                  </div>
                  <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                    <button onClick={() => openEditDoctor(d)}
                      style={{ width: "28px", height: "28px", borderRadius: "var(--r-sm)", border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all var(--t-fast)" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--accent-light)"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"}>
                      <Pencil size={12} strokeWidth={1.8} />
                    </button>
                    <button onClick={() => deleteDoctor(d.id)}
                      style={{ width: "28px", height: "28px", borderRadius: "var(--r-sm)", border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all var(--t-fast)" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--danger)"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"}>
                      <Trash2 size={12} strokeWidth={1.8} />
                    </button>
                  </div>
                </div>
              );
            })}
            {!loading && doctors.length === 0 && <p style={{ gridColumn: "1/-1", textAlign: "center", color: "var(--text-muted)", fontSize: "14px", padding: "32px 0" }}>Niciun specialist adăugat</p>}
          </div>
        </div>
      )}

      {/* ── REQUESTS TAB ── */}
      {tab === "requests" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Doctor filter */}
          {requestDoctors.length > 0 && (
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-display)", fontWeight: 600 }}>Filtru doctor:</span>
              {[{ id: "all" as const, name: "Toți" }, ...requestDoctors].map(d => (
                <button key={d.id} onClick={() => setRequestDoctorFilter(d.id as number | "all")}
                  style={{ padding: "4px 12px", borderRadius: "var(--r-full)", border: `1px solid ${requestDoctorFilter === d.id ? "var(--accent)" : "var(--border)"}`, background: requestDoctorFilter === d.id ? "var(--glass-active)" : "transparent", color: requestDoctorFilter === d.id ? "var(--text-primary)" : "var(--text-muted)", fontSize: "12px", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 600, transition: "all var(--t-fast)", whiteSpace: "nowrap" }}>
                  {d.name}
                </button>
              ))}
            </div>
          )}
        <div className="glass-card" style={{ overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
              <thead>
                <tr style={{ background: "rgba(139,92,246,0.04)" }}>
                  {["Utilizator","Email","Doctor","Data preferată","Mesaj","Trimis la","Status"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: "11px", fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? [1,2,3].map(i => (
                  <tr key={i}><td colSpan={7} style={{ padding: "14px" }}><div style={{ height: "18px", background: "var(--glass-1)", borderRadius: "var(--r-sm)", animation: "pulse 1.5s ease-in-out infinite" }}/></td></tr>
                )) : requests
                    .filter(r => requestDoctorFilter === "all" || r.doctor_id === requestDoctorFilter)
                    .map(r => {
                  const sc = statusColor(r.status);
                  return (
                    <tr key={r.id} style={{ borderBottom: "1px solid rgba(139,92,246,0.06)", transition: "background var(--t-fast)" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--glass-1)"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                      <td style={{ padding: "11px 14px", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap" }}>{r.name}</td>
                      <td style={{ padding: "11px 14px", fontSize: "12px", color: "var(--text-muted)" }}>{r.email}</td>
                      <td style={{ padding: "11px 14px", fontSize: "12px", color: "var(--accent-light)", fontWeight: 600, whiteSpace: "nowrap" }}>{r.doctor_name ?? "—"}</td>
                      <td style={{ padding: "11px 14px", fontSize: "12px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{r.preferred_date}</td>
                      <td style={{ padding: "11px 14px", fontSize: "12px", color: "var(--text-muted)", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.message}</td>
                      <td style={{ padding: "11px 14px", fontSize: "11px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{format(new Date(r.created_at), "dd MMM, HH:mm")}</td>
                      <td style={{ padding: "11px 14px" }}>
                        <select value={r.status} onChange={e => updateRequestStatus(r.id, e.target.value)}
                          style={{ padding: "4px 10px", borderRadius: "var(--r-md)", border: `1px solid ${sc.border}`, background: sc.bg, color: sc.color, fontSize: "12px", fontFamily: "var(--font-display)", fontWeight: 700, cursor: "pointer", outline: "none" }}>
                          <option value="pending">În așteptare</option>
                          <option value="approved">Aprobată</option>
                          <option value="rejected">Respinsă</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
                {!loading && requests.filter(r => requestDoctorFilter === "all" || r.doctor_id === requestDoctorFilter).length === 0 && (
                  <tr><td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>Nicio cerere primită</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      )}

      {/* Delete doc confirm modal */}
      {deleteDocId !== null && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
          <div className="glass-card-raised anim-scale-in" style={{ maxWidth: "380px", width: "100%", padding: "28px", textAlign: "center" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--danger-bg)", border: "1px solid var(--danger-border)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <AlertCircle size={20} color="var(--danger)" strokeWidth={1.8} />
            </div>
            <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "17px", color: "var(--text-primary)", marginBottom: "10px" }}>Ștergi documentul?</h3>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "20px", lineHeight: 1.6 }}>Toți vectorii asociați vor fi eliminați din baza de cunoștințe.</p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setDeleteDocId(null)} className="btn-glass" style={{ flex: 1 }}>Anulează</button>
              <button onClick={() => deleteDoc(deleteDocId)} style={{ flex: 1, height: "44px", borderRadius: "var(--r-md)", border: "none", background: "var(--danger)", color: "white", fontSize: "14px", fontWeight: 700, fontFamily: "var(--font-display)", cursor: "pointer" }}>Șterge</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
