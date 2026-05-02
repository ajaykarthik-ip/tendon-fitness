"use client";
import { useEffect, useState } from "react";
import { store, Lead } from "@/lib/store";

const SOURCE_COLORS: Record<string, string> = {
  "WhatsApp Outreach": "bg-green-100 text-green-700",
  "Referral": "bg-blue-100 text-blue-700",
  "Walk-in": "bg-purple-100 text-purple-700",
  "Instagram": "bg-pink-100 text-pink-700",
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    store.getLeads().then(setLeads);
  }, []);

  return (
    <div className="py-5">
      <h1 className="text-3xl font-black text-gray-900">Leads</h1>
      <p className="text-sm text-gray-400 mt-1 mb-6">{leads.length} new leads this week</p>

      <div className="flex flex-col gap-3">
        {leads.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400 text-sm">
            No leads yet
          </div>
        )}
        {leads.map((lead) => (
          <div key={lead.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 font-bold text-sm">
                {lead.name.charAt(0)}
              </div>
              <div>
                <div className="font-semibold text-gray-900 text-sm">{lead.name}</div>
                <div className="text-xs text-gray-400">{lead.phone}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${SOURCE_COLORS[lead.source] ?? "bg-gray-100 text-gray-600"}`}>
                {lead.source}
              </span>
              <a
                href={`https://wa.me/91${lead.phone}?text=${encodeURIComponent(`Hi ${lead.name}! We noticed you were interested in joining Tendon Fitness. We'd love to have you! Come visit us or reply here to know more. 💪`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 bg-green-50 hover:bg-green-100 rounded-xl flex items-center justify-center transition"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.7A16 16 0 0 0 16 16.61l.77-.77a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
