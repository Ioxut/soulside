"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { MessageCircle } from "lucide-react";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { formatTime } from "@/lib/utils";
import type { ChatSession, ChatMessage } from "@/types";

const API_URL = "/api";

const SUGGESTIONS = [
  "Mă simt anxios și nu știu de ce",
  "Ajută-mă să mă relaxez",
  "Am nevoie să vorbesc cu cineva",
  "Tehnici de respirație",
  "Nu reușesc să dorm",
];

type Source = { filename: string; page: number };

export default function ChatPage() {
  const { user } = useAuthStore();
  const params = useSearchParams();
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [streamReady, setStreamReady] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [msgSources, setMsgSources] = useState<Record<number, Source[]>>({});
  const [listening, setListening] = useState(false);
  const [speakingId, setSpeakingId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    const load = () => { voicesRef.current = synth.getVoices(); };
    load();
    synth.addEventListener?.("voiceschanged", load);
    return () => synth.removeEventListener?.("voiceschanged", load);
  }, []);

  useEffect(() => {
    const sid = params.get("session");
    if (!sid) return;
    api.get(`/chat/sessions?skip=0&limit=50`)
      .then(r => {
        const s = r.data.find((s: ChatSession) => String(s.id) === sid);
        if (s) loadMessages(s);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamText]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 140) + "px";
    }
  }, [input]);

  const wasStreamingRef = useRef(false);
  useEffect(() => {
    if (wasStreamingRef.current && !streaming) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    wasStreamingRef.current = streaming;
  }, [streaming]);

  const loadMessages = async (session: ChatSession) => {
    setActiveSession(session);
    setLoadingMessages(true);
    try {
      const { data } = await api.get(`/chat/sessions/${session.id}/messages`);
      setMessages(data);
      const sourcesMap: Record<number, Source[]> = {};
      for (const msg of data) {
        if (msg.sources && msg.sources.length > 0) {
          sourcesMap[msg.id] = msg.sources;
        }
      }
      setMsgSources(sourcesMap);
    } catch { toast.error("Nu s-au putut încărca mesajele"); }
    finally { setLoadingMessages(false); }
  };

  const sendWithText = async (text: string) => {
    if (!text.trim() || streaming) return;
    setInput("");
    setStreaming(true);
    setStreamText("");
    setStreamReady(false);

    let currentSession = activeSession;
    if (!currentSession) {
      try {
        const { data } = await api.post("/chat/sessions", { title: "Conversație nouă" });
        setActiveSession(data);
        currentSession = data;
      } catch {
        toast.error("Nu s-a putut crea sesiunea");
        setStreaming(false);
        return;
      }
    }

    const userMsg: ChatMessage = {
      id: crypto.randomUUID() as any,
      session_id: currentSession!.id,
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const streamBody = JSON.stringify({ session_id: currentSession!.id, message: text });
      let response = await fetch(`${API_URL}/rag/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: streamBody,
      });
      if (response.status === 401) {
        const refreshed = await fetch(`${API_URL}/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });
        if (!refreshed.ok) { window.location.href = "/login"; return; }
        response = await fetch(`${API_URL}/rag/chat/stream`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: streamBody,
        });
      }
      if (!response.ok) throw new Error("Stream failed");
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let full = "";
      let sseBuffer = "";
      let doneProcessed = false;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        sseBuffer += decoder.decode(value, { stream: true });
        const lines = sseBuffer.split("\n");
        sseBuffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (!payload) continue;
          try {
            const evt = JSON.parse(payload);
            if (evt.error) {
              toast.error("Eroare la generarea răspunsului. Încearcă din nou.");
              setStreamText(""); setStreamReady(false); setStreaming(false);
              return;
            }
            if (evt.token) {
              full += evt.token;
              setStreamText(full);
              setStreamReady(true);
            }
            if (evt.done) {
              doneProcessed = true;
              const finalFull = full;
              const capturedSession = currentSession!;
              const capturedSources: Source[] = Array.isArray(evt.sources) ? evt.sources : [];
              const realId: number = evt.message_id;
              setMessages(prev => [...prev, {
                id: realId,
                session_id: capturedSession.id,
                role: "assistant",
                content: finalFull,
                created_at: new Date().toISOString(),
              }]);
              if (capturedSources.length > 0) {
                setMsgSources(prev => ({ ...prev, [realId]: capturedSources }));
              }
              setStreamText("");
              setStreamReady(false);
              setStreaming(false);
              api.get(`/chat/sessions/${capturedSession.id}`)
                .then(r => setActiveSession(r.data))
                .catch(() => {});
            }
          } catch {}
        }
      }
      if (!doneProcessed) {
        if (full.trim()) {
          const msgId = crypto.randomUUID() as any;
          setMessages(prev => [...prev, {
            id: msgId,
            session_id: currentSession!.id,
            role: "assistant",
            content: full,
            created_at: new Date().toISOString(),
          }]);
        } else {
          toast.error("Nu am primit niciun răspuns. Încearcă din nou.");
        }
        setStreamText("");
        setStreamReady(false);
        setStreaming(false);
      }
    } catch {
      toast.error("Eroare la trimiterea mesajului");
      setStreamText("");
      setStreamReady(false);
      setStreaming(false);
    }
  };

  const sendMessage = () => sendWithText(input);

  const toggleListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast.error("Browser-ul nu suportă recunoaștere vocală. Încearcă Chrome sau Edge."); return; }
    if (listening) { recognitionRef.current?.stop(); setListening(false); return; }
    const rec = new SR();
    rec.lang = "ro-RO"; rec.continuous = false; rec.interimResults = true;
    rec.onresult = (e: any) => {
      const transcript = Array.from(e.results).map((r: any) => r[0].transcript).join("");
      setInput(transcript);
    };
    rec.onend = () => setListening(false);
    rec.onerror = (e: any) => {
      if (e.error === "not-allowed") {
        toast.error("Accesul la microfon a fost refuzat. Permite accesul în setările browserului.");
      } else if (e.error === "no-speech") {
        toast("Nu am detectat nicio voce. Încearcă din nou.", { icon: "🎤" });
      } else {
        toast.error("Eroare la microfon: " + e.error);
      }
      setListening(false);
    };
    recognitionRef.current = rec;
    try { rec.start(); setListening(true); } catch { toast.error("Nu s-a putut porni microfonul."); }
  }, [listening]);

  const toggleSpeak = (msg: ChatMessage) => {
    if (speakingId === msg.id) { window.speechSynthesis.cancel(); setSpeakingId(null); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(msg.content);
    u.lang = "ro-RO";
    const voices = voicesRef.current.length ? voicesRef.current : window.speechSynthesis.getVoices();
    const roVoices = voices.filter(v => v.lang?.toLowerCase().startsWith("ro"));
    const ro = roVoices.find(v => !v.localService) || roVoices[0];
    if (ro) {
      u.voice = ro;
    } else {
      toast("Nu există o voce românească în acest browser. Pentru cea mai bună calitate, folosește Chrome sau instalează pachetul de limbă română.");
    }
    u.rate = 0.95;
    u.onend = () => setSpeakingId(null);
    window.speechSynthesis.speak(u);
    setSpeakingId(msg.id);
  };

  const newChat = () => {
    setActiveSession(null);
    setMessages([]);
    setMsgSources({});
    setStreamText("");
    setStreamReady(false);
  };


  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>

      <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "10px", flexShrink: 0, background: "rgba(11,10,30,0.5)", backdropFilter: "blur(16px)", zIndex: 5 }}>
        <img src="/logo.png" alt="SoulSide" style={{ width: "28px", height: "28px", borderRadius: "var(--r-md)", objectFit: "cover", flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: "13px", fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--text-primary)", margin: 0 }}>SoulSide</p>
          {activeSession && (
            <p style={{ fontSize: "11px", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>
              {activeSession.title}
            </p>
          )}
        </div>
        <button onClick={newChat} className="btn-primary" style={{ height: "40px", padding: "0 18px", fontSize: "14px" }}>
          <MessageCircle size={16} /> Chat nou
        </button>
      </div>

      <div role="log" aria-live="polite" style={{ flex: 1, overflowY: "auto", padding: "20px 16px", display: "flex", flexDirection: "column" }}>

        {!activeSession && messages.length === 0 ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "20px", maxWidth: "480px", margin: "0 auto", width: "100%", paddingBottom: "40px" }}>
            <img src="/logo.png" alt="SoulSide" style={{ width: "56px", height: "56px", borderRadius: "var(--r-xl)", objectFit: "cover", animation: "orbPulse 2.5s ease-in-out infinite" }} />
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "16px", fontWeight: 800, fontFamily: "var(--font-display)", color: "var(--text-primary)", marginBottom: "6px" }}>Bună, {user?.name}!</p>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.6 }}>Sunt SoulSide, companionul tău AI. Cum te simți azi?</p>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "7px", justifyContent: "center" }}>
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => sendWithText(s)}
                  style={{ padding: "6px 14px", borderRadius: "var(--r-full)", border: "1px solid var(--border)", background: "var(--glass-1)", color: "var(--text-secondary)", fontSize: "12px", fontFamily: "var(--font-display)", fontWeight: 600, cursor: "pointer", transition: "all var(--t-fast)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-hover)"; (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"; (e.currentTarget as HTMLElement).style.background = "var(--glass-2)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; (e.currentTarget as HTMLElement).style.background = "var(--glass-1)"; }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : loadingMessages ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", maxWidth: "720px", margin: "0 auto", width: "100%" }}>
            {[1,2,3].map(i => <div key={i} className="glass-card" style={{ height: "60px", borderRadius: "var(--r-lg)", animation: "pulse 1.5s ease-in-out infinite" }} />)}
          </div>
        ) : (
          <div style={{ maxWidth: "720px", margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: "16px" }}>
            {messages.map(msg => {
              const isUser = msg.role === "user";
              const sources = msgSources[msg.id];
              return (
                <div key={msg.id} className="anim-fade-up" style={{ display: "flex", gap: "10px", alignItems: "flex-start", flexDirection: isUser ? "row-reverse" : "row" }}>
                  {isUser ? (
                    <div style={{ width: "28px", height: "28px", borderRadius: "var(--r-md)", flexShrink: 0, marginTop: "2px", background: "var(--glass-active)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800, color: "var(--accent-light)", overflow: "hidden" }}>
                      {user?.avatar_url
                        ? <img src={user.avatar_url} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { (e.currentTarget as HTMLElement).style.display = "none"; }} />
                        : user?.name?.[0]?.toUpperCase() ?? "U"}
                    </div>
                  ) : (
                    <img src="/logo.png" alt="SoulSide" style={{ width: "28px", height: "28px", borderRadius: "var(--r-md)", objectFit: "cover", flexShrink: 0, marginTop: "2px" }} />
                  )}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start", gap: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-display)", fontWeight: 600 }}>{isUser ? "Tu" : "SoulSide"}</span>
                      <span style={{ fontSize: "10px", color: "var(--text-muted)", opacity: 0.6 }}>{formatTime(msg.created_at)}</span>
                      {!isUser && (
                        <button onClick={() => toggleSpeak(msg)} title={speakingId === msg.id ? "Oprește" : "Ascultă"}
                          style={{ width: "18px", height: "18px", borderRadius: "50%", border: "1px solid var(--border)", background: speakingId === msg.id ? "var(--accent-subtle)" : "transparent", color: speakingId === msg.id ? "var(--accent-light)" : "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all var(--t-fast)" }}>
                          <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M2 4h2.5L7 2v8L4.5 8H2V4z"/><path d="M9 4a3 3 0 010 4"/></svg>
                        </button>
                      )}
                    </div>
                    <div style={{ maxWidth: "min(76%,520px)", padding: "11px 15px", borderRadius: isUser ? "15px 4px 15px 15px" : "4px 15px 15px 15px", fontSize: "14px", lineHeight: "1.75", background: isUser ? "rgba(139,92,246,0.18)" : "var(--glass-2)", border: `1px solid ${isUser ? "var(--border-glow)" : "var(--border)"}`, color: "var(--text-primary)", wordBreak: "break-word" }}>
                      {isUser ? msg.content : <div className="md-chat"><ReactMarkdown>{msg.content}</ReactMarkdown></div>}
                    </div>
                    {!isUser && sources && sources.length > 0 && (
                      <div style={{ maxWidth: "min(76%,520px)", marginTop: "5px", padding: "8px 12px", borderRadius: "8px", background: "rgba(139,92,246,0.05)", border: "1px solid rgba(139,92,246,0.15)" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent)", fontFamily: "var(--font-display)", letterSpacing: "0.02em" }}>Surse</span>
                        <div style={{ marginTop: "4px", display: "flex", flexDirection: "column", gap: "2px" }}>
                          {sources.map((s, i) => (
                            <span key={i} style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                              {s.filename.replace(/\.(pdf|docx|txt)$/i, "").replace(/_/g, " ")}
                              {s.page ? `, p. ${s.page}` : ""}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {streaming && (
              <div className="anim-fade-up" style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <img src="/logo.png" alt="SoulSide" style={{ width: "28px", height: "28px", borderRadius: "var(--r-md)", objectFit: "cover", flexShrink: 0, marginTop: "2px", animation: "orbPulse 1.5s ease-in-out infinite" }} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-display)", fontWeight: 600 }}>SoulSide</span>
                  {streamReady ? (
                    <div style={{ maxWidth: "min(76%,520px)", padding: "11px 15px", borderRadius: "4px 15px 15px 15px", fontSize: "14px", lineHeight: "1.75", background: "var(--glass-2)", border: "1px solid var(--border)", color: "var(--text-primary)", wordBreak: "break-word", animation: "fadeInUp 0.3s ease forwards" }}>
                      <div className="md-chat"><ReactMarkdown>{streamText}</ReactMarkdown></div>
                    </div>
                  ) : (
                    <div style={{ padding: "12px 18px", borderRadius: "4px 15px 15px 15px", background: "var(--glass-2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span className="text-shimmer" style={{ fontSize: "13px", fontFamily: "var(--font-display)", fontWeight: 600, letterSpacing: "0.02em" }}>
                        SoulSide se gândește...
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div ref={messagesEndRef} aria-hidden />
      </div>

      <div style={{ padding: "12px 16px 14px", flexShrink: 0, borderTop: "1px solid var(--border)" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto", display: "flex", alignItems: "flex-end", gap: "8px", padding: "10px 14px", background: "rgba(139,92,246,0.05)", backdropFilter: "blur(24px)", border: `1.5px solid ${listening ? "rgba(248,113,113,0.4)" : "var(--border)"}`, borderRadius: "var(--r-2xl)", transition: "border-color var(--t-fast)" }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder={listening ? "Ascult..." : "Mesaj pentru SoulSide..."}
            disabled={streaming}
            rows={1}
            style={{ flex: 1, resize: "none", outline: "none", border: "none", background: "transparent", color: "var(--text-primary)", fontFamily: "var(--font-body)", fontSize: "14px", lineHeight: "1.6", minHeight: "24px", maxHeight: "140px", overflowY: "auto" }}
          />
          <div style={{ display: "flex", gap: "6px", alignItems: "center", flexShrink: 0 }}>
            <button onClick={toggleListening} aria-label={listening ? "Oprește" : "Vorbește"}
              style={{ width: "32px", height: "32px", borderRadius: "50%", border: `1px solid ${listening ? "rgba(248,113,113,0.5)" : "var(--border)"}`, background: listening ? "rgba(248,113,113,0.12)" : "transparent", color: listening ? "var(--danger)" : "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all var(--t-fast)" }}>
              <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <rect x="7" y="2" width="6" height="10" rx="3"/>
                <path d="M4 10a6 6 0 0012 0"/>
                <line x1="10" y1="16" x2="10" y2="19"/>
              </svg>
            </button>
            <button onClick={sendMessage} disabled={!input.trim() || streaming} aria-label="Trimite"
              style={{ width: "32px", height: "32px", borderRadius: "var(--r-md)", border: "none", background: (input.trim() && !streaming) ? "var(--accent)" : "rgba(139,92,246,0.1)", color: (input.trim() && !streaming) ? "white" : "var(--text-muted)", cursor: (input.trim() && !streaming) ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: (input.trim() && !streaming) ? "0 0 14px var(--accent-glow)" : "none", transition: "all var(--t-fast)" }}>
              {streaming
                ? <span className="spinner spinner-sm" style={{ marginRight: 0 }} />
                : <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17 10L3 4l3 6-3 6z"/><path d="M6 10h6"/></svg>
              }
            </button>
          </div>
        </div>
        <p style={{ textAlign: "center", fontSize: "11px", color: "var(--text-muted)", marginTop: "7px", opacity: 0.45 }}>
          SoulSide poate face greșeli. Verifică întotdeauna sursele citate.
        </p>
      </div>
    </div>
  );
}
