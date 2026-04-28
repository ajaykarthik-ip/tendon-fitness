"use client";
import { useEffect, useState } from "react";
import {
  store, Member, Membership, Plan,
  DEFAULT_MEMBERS, DEFAULT_MEMBERSHIPS, DEFAULT_PLANS,
  renewalWaUrl, reactivationWaUrl, inviteWaUrl,
  formatLastVisit, getMemberStatus, getDaysLeft, getMemberTier,
  generateMembershipId, getRandomPhoto,
} from "@/lib/store";
import Link from "next/link";

const DAY_MS = 1000 * 60 * 60 * 24;

interface MemberWithData {
  member: Member;
  status: "active" | "expiring" | "expired" | "none";
  latestMembership: Membership | null;
  plan: Plan | null;
  daysLeft: number;
  progressPct: number;
}

function buildEnriched(members: Member[], memberships: Membership[], plans: Plan[]): MemberWithData[] {
  return members.map((member) => {
    const ms = memberships.filter((m) => m.memberId === member.id);
    const latest = ms.sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())[0] ?? null;
    const plan = latest ? plans.find((p) => p.id === latest.planId) ?? null : null;
    const status = getMemberStatus(memberships, member.id);
    const dl = latest ? getDaysLeft(latest.endDate) : 0;
    let progressPct = 0;
    if (latest) {
      const totalDays = Math.ceil((new Date(latest.endDate).getTime() - new Date(latest.startDate).getTime()) / DAY_MS);
      const elapsed = totalDays - Math.max(0, dl);
      progressPct = Math.min(100, Math.round((elapsed / totalDays) * 100));
    }
    return { member, status, latestMembership: latest, plan, daysLeft: dl, progressPct };
  });
}

function StatusBadge({ status }: { status: "active" | "expiring" | "expired" | "none" }) {
  if (status === "active")   return <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-100 text-green-700">ACTIVE</span>;
  if (status === "expiring") return <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700">EXPIRING</span>;
  if (status === "expired")  return <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-100 text-red-600">EXPIRED</span>;
  return <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500">NO PLAN</span>;
}

function TierBadge({ tier }: { tier: "platinum" | "elite" | "standard" }) {
  if (tier === "platinum") return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 uppercase tracking-wide">Platinum Tier</span>;
  if (tier === "elite")    return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 uppercase tracking-wide">Elite Tier</span>;
  return null;
}

