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

interface PendingItem {
  member: Member;
  plan: Plan | null;
  membership: Membership;
  pending: number;
}

interface Stats {
  members: number;
  active: number;
  expiring: number;
  expired: number;
  revenue: number;
  pending: number;
}

const DAY_MS = 1000 * 60 * 60 * 24;
const daysLeft = (endDate: string) =>
  Math.ceil((new Date(endDate).getTime() - Date.now()) / DAY_MS);

function computeStats(members: Member[], plans: Plan[], memberships: Membership[]) {
  let active = 0, expiring = 0, expired = 0;
  let revenue = 0, pending = 0;
  const soonList: ExpiringItem[] = [];
  const pendingList: PendingItem[] = [];
  const memberMap = new Map(members.map((m) => [m.id, m]));
  const planMap = new Map(plans.map((p) => [p.id, p]));

  // Latest membership per member, for pending list
  const latestByMember = new Map<string, Membership>();
  for (const m of memberships) {
    const cur = latestByMember.get(m.memberId);
    if (!cur || new Date(m.endDate).getTime() > new Date(cur.endDate).getTime()) {
      latestByMember.set(m.memberId, m);
    }
  }
  for (const m of latestByMember.values()) {
    if ((m.pendingAmount ?? 0) > 0) {
      const member = memberMap.get(m.memberId);
      const plan = planMap.get(m.planId) ?? null;
      if (member) pendingList.push({ member, plan, membership: m, pending: m.pendingAmount! });
    }
  }
  pendingList.sort((a, b) => b.pending - a.pending);

  for (const m of memberships) {
    const planForMs = planMap.get(m.planId);
    const price = planForMs?.price ?? 0;
    const pend = m.pendingAmount ?? 0;
    revenue += Math.max(0, price - pend);
    pending += pend;

    const d = daysLeft(m.endDate);
    if (d < 0) {
      expired++;
    } else if (d <= 7) {
      expiring++;
      active++;
      const member = memberMap.get(m.memberId);
      const plan = planMap.get(m.planId);
      if (member && plan) soonList.push({ member, plan, membership: m, daysLeft: d });
    } else {
      active++;
    }
  }

  soonList.sort((a, b) => a.daysLeft - b.daysLeft);
  return {
    stats: { members: members.length, active, expiring, expired, revenue, pending } as Stats,
    expiringSoon: soonList,
    pendingPayments: pendingList,
  };
}

const EMPTY_STATS: Stats = { members: 0, active: 0, expiring: 0, expired: 0, revenue: 0, pending: 0 };

function StatCard({ label, value, tone, loading, prefix }: { label: string; value: number; tone: "ink" | "warn" | "danger" | "success"; loading: boolean; prefix?: string }) {
  const toneClass =
    tone === "warn" ? "text-[var(--color-warn)]" :
    tone === "danger" ? "text-[var(--color-danger)]" :
    tone === "success" ? "text-[var(--color-success)]" :
    "text-[var(--color-ink)]";
  return (
    <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-line)] p-4">
      <div className="text-[10px] font-medium tracking-[0.08em] uppercase text-[var(--color-ink-4)]">
        {label}
      </div>
      {loading ? (
        <div className="skeleton h-7 w-12 mt-2" />
      ) : (
        <div className={`text-3xl font-semibold tracking-tight mt-1 tabular-nums ${toneClass}`}>
          {prefix}{value.toLocaleString("en-IN")}
        </div>
      )}
    </div>
  );
}

function WaIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [expiringSoon, setExpiringSoon] = useState<ExpiringItem[]>([]);
  const [pendingPayments, setPendingPayments] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([store.getMembers(), store.getPlans(), store.getMemberships()])
      .then(([members, plans, memberships]) => {
        const { stats: s, expiringSoon: e, pendingPayments: p } = computeStats(members, plans, memberships);
        setStats(s);
        setExpiringSoon(e);
        setPendingPayments(p);
      })
      .finally(() => setLoading(false));
  }, []);

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="pt-6 pb-2">
      <div className="text-[11px] font-medium tracking-[0.08em] uppercase text-[var(--color-ink-4)]">
        {dateStr}
      </div>
      <h1 className="text-[34px] font-semibold tracking-[-0.02em] text-[var(--color-ink)] leading-[1.1] mt-1">
        Overview
      </h1>

      <div className="grid grid-cols-3 gap-2.5 mt-6">
        <StatCard label="Members" value={stats.members} tone="ink" loading={loading} />
        <StatCard label="Expiring" value={stats.expiring} tone="warn" loading={loading} />
        <StatCard label="Expired" value={stats.expired} tone="danger" loading={loading} />
      </div>
      <div className="grid grid-cols-2 gap-2.5 mt-2.5">
        <StatCard label="Revenue" value={stats.revenue} tone="success" loading={loading} prefix="₹" />
        <StatCard label="Pending" value={stats.pending} tone="danger" loading={loading} prefix="₹" />
      </div>

      <div className="flex items-center justify-between mt-8 mb-3">
        <h2 className="text-[15px] font-semibold tracking-tight text-[var(--color-ink)]">
          Expiring soon
        </h2>
        <Link
          href="/expiring"
          className="text-[13px] font-medium text-[var(--color-ink-3)] hover:text-[var(--color-ink)] tap"
        >
          View all
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-line)] p-4 flex items-center gap-3">
              <div className="skeleton w-11 h-11 rounded-full" />
              <div className="flex-1 flex flex-col gap-2">
                <div className="skeleton h-3.5 w-32" />
                <div className="skeleton h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : expiringSoon.length === 0 ? (
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-line)] py-10 text-center">
          <div className="text-[var(--color-ink-3)] text-sm">All members are up to date.</div>
          <div className="text-[var(--color-ink-4)] text-xs mt-1">Nothing expires in the next 7 days.</div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {expiringSoon.map(({ member, plan, membership, daysLeft: d }) => (
            <div key={membership.id} className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-line)] p-3.5 flex items-center gap-3">
              <Avatar name={member.name} src={member.photo} className="w-11 h-11 rounded-full" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[14px] tracking-tight text-[var(--color-ink)] truncate">
                  {member.name}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`inline-flex items-center text-[10px] font-semibold tracking-tight px-1.5 py-0.5 rounded-md ${
                    d === 0
                      ? "bg-[var(--color-danger-soft)] text-[var(--color-danger)]"
                      : "bg-[var(--color-warn-soft)] text-[var(--color-warn)]"
                  }`}>
                    {d === 0 ? "Today" : `${d}d`}
                  </span>
                  <span className="text-[12px] text-[var(--color-ink-3)] truncate">{plan.name}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <a
                  href={renewalWaUrl(member.phone, member.name, plan.name, membership.endDate)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-[var(--color-success-soft)] hover:bg-green-100 flex items-center justify-center text-[var(--color-success)] tap"
                  aria-label="WhatsApp"
                >
                  <WaIcon />
                </a>
                <Link
                  href={`/members/${member.id}`}
                  className="w-9 h-9 rounded-full hover:bg-[var(--color-line-2)] flex items-center justify-center text-[var(--color-ink-3)] tap"
                  aria-label="Open"
                >
                  <ChevronIcon />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-8 mb-3">
        <h2 className="text-[15px] font-semibold tracking-tight text-[var(--color-ink)]">
          Pending payments
        </h2>
        <Link
          href="/users"
          className="text-[13px] font-medium text-[var(--color-ink-3)] hover:text-[var(--color-ink)] tap"
        >
          View all
        </Link>
      </div>
      {loading ? (
        <div className="flex flex-col gap-2">
          {[0, 1].map((i) => (
            <div key={i} className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-line)] p-4 flex items-center gap-3">
              <div className="skeleton w-11 h-11 rounded-full" />
              <div className="flex-1 flex flex-col gap-2">
                <div className="skeleton h-3.5 w-32" />
                <div className="skeleton h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : pendingPayments.length === 0 ? (
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-line)] py-10 text-center">
          <div className="text-[var(--color-ink-3)] text-sm">No pending payments.</div>
          <div className="text-[var(--color-ink-4)] text-xs mt-1">All members are paid up.</div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {pendingPayments.map(({ member, plan, membership, pending }) => (
            <div key={membership.id} className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-line)] p-3.5 flex items-center gap-3">
              <Avatar name={member.name} src={member.photo} className="w-11 h-11 rounded-full" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[14px] tracking-tight text-[var(--color-ink)] truncate">
                  {member.name}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-flex items-center text-[10px] font-semibold tracking-tight px-1.5 py-0.5 rounded-md bg-[var(--color-danger-soft)] text-[var(--color-danger)]">
                    ₹{pending}
                  </span>
                  <span className="text-[12px] text-[var(--color-ink-3)] truncate">{plan?.name ?? "—"}</span>
                </div>
              </div>
              <Link
                href={`/members/${member.id}`}
                className="w-9 h-9 rounded-full hover:bg-[var(--color-line-2)] flex items-center justify-center text-[var(--color-ink-3)] tap"
                aria-label="Open"
              >
                <ChevronIcon />
              </Link>
            </div>
          ))}
        </div>
      )}

      <h2 className="text-[15px] font-semibold tracking-tight text-[var(--color-ink)] mt-8 mb-3">
        Quick actions
      </h2>
      <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-line)] divide-y divide-[var(--color-line)] overflow-hidden">
        {[
          { href: "/users", label: "Add member" },
          { href: "/plans", label: "Create plan" },
        ].map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="flex items-center justify-between px-4 py-3.5 text-[14px] font-medium text-[var(--color-ink)] hover:bg-[var(--color-line-2)] tap"
          >
            <span>{a.label}</span>
            <span className="text-[var(--color-ink-4)]"><ChevronIcon /></span>
          </Link>
        ))}
      </div>
    </div>
  );
}
