"use client";
import { useEffect, useState } from "react";
import { store, Member, Membership, Plan, renewalWaUrl, reactivationWaUrl, getDaysLeft } from "@/lib/store";
import Avatar from "@/components/Avatar";

interface Row {
  member: Member;
  plan: Plan;
  membership: Membership;
  daysLeft: number;
}

const WINDOW_DAYS = 30;

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function ExpiringPage() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    Promise.all([store.getMembers(), store.getMemberships(), store.getPlans()]).then(([members, memberships, plans]) => {
      // Pick latest membership per member
      const latestByMember = new Map<string, Membership>();
      for (const m of memberships) {
        const cur = latestByMember.get(m.memberId);
        if (!cur || new Date(m.endDate) > new Date(cur.endDate)) latestByMember.set(m.memberId, m);
      }

      const out: Row[] = [];
      latestByMember.forEach((membership, memberId) => {
        const dl = getDaysLeft(membership.endDate);
        if (dl > WINDOW_DAYS) return;
        const member = members.find((mem) => mem.id === memberId);
        const plan = plans.find((p) => p.id === membership.planId);
        if (member && plan) out.push({ member, plan, membership, daysLeft: dl });
      });

      out.sort((a, b) => a.daysLeft - b.daysLeft);
      setRows(out);
    });
  }, []);

  const expiredRows = rows.filter((r) => r.daysLeft < 0);
  const soonRows = rows.filter((r) => r.daysLeft >= 0 && r.daysLeft <= 7);
  const upcomingRows = rows.filter((r) => r.daysLeft > 7);

  const Section = ({ title, items, accent }: { title: string; items: Row[]; accent: string }) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-bold tracking-wide uppercase text-gray-500">{title}</h2>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${accent}`}>{items.length}</span>
        </div>
        <div className="flex flex-col gap-3">
          {items.map(({ member, plan, membership, daysLeft }) => (
            <div key={membership.id} className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-start gap-3 mb-3">
                <Avatar name={member.name} src={member.photo} className="w-12 h-12 rounded-xl" textClassName="text-sm" />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900 leading-tight">{member.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{member.phone}</div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap ${
                  daysLeft < 0 ? "bg-red-100 text-red-600" : daysLeft <= 7 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"
                }`}>
                  {daysLeft < 0 ? `${Math.abs(daysLeft)}d AGO` : daysLeft === 0 ? "TODAY" : `${daysLeft}d LEFT`}
                </span>
              </div>

              <div className="bg-gray-50 rounded-xl p-3 text-xs flex flex-col gap-1.5 mb-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Package</span>
                  <span className="font-semibold text-gray-900">{plan.name} · ₹{plan.price}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Started</span>
                  <span className="font-medium text-gray-700">{fmtDate(membership.startDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Ends</span>
                  <span className="font-medium text-gray-700">{fmtDate(membership.endDate)}</span>
                </div>
              </div>

              <a
                href={daysLeft < 0
                  ? reactivationWaUrl(member.phone, member.name, plan.name)
                  : renewalWaUrl(member.phone, member.name, plan.name, membership.endDate)}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full block text-center text-sm font-semibold py-2.5 rounded-xl transition ${
                  daysLeft < 0 ? "bg-red-600 hover:bg-red-700 text-white" : "bg-green-500 hover:bg-green-600 text-white"
                }`}
              >
                {daysLeft < 0 ? "Send Reactivation" : "Send Renewal Reminder"}
              </a>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="py-5">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-black text-gray-900">Expiring</h1>
        <span className="text-sm text-gray-400">{rows.length} total</span>
      </div>
      <p className="text-sm text-gray-400 mb-6">Memberships ending in the next {WINDOW_DAYS} days</p>

      {rows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
          <div className="text-4xl mb-3">✅</div>
          <p className="text-sm">All clear — no memberships expiring soon</p>
        </div>
      ) : (
        <>
          <Section title="Already Expired" items={expiredRows} accent="bg-red-100 text-red-600" />
          <Section title="Expiring This Week" items={soonRows} accent="bg-amber-100 text-amber-700" />
          <Section title="Upcoming" items={upcomingRows} accent="bg-gray-100 text-gray-600" />
        </>
      )}
    </div>
  );
}