function WaButton({ href, label, variant }: { href: string; label: string; variant: "green" | "blue" | "red" }) {
  const colors = {
    green: "bg-green-500 hover:bg-green-600 text-white",
    blue:  "bg-blue-50 hover:bg-blue-100 text-blue-700",
    red:   "bg-red-700 hover:bg-red-800 text-white",
  };
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition ${colors[variant]}`}
    >
      {/* WhatsApp icon */}
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
      {label}
    </a>
  );
}

const initial = buildEnriched(DEFAULT_MEMBERS, DEFAULT_MEMBERSHIPS, DEFAULT_PLANS);

export default function UsersPage() {
  const [data, setData] = useState<MemberWithData[]>(initial);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [error, setError] = useState("");

  function load() {
    const members = store.getMembers();
    const memberships = store.getMemberships();
    const plans = store.getPlans();
    setData(buildEnriched(members, memberships, plans));
  }

  useEffect(() => { load(); }, []);

  const filtered = data.filter((d) => {
    const q = search.toLowerCase();
    return (
      d.member.name.toLowerCase().includes(q) ||
      d.member.membershipId.toLowerCase().includes(q) ||
      d.member.phone.includes(q)
    );
  });

  const activeCount = data.filter((d) => d.status === "active" || d.status === "expiring").length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const members = store.getMembers();
    if (members.find((m) => m.email === form.email)) { setError("Email already exists."); return; }
    const newMember: Member = {
      id: Date.now().toString(),
      name: form.name,
      email: form.email,
      phone: form.phone,
      createdAt: new Date().toISOString().split("T")[0],
      photo: getRandomPhoto(Math.random() > 0.5 ? "men" : "women"),
      membershipId: generateMembershipId(),
      lastVisit: new Date().toISOString(),
      attendance: 0,
      streak: 0,
    };
    store.saveMembers([newMember, ...members]);
    setForm({ name: "", email: "", phone: "" });
    setShowForm(false);
    load();
  };

  return (
    <div className="py-5">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-black text-gray-900">Members</h1>
        <span className="text-sm text-gray-400">{data.length} total</span>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search by name or membership ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
        />
      </div>

      {/* Member cards */}
      <div className="flex flex-col gap-4">
        {filtered.map(({ member, status, latestMembership, plan, daysLeft, progressPct }) => {
          const tier = getMemberTier(member);

          return (
            <div key={member.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="p-4">

                {/* Header row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img src={member.photo} alt={member.name} className="w-14 h-14 rounded-2xl object-cover" />
                      {tier === "platinum" && (
                        <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center text-white text-[10px]">★</span>
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-lg leading-tight">{member.name}</div>
                      <div className="text-xs text-gray-400">{member.membershipId}{plan ? ` • ${plan.name}` : ""}</div>
                    </div>
                  </div>
                  <StatusBadge status={status} />
                </div>

                {/* Tier badge */}
                {tier !== "standard" && (
                  <div className="mb-3">
                    <TierBadge tier={tier} />
                    {tier === "platinum" && (
                      <p className="text-xs text-gray-500 mt-1">
                        Consistent attendance for {member.streak} days. Eligible for &quot;Platinum Performer&quot; quarterly reward.
                      </p>
                    )}
                  </div>
                )}

                {/* Elite/Platinum stats */}
                {tier !== "standard" && (
                  <div className="flex gap-6 mb-3">
                    <div>
                      <div className="text-xs text-gray-400">ATTENDANCE</div>
                      <div className="text-xl font-bold text-gray-900">{member.attendance}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">STREAK</div>
                      <div className="text-xl font-bold text-gray-900">{member.streak} Days</div>
                    </div>
                  </div>
                )}

                {/* Expiring progress bar */}
                {status === "expiring" && latestMembership && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{daysLeft} DAYS LEFT</span>
                      <span>{progressPct}% consumed</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${progressPct}%` }} />
                    </div>
                  </div>
                )}

                {/* Last visit (active only) */}
                {status === "active" && (
                  <div className="flex items-center gap-2 mb-3">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span className="text-xs text-gray-500">
                      LAST VISIT: <span className="font-medium text-gray-700">{formatLastVisit(member.lastVisit)}</span>
                    </span>
                  </div>
                )}

                {/* ── ACTION BUTTONS ── */}

                {/* EXPIRING → send renewal reminder on WhatsApp */}
                {status === "expiring" && latestMembership && plan && (
                  <WaButton
                    href={renewalWaUrl(member.name, plan.name, latestMembership.endDate)}
                    label="Send Renewal Reminder"
                    variant="blue"
                  />
                )}

                {/* EXPIRED → send reactivation on WhatsApp + Call */}
                {status === "expired" && plan && (
                  <div className="flex gap-2">
                    <a
                      href={`tel:${member.phone}`}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.7A16 16 0 0 0 16 16.61l.77-.77a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                      Call
                    </a>
                    <WaButton
                      href={reactivationWaUrl(member.name, plan.name)}
                      label="Send Reactivation"
                      variant="red"
                    />
                  </div>
                )}

                {/* NO PLAN → invite to join */}
                {status === "none" && (
                  <WaButton
                    href={inviteWaUrl(member.name)}
                    label="Send Invite to Join"
                    variant="green"
                  />
                )}

                {/* ACTIVE → no WhatsApp button, they're good */}
              </div>
            </div>
          );
        })}
      </div>

      {/* Total active banner */}
      <div className="mt-6 bg-gray-900 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <div className="text-gray-400 text-xs font-medium">Total Active Members</div>
          <div className="text-white text-3xl font-black">{activeCount}</div>
          <div className="text-gray-500 text-xs mt-0.5">+12% this month</div>
        </div>
        <div className="flex -space-x-2">
          {data.filter((d) => d.status === "active" || d.status === "expiring").slice(0, 4).map(({ member }) => (
            <img key={member.id} src={member.photo} alt={member.name} className="w-8 h-8 rounded-full border-2 border-gray-900 object-cover" />
          ))}
          {activeCount > 4 && (
            <div className="w-8 h-8 rounded-full border-2 border-gray-900 bg-gray-700 flex items-center justify-center text-white text-[10px] font-bold">
              +{activeCount - 4}
            </div>
          )}
        </div>
      </div>

      {/* Add member slide-up form */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end" onClick={() => setShowForm(false)}>
          <div className="bg-white w-full rounded-t-3xl p-6 max-w-lg mx-auto" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-5" />
            <h2 className="font-bold text-xl text-gray-900 mb-4">Add New Member</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input required placeholder="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
              <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
              <input required placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <button type="submit" className="bg-gray-900 text-white rounded-xl py-3 font-semibold text-sm hover:bg-gray-800 mt-1">
                Add Member
              </button>
            </form>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-24 right-4 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition z-40"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
  );
}
