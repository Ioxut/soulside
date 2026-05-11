import Sidebar from "@/components/layout/Sidebar";
import OrbBackground from "@/components/ui/OrbBackground";
import UserHydrator from "@/components/layout/UserHydrator";
import OfflineIndicator from "@/components/ui/OfflineIndicator";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-base)", position: "relative" }}>
      <OrbBackground />
      <UserHydrator />
      <OfflineIndicator />
      <Sidebar />
      <main id="main-content" role="main" className="app-main" style={{ minHeight: "100vh" }}>
        {/* Mobile top-bar spacer */}
        <div className="mobile-header" style={{ height: "56px", flexShrink: 0 }} />
        <div className="page-enter">
          {children}
        </div>
      </main>
    </div>
  );
}
