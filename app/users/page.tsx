"use client";
import { useEffect, useState, useRef } from "react";
import {
  store, Member, Membership, Plan,
  renewalWaUrl, reactivationWaUrl, inviteWaUrl,
  getMemberStatus, getDaysLeft,
  generateMembershipId,
} from "@/lib/store";
import Avatar from "@/components/Avatar";
import Link from "next/link";
import { compressImage } from "@/lib/image";

interface MemberWithData {
  member: Member;
  status: "active" | "expiring" | "expired" | "none";
  latestMembership: Membership | null;
  plan: Plan | null;
  daysLeft: number;
}

function buildEnriched(members: Member[], memberships: Membership[], plans: Plan[]): MemberWithData[] {
  return members.map((member) => {
    const ms = memberships.filter((m) => m.memberId === member.id);
    const latest = ms.sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())[0] ?? null;
    const plan = latest ? plans.find((p) => p.id === latest.planId) ?? null : null;
    const status = getMemberStatus(memberships, member.id);
    const dl = latest ? getDaysLeft(latest.endDate) : 0;
    return { member, status, latestMembership: latest, plan, daysLeft: dl };
  });
}

function effectiveBonus(ms: Membership, plan: Plan): number {
  if ((ms.bonusMonths ?? 0) > 0) return ms.bonusMonths!;
  const expected = new Date(ms.startDate);
  expected.setMonth(expected.getMonth() + plan.durationMonths);
  const actual = new Date(ms.endDate);
  const diff = Math.round((actual.getTime() - expected.getTime()) / (1000 * 60 * 60 * 24 * 30));
  return diff > 0 ? diff : 0;
}

function StatusBadge({ status }: { status: "active" | "expiring" | "expired" | "none" }) {
  if (status === "active")   return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">ACTIVE</span>;
  if (status === "expiring") return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">EXPIRING</span>;
  if (status === "expired")  return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">EXPIRED</span>;
  return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">NO PLAN</span>;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

type SortKey = "expired" | "expiring" | "name-asc" | "name-desc";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "expiring", label: "Expiring soon" },
  { value: "expired", label: "Expired" },
  { value: "name-asc", label: "Name A → Z" },
  { value: "name-desc", label: "Name Z → A" },
];

