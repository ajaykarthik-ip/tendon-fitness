"use client";
import { useEffect, useState } from "react";
import { store, AutomationLog } from "@/lib/store";

const LOG_ICONS: Record<AutomationLog["type"], string> = {
  whatsapp: "💬",
  email: "📧",
  batch: "📦",
  system: "⚙️",
};

const LOG_COLORS: Record<AutomationLog["type"], string> = {
  whatsapp: "bg-green-50 border-green-100",
  email: "bg-blue-50 border-blue-100",
  batch: "bg-purple-50 border-purple-100",
  system: "bg-gray-50 border-gray-100",
};

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

export default function AutomationPage() {
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [whatsappOn, setWhatsappOn] = useState(true);
  const [emailOn, setEmailOn] = useState(true);

  async function load() {
    setLogs(await store.getAutomationLogs());
  }
  useEffect(() => { load(); }, []);

  const addLog = async (log: Omit<AutomationLog, "id">) => {
    await store.createAutomationLog(log);
    await load();
  };

  const downloadCSV = () => {
    const rows = [["Type", "Title", "Subtitle", "Tag", "Timestamp"], ...logs.map((l) => [l.type, l.title, l.subtitle, l.tag ?? "", l.timestamp])];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "automation_logs.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleWhatsappToggle = async () => {
    const next = !whatsappOn;
    setWhatsappOn(next);
    await addLog({
      type: "system",
      title: `WhatsApp Notifications ${next ? "enabled" : "disabled"}`,
      subtitle: "Channel status updated by admin",
      timestamp: new Date().toISOString(),
    });
  };

  const handleEmailToggle = async () => {
    const next = !emailOn;
    setEmailOn(next);
    await addLog({
      type: "system",
      title: `Email Notifications ${next ? "enabled" : "disabled"}`,
      subtitle: "Channel status updated by admin",
      timestamp: new Date().toISOString(),
    });
  };

  const sendBatch = async () => {
    await addLog({
      type: "batch",
      title: "Batch Process: reminders sent",
      subtitle: "Manual morning motivation broadcast triggered",
      tag: "SENT",
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <div className="py-5">
      <div className="text-xs text-blue-500 font-bold tracking-widest mb-1">SYSTEMSPULSE</div>
      <h1 className="text-3xl font-black text-gray-900">Automation Hub</h1>
      <p className="text-sm text-gray-400 mt-1 mb-6">
        Our intelligent curator manages your member engagement cycle — renewals, attendance nudges, and outreach with zero manual intervention.
      </p>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
        <div className="text-xs text-gray-400 font-semibold tracking-wide mb-1">TODAY&apos;S VOLUME</div>
        <div className="flex items-baseline gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          <span className="text-3xl font-black text-gray-900">{logs.filter((l) => l.type !== "system").length} reminders sent today</span>
        </div>
        <div className="h-1 bg-gray-100 rounded-full mt-3">
          <div className="h-full bg-gray-900 rounded-full" style={{ width: "72%" }} />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
        <div className="text-xs text-gray-400 font-semibold tracking-wide mb-4">ACTIVE CHANNELS</div>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-lg">💬</div>
              <div>
                <div className="font-semibold text-gray-900 text-sm">WhatsApp Notifications</div>
                <div className="text-xs text-gray-400">Renewal &amp; session alerts</div>
              </div>
            </div>
            <button
              onClick={handleWhatsappToggle}
              className={`relative w-12 h-6 rounded-full transition-colors ${whatsappOn ? "bg-green-500" : "bg-gray-200"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${whatsappOn ? "translate-x-6" : "translate-x-0"}`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-lg">📧</div>
              <div>
                <div className="font-semibold text-gray-900 text-sm">Email Notifications</div>
                <div className="text-xs text-gray-400">Invoices &amp; official reports</div>
              </div>
            </div>
            <button
              onClick={handleEmailToggle}
              className={`relative w-12 h-6 rounded-full transition-colors ${emailOn ? "bg-green-500" : "bg-gray-200"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${emailOn ? "translate-x-6" : "translate-x-0"}`} />
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-4 bg-gray-50 rounded-xl p-3">
          Automation rules are processed every 15 minutes. High priority alerts bypass the queue.
        </p>
      </div>

      <div className="flex gap-3 mb-4">
        <button
          onClick={sendBatch}
          className="flex-1 bg-gray-900 text-white font-semibold text-sm py-3 rounded-xl hover:bg-gray-800 transition"
        >
          Run Batch Now
        </button>
        <button
          className="flex-1 border border-gray-200 text-gray-700 font-semibold text-sm py-3 rounded-xl hover:bg-gray-50 transition"
        >
          Configure Workflow
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs text-gray-400 font-semibold tracking-wide">LIVE EXECUTION LOGS</div>
          <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">REAL-TIME</span>
        </div>

        <div className="flex flex-col gap-3">
          {logs.length === 0 && (
            <div className="text-sm text-gray-400 text-center py-4">No activity yet</div>
          )}
          {logs.map((log) => (
            <div key={log.id} className={`rounded-xl border p-3 ${LOG_COLORS[log.type]}`}>
              <div className="flex items-start gap-2">
                <span className="text-lg leading-none flex-shrink-0">{LOG_ICONS[log.type]}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm">{log.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{log.subtitle}</div>
                  {log.tag && (
                    <span className="inline-block text-[10px] font-bold text-gray-500 border border-gray-200 rounded px-1.5 py-0.5 mt-1">{log.tag}</span>
                  )}
                </div>
                <span className="text-[10px] text-gray-400 flex-shrink-0">{timeAgo(log.timestamp)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-green-500 rounded-full" />
          <span className="text-sm font-semibold text-gray-900">System Health: OK</span>
        </div>
        <span className="text-xs text-gray-400">All nodes &lt;50ms</span>
      </div>

      <button
        onClick={downloadCSV}
        className="w-full border border-gray-200 text-gray-600 text-sm font-semibold py-3 rounded-xl hover:bg-gray-50 transition flex items-center justify-center gap-2"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Download Full Archive (CSV)
      </button>
    </div>
  );
}
