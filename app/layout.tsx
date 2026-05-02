import type { Metadata } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "Tendon Fitness",
  description: "Gym management system",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        {/* Fixed header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 px-4 py-3">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">TF</span>
              </div>
              <span className="font-bold text-gray-900 text-base">Tendon Fitness</span>
            </div>
            <div className="flex items-center gap-3">
              <button className="text-gray-500 hover:text-gray-900 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>
              <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-white text-[10px] font-bold border-2 border-gray-200">
                AD
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="pt-16 pb-24 min-h-screen max-w-lg mx-auto px-4">
          {children}
        </main>

        <BottomNav />
      </body>
    </html>
  );
}