export default function UsersPage() {
  const [data, setData] = useState<MemberWithData[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("expiring");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", photo: "" });
  const [error, setError] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  // assign-plan inline form per-member
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [assignForm, setAssignForm] = useState({ planId: "", startDate: new Date().toISOString().split("T")[0], pendingAmount: "", bonusMonths: "" });
  const [assignError, setAssignError] = useState("");

  async function load() {
    try {
      const [members, memberships, allPlans] = await Promise.all([
        store.getMembers(),
        store.getMemberships(),
        store.getPlans(),
      ]);
      setData(buildEnriched(members, memberships, allPlans));
      setPlans(allPlans);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  const filtered = data
    .filter((d) => {
      const q = search.toLowerCase();
      return (
        d.member.name.toLowerCase().includes(q) ||
        d.member.membershipId.toLowerCase().includes(q) ||
        d.member.phone.includes(q)
      );
    })
    .sort((a, b) => {
      switch (sort) {
        case "name-asc":
          return a.member.name.localeCompare(b.member.name);
        case "name-desc":
          return b.member.name.localeCompare(a.member.name);
        case "expired": {
          // Most-recently-expired first; non-expired (or no plan) sink to the bottom
          const aExp = a.status === "expired";
          const bExp = b.status === "expired";
          if (aExp && bExp) return b.daysLeft - a.daysLeft; // -1 before -30
          if (aExp) return -1;
          if (bExp) return 1;
          return a.member.name.localeCompare(b.member.name);
        }
        case "expiring":
        default: {
          // Expiring (0–7d) first, then sorted by daysLeft ascending; everyone else by daysLeft.
          // Members with no plan go last.
          if (!a.latestMembership && !b.latestMembership) {
            return a.member.name.localeCompare(b.member.name);
          }
          if (!a.latestMembership) return 1;
          if (!b.latestMembership) return -1;
          const aSoon = a.status === "expiring";
          const bSoon = b.status === "expiring";
          if (aSoon !== bSoon) return aSoon ? -1 : 1;
          return a.daysLeft - b.daysLeft;
        }
      }
    });

  const handlePhotoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPhotoBusy(true);
    setError("");
    try {
      const compressed = await compressImage(file, { maxSize: 400, quality: 0.7 });
      setForm((f) => ({ ...f, photo: compressed }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process image");
    } finally {
      setPhotoBusy(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const members = await store.getMembers();
    if (form.email && members.find((m) => m.email === form.email)) { setError("Email already exists."); return; }
    try {
      await store.createMember({
        name: form.name,
        email: form.email,
        phone: form.phone,
        photo: form.photo,
        createdAt: new Date().toISOString().split("T")[0],
        membershipId: generateMembershipId(),
        lastVisit: new Date().toISOString(),
        attendance: 0,
        streak: 0,
      });
      setForm({ name: "", email: "", phone: "", photo: "" });
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create member");
    }
  };

  const startAssign = (memberId: string) => {
    setAssigningId(memberId);
    setAssignForm({ planId: "", startDate: new Date().toISOString().split("T")[0], pendingAmount: "", bonusMonths: "" });
    setAssignError("");
  };

  const cancelAssign = () => {
    setAssigningId(null);
    setAssignError("");
  };

  const submitAssign = async (e: React.FormEvent, memberId: string) => {
    e.preventDefault();
    setAssignError("");
    const plan = plans.find((p) => p.id === assignForm.planId);
    if (!plan) { setAssignError("Pick a plan"); return; }
    if (!assignForm.startDate) { setAssignError("Pick a start date"); return; }
    const bonus = Number(assignForm.bonusMonths) || 0;
    if (bonus < 0) { setAssignError("Bonus months can't be negative"); return; }
    const end = new Date(assignForm.startDate);
    end.setMonth(end.getMonth() + plan.durationMonths + bonus);
    try {
      const pending = Number(assignForm.pendingAmount) || 0;
      if (pending < 0) { setAssignError("Pending amount can't be negative"); return; }
      await store.createMembership({
        memberId,
        planId: plan.id,
        startDate: assignForm.startDate,
        endDate: end.toISOString().split("T")[0],
        pendingAmount: pending,
        bonusMonths: bonus,
      });
      setAssigningId(null);
      await load();
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : "Failed to assign plan");
    }
  };

  return (
    <div className="py-5">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-black text-gray-900">Members</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">{loading ? "Loading…" : `${data.length} total`}</span>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              aria-label="Add new member"
              className="w-9 h-9 rounded-full bg-gray-900 hover:bg-gray-800 text-white flex items-center justify-center transition tap"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, phone, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
          />
        </div>
        <div className="relative shrink-0">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" /><line x1="6" y1="12" x2="18" y2="12" /><line x1="10" y1="18" x2="14" y2="18" />
          </svg>
          <select
            aria-label="Sort members"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="appearance-none bg-white border border-gray-200 rounded-xl pl-8 pr-7 py-2.5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 cursor-pointer"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <svg className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg text-gray-900">New Member</h2>
            <button onClick={() => { setShowForm(false); setError(""); }} className="text-gray-400 hover:text-gray-700 p-1">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col items-center gap-3 pb-2">
              <div className="relative">
                {form.photo ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={form.photo} alt="preview" className="w-24 h-24 rounded-full object-cover border-2 border-gray-200" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  </div>
                )}
                {form.photo && (
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, photo: "" }))}
                    className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => cameraRef.current?.click()} disabled={photoBusy} className="text-xs font-semibold bg-gray-900 hover:bg-gray-800 text-white px-3 py-2 rounded-xl disabled:opacity-50">
                  {photoBusy ? "Processing…" : "Take Photo"}
                </button>
                <button type="button" onClick={() => galleryRef.current?.click()} disabled={photoBusy} className="text-xs font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-xl disabled:opacity-50">
                  Gallery
                </button>
              </div>
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoFile} className="hidden" />
              <input ref={galleryRef} type="file" accept="image/*" onChange={handlePhotoFile} className="hidden" />
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1.5 block font-medium">Full Name</label>
              <input required placeholder="e.g. Priya Kumar" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block font-medium">Email <span className="text-gray-400 font-normal">(optional)</span></label>
              <input type="email" placeholder="priya@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block font-medium">Phone</label>
              <input required type="tel" placeholder="9876543210" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button type="submit" className="bg-gray-900 text-white rounded-xl py-3 font-semibold text-sm hover:bg-gray-800 mt-1">
              Add Member
            </button>
          </form>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {loading ? (
          [0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-3">
              <div className="flex items-center gap-3">
                <div className="skeleton w-10 h-10 rounded-lg shrink-0" />
                <div className="flex-1 flex flex-col gap-2">
                  <div className="skeleton h-3.5 w-32" />
                  <div className="skeleton h-3 w-44" />
                </div>
                <div className="skeleton h-5 w-16 rounded-full" />
              </div>
              <div className="mt-2.5 pt-2.5 border-t border-gray-50 flex items-center gap-2">
                <div className="flex-1 flex flex-col gap-1.5">
                  <div className="skeleton h-3 w-48" />
                  <div className="skeleton h-2.5 w-36" />
                </div>
                <div className="skeleton h-7 w-16 rounded-lg" />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400 text-sm">
            {data.length === 0 ? "No members yet" : "No members match your search"}
          </div>
        ) : null}
        {!loading && filtered.map(({ member, status, latestMembership, plan, daysLeft }) => (
          <div key={member.id} className="bg-white rounded-xl border border-gray-100 p-3">
            {assigningId === member.id ? (
              <div className="flex items-center gap-3 -m-0.5 p-0.5">
                <Avatar name={member.name} src={member.photo} className="w-10 h-10 rounded-lg shrink-0" textClassName="text-xs" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-gray-900 leading-tight truncate">{member.name}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5 truncate">{member.membershipId} · {member.phone}</div>
                </div>
                <StatusBadge status={status} />
              </div>
            ) : (
              <>
                <Link href={`/members/${member.id}`} className="flex items-center gap-3 -m-0.5 p-0.5 rounded-lg hover:bg-gray-50 transition">
                  <Avatar name={member.name} src={member.photo} className="w-10 h-10 rounded-lg shrink-0" textClassName="text-xs" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-900 leading-tight truncate">{member.name}</div>
                    <div className="text-[11px] text-gray-400 mt-0.5 truncate">{member.membershipId} · {member.phone}</div>
                  </div>
                  <StatusBadge status={status} />
                </Link>

                <div className="flex items-center justify-between gap-2 mt-2.5 pt-2.5 border-t border-gray-50">
                  <div className="text-xs min-w-0 flex-1">
                    {plan && latestMembership ? (
                      <>
                        <span className="truncate block">
                          <span className="font-medium text-gray-800">{plan.name}</span>
                          <span className="text-gray-400"> · ₹{plan.price} · </span>
                          <span className={daysLeft < 0 ? "text-red-500 font-medium" : daysLeft <= 7 ? "text-amber-600 font-medium" : "text-gray-500"}>
                            {daysLeft < 0 ? `${Math.abs(daysLeft)}d ago` : `${daysLeft}d left`}
                          </span>
                        </span>
                        {(() => {
                          const bonus = effectiveBonus(latestMembership, plan);
                          const totalDays = Math.round((new Date(latestMembership.endDate).getTime() - new Date(latestMembership.startDate).getTime()) / (1000 * 60 * 60 * 24));
                          const bonusDays = bonus > 0
                            ? (() => {
                                const planEnd = new Date(latestMembership.startDate);
                                planEnd.setMonth(planEnd.getMonth() + plan.durationMonths);
                                return Math.round((new Date(latestMembership.endDate).getTime() - planEnd.getTime()) / (1000 * 60 * 60 * 24));
                              })()
                            : 0;
                          const planDays = totalDays - bonusDays;
                          return bonus > 0 ? (
                            <span className="text-[11px] text-emerald-700 truncate block mt-0.5">
                              {planDays}d plan + {bonusDays}d bonus = {totalDays}d total
                            </span>
                          ) : null;
                        })()}
                        <span className="text-[11px] text-gray-400 truncate block mt-0.5">
                          Joined {fmtDate(latestMembership.startDate)} · Ends {fmtDate(latestMembership.endDate)}
                          {(latestMembership.pendingAmount ?? 0) > 0 && (
                            <span className="text-red-500 font-medium"> · ₹{latestMembership.pendingAmount} pending</span>
                          )}
                        </span>
                      </>
                    ) : (
                      <span className="text-gray-400">No active membership</span>
                    )}
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => startAssign(member.id)}
                      className="text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg transition"
                    >
                      {plan ? "Renew" : "Assign"}
                    </button>
                    {plan && latestMembership && daysLeft >= 0 && daysLeft < 30 && (
                      <a href={renewalWaUrl(member.phone, member.name, plan.name, latestMembership.endDate)} target="_blank" rel="noopener noreferrer"
                         aria-label="Send renewal WhatsApp"
                         className="inline-flex items-center justify-center bg-green-500 hover:bg-green-600 text-white w-8 h-8 rounded-lg transition">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4s-1 1-1 2.5 1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.2.2-1.4-.1-.2-.3-.3-.6-.4zM12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.2-1.4c1.4.8 3.1 1.2 4.8 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18c-1.5 0-3-.4-4.3-1.2l-.3-.2-3.1.8.8-3-.2-.3C4.1 14.7 3.7 13.4 3.7 12c0-4.6 3.7-8.3 8.3-8.3s8.3 3.7 8.3 8.3-3.7 8-8.3 8z"/></svg>
                      </a>
                    )}
                    {plan && status === "expired" && (
                      <a href={reactivationWaUrl(member.phone, member.name, plan.name)} target="_blank" rel="noopener noreferrer"
                         aria-label="Send reactivation WhatsApp"
                         className="inline-flex items-center justify-center bg-red-600 hover:bg-red-700 text-white w-8 h-8 rounded-lg transition">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4s-1 1-1 2.5 1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.2.2-1.4-.1-.2-.3-.3-.6-.4zM12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.2-1.4c1.4.8 3.1 1.2 4.8 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18c-1.5 0-3-.4-4.3-1.2l-.3-.2-3.1.8.8-3-.2-.3C4.1 14.7 3.7 13.4 3.7 12c0-4.6 3.7-8.3 8.3-8.3s8.3 3.7 8.3 8.3-3.7 8-8.3 8z"/></svg>
                      </a>
                    )}
                    {!plan && (
                      <a href={inviteWaUrl(member.phone, member.name)} target="_blank" rel="noopener noreferrer"
                         aria-label="Send invite WhatsApp"
                         className="inline-flex items-center justify-center bg-green-500 hover:bg-green-600 text-white w-8 h-8 rounded-lg transition">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4s-1 1-1 2.5 1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.2.2-1.4-.1-.2-.3-.3-.6-.4zM12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.2-1.4c1.4.8 3.1 1.2 4.8 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18c-1.5 0-3-.4-4.3-1.2l-.3-.2-3.1.8.8-3-.2-.3C4.1 14.7 3.7 13.4 3.7 12c0-4.6 3.7-8.3 8.3-8.3s8.3 3.7 8.3 8.3-3.7 8-8.3 8z"/></svg>
                      </a>
                    )}
                  </div>
                </div>
              </>
            )}

            {assigningId === member.id ? (
              <form onSubmit={(e) => submitAssign(e, member.id)} className="flex flex-col gap-2 pt-3 border-t border-gray-100">
                <select
                  required
                  value={assignForm.planId}
                  onChange={(e) => setAssignForm({ ...assignForm, planId: e.target.value })}
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white"
                >
                  <option value="">Select a plan…</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} — {p.durationMonths}mo — ₹{p.price}</option>
                  ))}
                </select>
                <input
                  required
                  type="date"
                  value={assignForm.startDate}
                  onChange={(e) => setAssignForm({ ...assignForm, startDate: e.target.value })}
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Pending amount (₹) — leave 0 if fully paid"
                  value={assignForm.pendingAmount}
                  onChange={(e) => setAssignForm({ ...assignForm, pendingAmount: e.target.value })}
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Bonus months (optional) — e.g. 1"
                  value={assignForm.bonusMonths}
                  onChange={(e) => setAssignForm({ ...assignForm, bonusMonths: e.target.value })}
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
                />
                {assignError && <p className="text-red-500 text-xs">{assignError}</p>}
                <div className="flex gap-2">
                  <button type="button" onClick={cancelAssign} className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-2 font-semibold text-sm hover:bg-gray-50">
                    Cancel
                  </button>
                  <button type="submit" className="flex-[2] bg-gray-900 text-white rounded-xl py-2 font-semibold text-sm hover:bg-gray-800">
                    Assign
                  </button>
                </div>
              </form>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
