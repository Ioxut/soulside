"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import {
  House, MessageCircle, Clock, NotebookPen, BookOpen,
  TriangleAlert, Stethoscope, Settings, Info, LogOut, Menu, X,
} from "lucide-react";

const NAV_MAIN = [
  { href: "/dashboard", label: "Acasă", Icon: House },
  { href: "/chat", label: "Chat AI", Icon: MessageCircle },
  { href: "/chat-history", label: "Istoric chat", Icon: Clock },
  { href: "/mood", label: "Jurnal", Icon: NotebookPen },
  { href: "/resources", label: "Resurse", Icon: BookOpen },
  { href: "/urgenta", label: "Urgență", Icon: TriangleAlert },
  { href: "/specialists", label: "Specialiști", Icon: Stethoscope },
];
const NAV_BOTTOM = [
  { href: "/settings", label: "Setări", Icon: Settings },
  { href: "/about", label: "Despre", Icon: Info },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/chat") return pathname === "/chat" || (pathname.startsWith("/chat") && !pathname.startsWith("/chat-history"));
  return pathname === href || pathname.startsWith(href + "/");
}

function NavItem({ href, label, Icon, active, onNavigate }: {
  href: string; label: string; Icon: React.ComponentType<{ size?: number }>;
  active: boolean; onNavigate?: () => void;
}) {
  return (
    <Link href={href} style={{ textDecoration: "none", display: "block" }} onClick={onNavigate}>
      <div role="menuitem" aria-current={active ? "page" : undefined} style={{
        display: "flex", alignItems: "center", gap: "12px",
        padding: "10px 14px", margin: "1px 8px", borderRadius: "var(--r-lg)",
        background: active ? "var(--glass-active)" : "transparent",
        color: active ? "var(--text-primary)" : "var(--text-muted)",
        cursor: "pointer", transition: "all var(--t-fast)",
        minHeight: "42px", width: "calc(100% - 16px)",
        borderLeft: active ? "2px solid var(--accent)" : "2px solid transparent",
        boxShadow: active ? "inset 0 0 20px rgba(139,92,246,0.08)" : "none",
      }}
        onMouseEnter={e => { if (!active) { const el = e.currentTarget as HTMLElement; el.style.background = "var(--glass-hover)"; el.style.color = "var(--text-primary)"; } }}
        onMouseLeave={e => { if (!active) { const el = e.currentTarget as HTMLElement; el.style.background = "transparent"; el.style.color = "var(--text-muted)"; } }}>
        <span style={{ flexShrink: 0, color: active ? "var(--accent-light)" : "currentColor", display: "flex" }}><Icon size={18} /></span>
        <span style={{ fontSize: "14px", fontFamily: "var(--font-display)", fontWeight: active ? 700 : 500, whiteSpace: "nowrap" }}>{label}</span>
        {active && <div style={{ marginLeft: "auto", width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent)", boxShadow: "0 0 8px var(--accent)", flexShrink: 0 }} />}
      </div>
    </Link>
  );
}

function SidebarContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    try { await api.post("/auth/logout"); } catch { }
    logout();
    router.replace("/login");
    onNavigate?.();
  };

  const initials = user?.name
    ? user.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <a href="/" style={{ display: "flex", alignItems: "center", gap: "10px", padding: "18px 20px", minHeight: "68px", borderBottom: "1px solid var(--border)", flexShrink: 0, textDecoration: "none" }}>
        <img src="/logo.png" alt="SoulSide" style={{ width: "34px", height: "34px", borderRadius: "var(--r-md)", flexShrink: 0, objectFit: "cover" }} />
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "16px", color: "var(--text-primary)", letterSpacing: "-0.02em", lineHeight: 1 }}>SoulSide</div>
          <div style={{ fontSize: "9px", color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: "2px", fontFamily: "var(--font-display)", fontWeight: 600 }}>Prim ajutor mental</div>
        </div>
      </a>

      <button onClick={() => { router.push("/settings"); onNavigate?.(); }} style={{ margin: "14px 16px 4px", padding: "10px 12px", borderRadius: "var(--r-lg)", background: "var(--glass-1)", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "10px", flexShrink: 0, cursor: "pointer", transition: "all var(--t-fast)", textAlign: "left" }}
        onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = "var(--glass-hover)"; el.style.borderColor = "var(--border-hover)"; }}
        onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = "var(--glass-1)"; el.style.borderColor = "var(--border)"; }}>
        <div style={{ width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg, rgba(139,92,246,0.3), rgba(109,40,217,0.2))", border: "1px solid var(--border-strong)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent-light)", fontSize: "11px", fontWeight: 800, fontFamily: "var(--font-display)", overflow: "hidden" }}>
          {user?.avatar_url
            ? <img src={user.avatar_url} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { (e.currentTarget as HTMLElement).style.display = "none"; }} />
            : initials}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: "13px", fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name || "Utilizator"}</div>
          <div style={{ fontSize: "10px", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email || ""}</div>
        </div>
      </button>

      <nav style={{ flex: 1, overflowY: "auto", padding: "4px 0" }}>
        {NAV_MAIN.map(item => (
          <NavItem key={item.href} {...item} active={isActive(pathname, item.href)} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className="divider" />

      <div style={{ padding: "4px 0", flexShrink: 0 }}>
        {user?.is_admin && (
          <NavItem href="/admin" label="Admin" Icon={Settings} active={pathname.startsWith("/admin")} onNavigate={onNavigate} />
        )}
        {NAV_BOTTOM.map(item => (
          <NavItem key={item.href} {...item} active={isActive(pathname, item.href)} onNavigate={onNavigate} />
        ))}
        <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", margin: "1px 8px", borderRadius: "var(--r-lg)", background: "transparent", color: "var(--text-muted)", cursor: "pointer", border: "none", width: "calc(100% - 16px)", transition: "all var(--t-fast)", minHeight: "42px", fontFamily: "var(--font-display)", borderLeft: "2px solid transparent" }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = "var(--danger-bg)"; el.style.color = "var(--danger)"; }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = "transparent"; el.style.color = "var(--text-muted)"; }}>
          <span style={{ flexShrink: 0, display: "flex" }}><LogOut size={16} /></span>
          <span style={{ fontSize: "14px", fontWeight: 500 }}>Deconectare</span>
        </button>
      </div>
      <div style={{ height: "12px", flexShrink: 0 }} />
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarStyle: React.CSSProperties = {
    width: "260px", height: "100vh",
    background: "var(--glass-sidebar)",
    backdropFilter: "blur(28px) saturate(160%)",
    WebkitBackdropFilter: "blur(28px) saturate(160%)",
    borderRight: "1px solid var(--border)",
    boxShadow: "4px 0 32px rgba(0,0,0,0.3)",
    overflowY: "auto", overflowX: "hidden",
    zIndex: 50,
  };

  return (
    <>
      <aside role="navigation" aria-label="Navigație" className="sidebar-desktop" style={{ ...sidebarStyle, position: "fixed", top: 0, left: 0 }}>
        <SidebarContent pathname={pathname} />
      </aside>

      <div className="mobile-header" style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 60,
        height: "56px", display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 16px",
        background: "rgba(3,2,10,0.92)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img src="/logo.png" alt="SoulSide" style={{ width: "28px", height: "28px", borderRadius: "8px", objectFit: "cover", flexShrink: 0 }} />
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "15px", color: "var(--text-primary)" }}>SoulSide</span>
        </div>
        <button onClick={() => setMobileOpen(true)} aria-label="Deschide meniu" style={{ width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--glass-1)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", color: "var(--text-primary)", cursor: "pointer" }}>
          <Menu size={20} />
        </button>
      </div>

      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} />
      )}

      {mobileOpen && (
        <aside className="sidebar-mobile" role="navigation" aria-label="Navigație" style={{
          ...sidebarStyle,
          position: "fixed", top: 0, left: 0, zIndex: 80,
          animation: "sidebarIn 0.28s cubic-bezier(0.22,1,0.36,1) both",
        }}>
          <div style={{ position: "absolute", top: "12px", right: "12px", zIndex: 10 }}>
            <button onClick={() => setMobileOpen(false)} aria-label="Închide meniu" style={{ width: "32px", height: "32px", borderRadius: "50%", border: "1px solid var(--border)", background: "var(--glass-1)", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={18} />
            </button>
          </div>
          <SidebarContent pathname={pathname} onNavigate={() => setMobileOpen(false)} />
        </aside>
      )}
    </>
  );
}
