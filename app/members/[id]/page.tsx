"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { store, Member, Membership, Plan, getDaysLeft } from "@/lib/store";
import Avatar from "@/components/Avatar";
import { compressImage } from "@/lib/image";

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function MemberProfilePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();

  const [member, setMember] = useState<Member | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", photo: "" });
  const [error, setError] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const [assigning, setAssigning] = useState(false);
  const [assignForm, setAssignForm] = useState({ planId: "", startDate: new Date().toISOString().split("T")[0] });
  const [assignError, setAssignError] = useState("");
  const [assignSaving, setAssignSaving] = useState(false);

  const [editingMs, setEditingMs] = useState<string | null>(null);
  const [msForm, setMsForm] = useState({ planId: "", startDate: "" });
  const [msError, setMsError] = useState("");
  const [msSaving, setMsSaving] = useState(false);

  const startEditMs = (ms: Membership) => {
    setMsForm({ planId: ms.planId, startDate: ms.startDate });
    setMsError("");
    setEditingMs(ms.id);
  };

  const submitEditMs = async (e: React.FormEvent, msId: string) => {
    e.preventDefault();
    setMsError("");
    const plan = plans.find((p) => p.id === msForm.planId);
    if (!plan) { setMsError("Pick a plan"); return; }
    if (!msForm.startDate) { setMsError("Pick a start date"); return; }
    const end = new Date(msForm.startDate);
    end.setMonth(end.getMonth() + plan.durationMonths);
    setMsSaving(true);
    try {
      await store.updateMembership(msId, {
        planId: plan.id,
        startDate: msForm.startDate,
        endDate: end.toISOString().split("T")[0],
      });
      setEditingMs(null);
      await load();
    } catch (err) {
      setMsError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setMsSaving(false);
    }
  };

  const startAssign = () => {
    setAssignForm({ planId: "", startDate: new Date().toISOString().split("T")[0] });
    setAssignError("");
    setAssigning(true);
  };

  const submitAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;
    setAssignError("");
    const plan = plans.find((p) => p.id === assignForm.planId);
    if (!plan) { setAssignError("Pick a plan"); return; }
    if (!assignForm.startDate) { setAssignError("Pick a start date"); return; }
    const end = new Date(assignForm.startDate);
    end.setMonth(end.getMonth() + plan.durationMonths);
    setAssignSaving(true);
    try {
      await store.createMembership({
        memberId: member.id,
        planId: plan.id,
        startDate: assignForm.startDate,
        endDate: end.toISOString().split("T")[0],
      });
      setAssigning(false);
      await load();
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : "Failed to assign plan");
    } finally {
      setAssignSaving(false);
    }
  };

  async function load() {
    setLoading(true);
    try {
      const [members, allMs, allPlans] = await Promise.all([
        store.getMembers(), store.getMemberships(), store.getPlans(),
      ]);
      const m = members.find((x) => x.id === id) ?? null;
      setMember(m);
      setMemberships(allMs.filter((x) => x.memberId === id).sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime()));
      setPlans(allPlans);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, [id]);

  const startEdit = () => {
    if (!member) return;
    setForm({ name: member.name, email: member.email, phone: member.phone, photo: member.photo ?? "" });
    setEditing(true);
    setError("");
  };

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

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;
    setError("");
    setSaving(true);
    try {
      await store.updateMember(member.id, {
        name: form.name,
        email: form.email,
        phone: form.phone,
        photo: form.photo,
      });
      setEditing(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!member) return;
    if (!confirm(`Delete ${member.name}? This also removes all their memberships and cannot be undone.`)) return;
    try {
      await Promise.all(memberships.map((m) => store.deleteMembership(m.id)));
      await store.deleteMember(member.id);
      router.push("/users");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const removeMembership = async (msId: string) => {
    if (!confirm("Remove this membership record?")) return;
    try {
      await store.deleteMembership(msId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove");
    }
  };

  if (loading) {
    return <div className="py-10 text-center text-gray-400 text-sm">Loading…</div>;
  }
  if (!member) {
    return (
      <div className="py-10 text-center">
        <p className="text-gray-500 mb-4">Member not found</p>
        <Link href="/users" className="text-blue-600 text-sm font-semibold">Back to Members</Link>
      </div>
    );
  }

  const latest = memberships[0];
  const latestPlan = latest ? plans.find((p) => p.id === latest.planId) : null;
  const dl = latest ? getDaysLeft(latest.endDate) : 0;

  return (
    <div className="py-5">
      <Link href="/users" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-4">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back
      </Link>

      {!editing ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
          <div className="flex flex-col items-center text-center mb-4">
            <Avatar name={member.name} src={member.photo} className="w-24 h-24 rounded-full mb-3" textClassName="text-2xl" />
            <h1 className="text-2xl font-black text-gray-900">{member.name}</h1>
            <p className="text-xs text-gray-400 mt-0.5">{member.membershipId}</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-3 flex flex-col gap-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Phone</span>
              <a href={`tel:${member.phone}`} className="font-medium text-gray-900">{member.phone}</a>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Email</span>
              <span className="font-medium text-gray-900 truncate ml-2">{member.email}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Joined</span>
              <span className="font-medium text-gray-900">{fmtDate(member.createdAt)}</span>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button onClick={startEdit} className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-sm py-2.5 rounded-xl transition">
              Edit Profile
            </button>
            <button onClick={handleDelete} className="bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-sm px-4 py-2.5 rounded-xl transition">
              Delete
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg text-gray-900">Edit Profile</h2>
            <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-700 p-1">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <form onSubmit={saveEdit} className="flex flex-col gap-3">
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
                  <button type="button" onClick={() => setForm((f) => ({ ...f, photo: "" }))}
                    className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => cameraRef.current?.click()} disabled={photoBusy}
                  className="text-xs font-semibold bg-gray-900 hover:bg-gray-800 text-white px-3 py-2 rounded-xl disabled:opacity-50">
                  {photoBusy ? "Processing…" : "Take Photo"}
                </button>
                <button type="button" onClick={() => galleryRef.current?.click()} disabled={photoBusy}
                  className="text-xs font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-xl disabled:opacity-50">
                  Gallery
                </button>
              </div>
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoFile} className="hidden" />
              <input ref={galleryRef} type="file" accept="image/*" onChange={handlePhotoFile} className="hidden" />
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1.5 block font-medium">Full Name</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block font-medium">Email</label>
              <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block font-medium">Phone</label>
              <input required type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <div className="flex gap-2 mt-1">
              <button type="button" onClick={() => setEditing(false)}
                className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-3 font-semibold text-sm hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="flex-[2] bg-gray-900 text-white rounded-xl py-3 font-semibold text-sm hover:bg-gray-800 disabled:opacity-50">
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold text-gray-900">Current Membership</h2>
          {!assigning && (
            <button onClick={startAssign} className="text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg transition">
              {latest ? "Renew / New" : "Assign Plan"}
            </button>
          )}
        </div>
        {latest && latestPlan ? (
          editingMs === latest.id ? (
            (() => {
              const editPlan = plans.find((p) => p.id === msForm.planId);
              const previewEnd = editPlan && msForm.startDate
                ? (() => { const d = new Date(msForm.startDate); d.setMonth(d.getMonth() + editPlan.durationMonths); return fmtDate(d.toISOString().split("T")[0]); })()
                : null;
              return (
                <form onSubmit={(e) => submitEditMs(e, latest.id)} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg text-gray-900">Edit Membership</h3>
                    <button type="button" onClick={() => setEditingMs(null)} aria-label="Close" className="text-gray-400 hover:text-gray-700 p-1">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block font-medium">Plan</label>
                    <select required value={msForm.planId} onChange={(e) => setMsForm({ ...msForm, planId: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-300">
                      <option value="">Select a plan…</option>
                      {plans.map((p) => (<option key={p.id} value={p.id}>{p.name} — {p.durationMonths}mo — ₹{p.price}</option>))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block font-medium">Start Date</label>
                    <input required type="date" value={msForm.startDate} onChange={(e) => setMsForm({ ...msForm, startDate: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
                  </div>

                  {previewEnd && (
                    <div className="bg-gray-50 rounded-xl px-4 py-3 text-xs text-gray-600">
                      Ends on <span className="font-semibold text-gray-900">{previewEnd}</span>
                      <span className="text-gray-400"> · auto-calculated from plan duration</span>
                    </div>
                  )}

                  {msError && <p className="text-red-500 text-xs">{msError}</p>}

                  <div className="flex gap-2 mt-1">
                    <button type="button" onClick={() => setEditingMs(null)} className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-3 font-semibold text-sm hover:bg-gray-50">Cancel</button>
                    <button type="submit" disabled={msSaving} className="flex-[2] bg-gray-900 text-white rounded-xl py-3 font-semibold text-sm hover:bg-gray-800 disabled:opacity-50">
                      {msSaving ? "Saving…" : "Save Membership"}
                    </button>
                  </div>
                </form>
              );
            })()
          ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold text-gray-900">{latestPlan.name}</div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                dl < 0 ? "bg-red-100 text-red-600" : dl <= 7 ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
              }`}>
                {dl < 0 ? `${Math.abs(dl)}d AGO` : dl === 0 ? "TODAY" : `${dl}d LEFT`}
              </span>
            </div>
            <div className="text-xs text-gray-500 flex flex-col gap-1 mb-3">
              <div>₹{latestPlan.price} · {latestPlan.durationMonths}mo</div>
              <div>{fmtDate(latest.startDate)} → {fmtDate(latest.endDate)}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => startEditMs(latest)} className="flex-1 text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 rounded-lg transition">
                Edit
              </button>
              <button onClick={() => removeMembership(latest.id)} className="text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-lg transition">
                Remove
              </button>
            </div>
          </div>
          )
        ) : !assigning ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center text-gray-400 text-sm">
            No active membership
          </div>
        ) : null}

        {assigning && (
          <form onSubmit={submitAssign} className="bg-white rounded-2xl border border-gray-200 p-4 mt-2 flex flex-col gap-2.5">
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block font-medium">Plan</label>
              <select
                required
                value={assignForm.planId}
                onChange={(e) => setAssignForm({ ...assignForm, planId: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                <option value="">Select a plan…</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} — {p.durationMonths}mo — ₹{p.price}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block font-medium">Start Date</label>
              <input
                required
                type="date"
                value={assignForm.startDate}
                onChange={(e) => setAssignForm({ ...assignForm, startDate: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
            </div>
            {assignError && <p className="text-red-500 text-xs">{assignError}</p>}
            <div className="flex gap-2 mt-1">
              <button type="button" onClick={() => setAssigning(false)} className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-2.5 font-semibold text-sm hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" disabled={assignSaving} className="flex-[2] bg-gray-900 text-white rounded-xl py-2.5 font-semibold text-sm hover:bg-gray-800 disabled:opacity-50">
                {assignSaving ? "Assigning…" : "Assign"}
              </button>
            </div>
          </form>
        )}
      </div>

      {memberships.length > 1 && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">History</h2>
          <div className="flex flex-col gap-2">
            {memberships.slice(1).map((m) => {
              const p = plans.find((pl) => pl.id === m.planId);
              return (
                <div key={m.id} className="bg-white rounded-2xl border border-gray-100 p-3 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm">{p?.name ?? "Unknown plan"}</div>
                    <div className="text-xs text-gray-400">{fmtDate(m.startDate)} → {fmtDate(m.endDate)}</div>
                  </div>
                  <button onClick={() => removeMembership(m.id)} className="text-xs text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg font-medium">
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
