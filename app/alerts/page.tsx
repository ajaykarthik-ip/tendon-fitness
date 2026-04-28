"use client";
import { useEffect, useState } from "react";
import { store, Alert, Member } from "@/lib/store";

const TYPE_CONFIG = {
  expiring: { label: "Expiring", color: "bg-amber-100 text-amber-700", icon: "🕐" },
  expired: { label: "Expired", color: "bg-red-100 text-red-600", icon: "💔" },
  payment: { label: "Payment", color: "bg-blue-100 text-blue-700", icon: "💳" },
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    setAlerts(store.getAlerts());
    setMembers(store.getMembers());
  }, []);

  const markRead = (id: string) => {
    const updated = alerts.map((a) => a.id === id ? { ...a, read: true } : a);
    store.saveAlerts(updated);
    setAlerts(updated);
  };

  const markAllRead = () => {
    const updated = alerts.map((a) => ({ ...a, read: true }));
    store.saveAlerts(updated);
    setAlerts(updated);
  };

  const getMember = (id: string) => members.find((m) => m.id === id);
  const unread = alerts.filter((a) => !a.read).length;

  return (
    <div className="py-5">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-black text-gray-900">Alerts</h1>
        {unread > 0 && (
          <button onClick={markAllRead} className="text-xs text-gray-500 hover:text-gray-900 underline underline-offset-2">
            Mark all read
          </button>
        )}
      </div>
      <p className="text-sm text-gray-400 mb-6">{unread} unread notification{unread !== 1 ? "s" : ""}</p>

      {alerts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
          <div className="text-4xl mb-3">🔔</div>
          <p className="text-sm">No alerts yet. You&apos;re all caught up!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {alerts.map((alert) => {
            const member = getMember(alert.memberId);
            const cfg = TYPE_CONFIG[alert.type];
            return (
              <div
                key={alert.id}
                className={`bg-white rounded-2xl border p-4 transition ${alert.read ? "border-gray-100 opacity-70" : "border-gray-200 shadow-sm"}`}
              >
                <div className="flex items-start gap-3">
                  {member && (
                    <img src={member.photo} alt={member.name} className="w-11 h-11 rounded-xl object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.color}`}>
                        {cfg.icon} {cfg.label}
                      </span>
                      {!alert.read && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />}
                    </div>
                    <p className="text-sm text-gray-700 leading-snug">{alert.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(alert.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  {!alert.read && (
                    <button
                      onClick={() => markRead(alert.id)}
                      className="text-xs text-gray-400 hover:text-gray-700 flex-shrink-0 mt-1"
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
