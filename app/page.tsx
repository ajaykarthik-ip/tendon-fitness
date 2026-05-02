"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { store, Membership, Member, Plan, renewalWaUrl } from "@/lib/store";
import Avatar from "@/components/Avatar";

interface ExpiringItem {
  member: Member;
  plan: Plan;
  membership: Membership;
  daysLeft: number;
}

interface Stats {
  members: number;
  plans: number;
  active: number;
  expiring: number;
  expired: number;
}

const DAY_MS = 1000 * 60 * 60 * 24;

function daysLeft(endDate: string) {
  return Math.ceil((new Date(endDate).getTime() - Date.now()) / DAY_MS);
}

function computeStats(members: Member[], plans: Plan[], memberships: Membership[]): { stats: Stats; expiringSoon: ExpiringItem[] } {
  let active = 0, expiring = 0, expired = 0;
  const soonList: ExpiringItem[] = [];

  memberships.forEach((m) => {
    const d = daysLeft(m.endDate);
    if (d < 0) {
      expired++;
    } else if (d <= 7) {
      expiring++;
      active++;
      const member = members.find((mb) => mb.id === m.memberId);
      const plan = plans.find((p) => p.id === m.planId);
      if (member && plan) soonList.push({ member, plan, membership: m, daysLeft: d });
    } else {
      active++;
    }
  });

  soonList.sort((a, b) => a.daysLeft - b.daysLeft);
  return {
    stats: { members: members.length, plans: plans.length, active, expiring, expired },
    expiringSoon: soonList,
  };
}

const EMPTY_STATS: Stats = { members: 0, plans: 0, active: 0, expiring: 0, expired: 0 };

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [expiringSoon, setExpiringSoon] = useState<ExpiringItem[]>([]);

  useEffect(() => {
    Promise.all([store.getMembers(), store.getPlans(), store.getMemberships()])
      .then(([members, plans, memberships]) => {
        const { stats: s, expiringSoon: e } = computeStats(members, plans, memberships);
        setStats(s);
        setExpiringSoon(e);
      });
  }, []);

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" });

  return (
    <div className="py-5">
      <h1 className="text-4xl font-black text-gray-900 leading-tight">Overview</h1>
      <p className="text-sm text-gray-400 mt-1 mb-6">{dateStr} — Performance Dashboard</p>

      <div className="grid grid-cols-3 gap-2 mb-8">
        <div className="rounded-2xl p-3 bg-blue-50 border border-blue-100">
          <span className="text-lg">👥</span>
          <div className="text-[10px] font-semibold tracking-widest mt-1.5 text-blue-700/70">TOTAL</div>
          <div className="text-3xl font-black mt-0.5 text-blue-700 leading-none">{stats.members}</div>
        </div>
        <div className="rounded-2xl p-3 bg-amber-50 border border-amber-100">
          <span className="text-lg">🕐</span>
          <div className="text-[10px] font-semibold tracking-widest mt-1.5 text-amber-700/70">EXPIRING</div>
          <div className="text-3xl font-black mt-0.5 text-amber-600 leading-none">{stats.expiring}</div>
        </div>
        <div className="rounded-2xl p-3 bg-red-50 border border-red-100">
          <span className="text-lg">💔</span>
          <div className="text-[10px] font-semibold tracking-widest mt-1.5 text-red-700/70">EXPIRED</div>
          <div className="text-3xl font-black mt-0.5 text-red-600 leading-none">{stats.expired}</div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold text-gray-900">Expiring Soon</h2>
        <Link href="/users" className="text-sm text-gray-400 hover:text-gray-700">View All</Link>
      </div>

      {expiringSoon.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center text-gray-400 text-sm">
          No memberships expiring in the next 7 days
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {expiringSoon.map(({ member, plan, membership, daysLeft: d }) => (
            <div key={membership.id} className="bg-white rounded-2xl border border-dashed border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <Avatar name={member.name} src={member.photo} className="w-12 h-12 rounded-full" />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900 text-base">{member.name}</div>
                  <div className="text-xs text-gray-400">{plan.name} Membership</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${d === 0 ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"}`}>
                    {d === 0 ? "TODAY" : `${d} DAY${d > 1 ? "S" : ""} LEFT`}
                  </span>
                  <a
                    href={renewalWaUrl(member.phone, member.name, plan.name, membership.endDate)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-green-100 hover:bg-green-200 flex items-center justify-center transition"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="#16a34a">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </a>
                  <Link href="/users" className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 flex flex-col gap-2">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Quick Actions</h2>
        <Link href="/users" className="bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium hover:bg-gray-50 flex items-center justify-between">
          <span>Add New Member</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
        </Link>
        <Link href="/plans" className="bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium hover:bg-gray-50 flex items-center justify-between">
          <span>Create Plan</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
        </Link>
        <Link href="/memberships" className="bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium hover:bg-gray-50 flex items-center justify-between">
          <span>Assign Membership</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
        </Link>
      </div>
    </div>
  );
}
