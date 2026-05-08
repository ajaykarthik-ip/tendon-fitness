import type { Metadata, Viewport } from "next";
import { Inter, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tendon Fitness",
  description: "Gym management",
};

export const viewport: Viewport = {
  themeColor: "#fafaf9",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen antialiased">
        <header className="fixed top-0 left-0 right-0 z-40 bg-[var(--color-bg)]/80 backdrop-blur-md border-b border-[var(--color-line)]">
          <div className="max-w-lg mx-auto flex items-center justify-between px-5 h-14">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-[var(--color-ink)] rounded-lg flex items-center justify-center">
                <span className="text-white text-[10px] font-semibold tracking-tight">TF</span>
              </div>
              <span className="font-semibold text-[15px] tracking-tight text-[var(--color-ink)]">Tendon</span>
            </div>
            <div className="flex items-center gap-1">
              <button aria-label="Search" className="w-9 h-9 rounded-full hover:bg-[var(--color-line-2)] flex items-center justify-center text-[var(--color-ink-3)] tap">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="7" />
                  <line x1="20" y1="20" x2="16.65" y2="16.65" />
                </svg>
              </button>
              <Link
                href="/admin"
                aria-label="Admin profile"
                className="w-8 h-8 rounded-full bg-[var(--color-ink)] flex items-center justify-center text-white text-[11px] font-semibold tracking-tight ml-1 tap"
              >
                AD
              </Link>
            </div>
          </div>
        </header>

        <main className="pt-14 pb-24 min-h-screen max-w-lg mx-auto px-5">
          {children}
        </main>

        <BottomNav />
      </body>
    </html>
  );
}
