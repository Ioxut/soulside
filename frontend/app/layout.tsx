import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "SoulSide",
  description: "Îngrijire empatică, suport 24/7 și resurse veridice pentru bunăstarea ta mentală.",
  keywords: ["sănătate mentală", "AI", "terapie", "suport emoțional", "mindfulness"],
  icons: {
    icon: "/favicon.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro" suppressHydrationWarning>
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "rgba(7,5,15,0.97)",
              color: "#e2e8f0",
              border: "1px solid rgba(139,92,246,0.2)",
              borderRadius: "12px",
              backdropFilter: "blur(16px)",
              fontSize: "14px",
              fontFamily: "var(--font-body)",
            },
            success: { iconTheme: { primary: "#8b5cf6", secondary: "#03020a" } },
            error: { iconTheme: { primary: "#f87171", secondary: "#03020a" } },
          }}
        />
      </body>
    </html>
  );
}
