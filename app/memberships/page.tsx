"use client";
import { useEffect, useState } from "react";
import { store, Member, Plan, Membership, sendWhatsApp, WHATSAPP_NUMBER } from "@/lib/store";

export default function MembershipsPage() {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [form, setForm] = useState({ memberId: "", planId: "", startDate: "", endDate: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    setMemberships(store.getMemberships());
    setMembers(store.getMembers());
    setPlans(store.getPlans());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (new Date(form.endDate) <= new Date(form.startDate)) {
      setError("End date must be after start date.");
      return;
    }
    const newM: Membership = { id: Date.now().toString(), ...form };
    const updated = [newM, ...memberships];
    store.saveMemberships(updated);
    setMemberships(updated);
    setForm({ memberId: "", planId: "", startDate: "", endDate: "" });
  };

  const getMember = (id: string) => members.find((m) => m.id === id);
  const getPlan = (id: string) => plans.find((p) => p.id === id);
  const isActive = (endDate: string) => new Date(endDate) >= new Date();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Memberships</h1>
      <p className="text-sm text-gray-400 mb-6">
        WhatsApp messages go to <span className="font-medium text-gray-600">+91 {WHATSAPP_NUMBER.slice(2)}</span>
      </p>

      <div className="grid md:grid-cols-3 gap-6">
        <div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="font-semibold text-gray-700 mb-4">Assign Membership</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <select
                required
                value={form.memberId}
                onChange={(e) => setForm({ ...form, memberId: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <option value="">Select Member</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              <select
                required
                value={form.planId}
                onChange={(e) => setForm({ ...form, planId: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <option value="">Select Plan</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} — ₹{p.price}</option>
                ))}
              </select>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Start Date</label>
                <input
                  required
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">End Date</label>
                <input
                  required
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <button
                type="submit"
                className="bg-purple-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-purple-700"
              >
                Assign
              </button>
            </form>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Member</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Plan</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Start</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">End</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Notify</th>
                </tr>
              </thead>
              <tbody>
                {memberships.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-400">No memberships yet</td></tr>
                )}
                {memberships.map((m) => {
                  const member = getMember(m.memberId);
                  const plan = getPlan(m.planId);
                  const active = isActive(m.endDate);
                  return (
                    <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{member?.name ?? "—"}</div>
                        <div className="text-xs text-gray-400">{member?.phone}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{plan?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-500">{new Date(m.startDate).toLocaleDateString("en-IN")}</td>
                      <td className="px-4 py-3 text-gray-500">{new Date(m.endDate).toLocaleDateString("en-IN")}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                          {active ? "Active" : "Expired"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => sendWhatsApp(member?.name ?? "", plan?.name ?? "", m.endDate)}
                          className="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition"
                        >
                          WhatsApp
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
