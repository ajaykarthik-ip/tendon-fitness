"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { store } from "@/lib/store";

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5L12 3l9 7.5" />
      <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
    </svg>
  );
}

function MembersIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
    </svg>
  );
}

function CalendarIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
      <line x1="16" y1="3" x2="16" y2="7" />
      <line x1="8" y1="3" x2="8" y2="7" />
      <line x1="3.5" y1="10" x2="20.5" y2="10" />
    </svg>
  );
}

function PlansIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="3" width="14" height="18" rx="2.5" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="16" x2="13" y2="16" />
    </svg>
  );
}

function BellIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  );
}

const tabs = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/users", label: "Members", Icon: MembersIcon },
  { href: "/expiring", label: "Expiring", Icon: CalendarIcon },
  { href: "/plans", label: "Plans", Icon: PlansIcon },
  { href: "/alerts", label: "Alerts", Icon: BellIcon },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (pathname === "/login") return;
    store.getAlerts()
      .then((alerts) => setUnreadCount(alerts.filter((a) => !a.read).length))
      .catch(() => setUnreadCount(0));
  }, [pathname]);

  if (pathname === "/login") return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--color-surface)]/90 backdrop-blur-md border-t border-[var(--color-line)]">
      <div className="max-w-lg mx-auto flex pb-[env(safe-area-inset-bottom)]">
        {tabs.map(({ href, label, Icon }) => {
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center pt-2.5 pb-2 gap-1 relative tap ${
                isActive ? "text-[var(--color-ink)]" : "text-[var(--color-ink-4)]"
              }`}
            >
              <Icon active={isActive} />
              <span className={`text-[10px] tracking-tight ${isActive ? "font-semibold" : "font-medium"}`}>
                {label}
              </span>
              {href === "/alerts" && unreadCount > 0 && (
                <span className="absolute top-1.5 right-[calc(50%-16px)] bg-[var(--color-danger)] text-white text-[9px] font-semibold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
