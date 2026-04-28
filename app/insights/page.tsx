"use client";
import Link from "next/link";

const REVENUE_DATA = [
  { month: "Nov", value: 120000 },
  { month: "Dec", value: 135000 },
  { month: "Jan", value: 145000 },
  { month: "Feb", value: 155000 },
  { month: "Mar", value: 162000 },
  { month: "Apr", value: 185000 },
];

const MAX_VALUE = Math.max(...REVENUE_DATA.map((d) => d.value));

function formatINR(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

export default function InsightsPage() {
  const current = REVENUE_DATA[REVENUE_DATA.length - 1];
  const prev = REVENUE_DATA[REVENUE_DATA.length - 2];
  const growthPct = Math.round(((current.value - prev.value) / prev.value) * 100);

  return (
    <div className="py-5">
      <h1 className="text-3xl font-black text-gray-900">Insights</h1>
      <p className="text-sm text-gray-400 mt-1 mb-6">Monthly performance overview</p>

      {/* Revenue card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
        <div className="flex items-start justify-between mb-1">
          <div>
            <div className="text-xs text-gray-400 font-semibold tracking-wide">THIS MONTH</div>
            <div className="text-4xl font-black text-gray-900 mt-1">{formatINR(current.value)}</div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs font-bold bg-gray-900 text-white px-2.5 py-1 rounded-full">ACTIVE</span>
            <span className="text-xs font-semibold text-green-600">+{growthPct}%</span>
          </div>
        </div>
        <div className="text-sm text-gray-400 mb-5">
          Last Month <span className="font-medium text-gray-600">{formatINR(prev.value)}</span>
        </div>

        {/* Bar chart */}
        <div className="flex items-end gap-2 h-20">
          {REVENUE_DATA.map((d, i) => {
            const isLast = i === REVENUE_DATA.length - 1;
            const heightPct = (d.value / MAX_VALUE) * 100;
            return (
              <div key={d.month} className="flex flex-col items-center gap-1 flex-1">
                <div
                  className={`w-full rounded-t-md ${isLast ? "bg-gray-900" : "bg-gray-200"}`}
                  style={{ height: `${heightPct}%` }}
                />
                <span className="text-[10px] text-gray-400">{d.month}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Growth / leads card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4 text-center">
        <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </div>
        <h3 className="font-bold text-gray-900 text-lg mb-1">Growth</h3>
        <p className="text-sm text-gray-500 mb-4">Automated outreach generated <span className="font-semibold text-gray-900">24 new leads</span> this week.</p>
        <Link
          href="/leads"
          className="block w-full bg-gray-900 text-white font-semibold text-sm py-3 rounded-xl hover:bg-gray-800 transition"
        >
          View Leads
        </Link>
      </div>

      {/* Automation hub card */}
      <div
        className="rounded-2xl overflow-hidden relative mb-4"
        style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" }}
      >
        <div className="p-5">
          <div className="text-xs text-blue-400 font-semibold tracking-widest mb-1">SYSTEMSPULSE</div>
          <h3 className="text-white font-bold text-xl mb-1">Automation Hub</h3>
          <p className="text-gray-400 text-xs mb-4">Our intelligent curator manages your member engagement cycle automatically.</p>
          <Link
            href="/automation"
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
          >
            OPEN DESIGNER
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Avg Revenue/Member", value: "₹2,220" },
          { label: "Renewal Rate", value: "78%" },
          { label: "New This Month", value: "24" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-3 text-center">
            <div className="text-lg font-black text-gray-900">{s.value}</div>
            <div className="text-[10px] text-gray-400 mt-0.5 leading-tight">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
