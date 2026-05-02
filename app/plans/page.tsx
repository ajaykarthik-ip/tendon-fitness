"use client";
import { useEffect, useState } from "react";
import { store, Plan } from "@/lib/store";

const PRESETS = [1, 3, 6, 12];

const EMPTY_FORM = { name: "", price: "", durationMonths: 1, customMonths: "", description: "" };

function termLabel(months: number) {
  if (months === 1) return "1 Month";
  if (months === 12) return "1 Year";
  if (months % 12 === 0) return `${months / 12} Years`;
  return `${months} Months`;
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setPlans(await store.getPlans());
  }
  useEffect(() => { load(); }, []);

  const startEdit = (p: Plan) => {
    const isPreset = PRESETS.includes(p.durationMonths);
    setEditingId(p.id);
    setForm({
      name: p.name,
      price: String(p.price),
      durationMonths: isPreset ? p.durationMonths : 0,
      customMonths: isPreset ? "" : String(p.durationMonths),
      description: p.description,
    });
    setError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name || !form.price) { setError("Name and price are required."); return; }
    const months = form.durationMonths === 0 ? Number(form.customMonths) : form.durationMonths;
    if (!months || months < 1) { setError("Term must be at least 1 month."); return; }
    const payload = {
      name: form.name,
      price: Number(form.price),
      durationMonths: months as number,
      description: form.description,
    };
    try {
      if (editingId) await store.updatePlan(editingId, payload);
      else await store.createPlan(payload);
      closeForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save plan");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this plan? This cannot be undone.")) return;
    try {
      await store.deletePlan(id);
      if (editingId === id) closeForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete plan");
    }
  };

  return (
    <div className="py-5">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-black text-gray-900">Plans</h1>
        <span className="text-sm text-gray-400">{plans.length} active</span>
      </div>
      <p className="text-sm text-gray-400 mb-6">Membership tiers and pricing</p>

      {!showForm && (
        <button
          onClick={() => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(true); }}
          className="w-full mb-4 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl px-4 py-3.5 font-semibold text-sm flex items-center justify-center gap-2 transition"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Create New Plan
        </button>
      )}

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg text-gray-900">
              {editingId ? "Edit Plan" : "New Plan"}
            </h2>
            <button onClick={closeForm} className="text-gray-400 hover:text-gray-700 p-1">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block font-medium">Plan Name</label>
              <input
                required
                placeholder="e.g. Monthly, Quarterly"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1.5 block font-medium">Term</label>
              <div className="grid grid-cols-5 gap-2">
                {PRESETS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setForm({ ...form, durationMonths: m, customMonths: "" })}
                    className={`py-2.5 rounded-xl text-xs font-bold transition ${
                      form.durationMonths === m
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {m === 12 ? "1y" : `${m}mo`}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setForm({ ...form, durationMonths: 0 })}
                  className={`py-2.5 rounded-xl text-xs font-bold transition ${
                    form.durationMonths === 0
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Custom
                </button>
              </div>
              {form.durationMonths === 0 && (
                <input
                  required
                  type="number"
                  min="1"
                  placeholder="Number of months"
                  value={form.customMonths}
                  onChange={(e) => setForm({ ...form, customMonths: e.target.value })}
                  className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                />
              )}
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1.5 block font-medium">Price (₹)</label>
              <input
                required
                type="number"
                min="0"
                placeholder="0"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1.5 block font-medium">Description (optional)</label>
              <textarea
                placeholder="What does this plan include?"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none"
              />
            </div>

            {error && <p className="text-red-500 text-xs">{error}</p>}

            <button
              type="submit"
              className="bg-gray-900 text-white rounded-xl py-3 font-semibold text-sm hover:bg-gray-800 mt-1"
            >
              {editingId ? "Save Changes" : "Create Plan"}
            </button>
          </form>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {plans.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-sm">No plans yet. Tap + to create one.</p>
          </div>
        )}
        {plans.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="font-bold text-gray-900 text-lg">{p.name}</div>
                  <span className="text-[10px] font-bold uppercase tracking-wide bg-gray-900 text-white px-2 py-0.5 rounded-full">
                    {termLabel(p.durationMonths)}
                  </span>
                </div>
                {p.description && <div className="text-xs text-gray-500 mt-1">{p.description}</div>}
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-gray-900">₹{p.price}</div>
                <div className="text-[10px] text-gray-400 uppercase tracking-wide">
                  ₹{Math.round(p.price / p.durationMonths)}/mo
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
              <button
                onClick={() => startEdit(p)}
                className="flex-1 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 py-2 rounded-xl transition"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(p.id)}
                className="flex-1 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 py-2 rounded-xl transition"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
