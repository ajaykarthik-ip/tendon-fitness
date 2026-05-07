"use client";
import { useEffect, useMemo, useState } from "react";
import { store, Plan } from "@/lib/store";

const PRESETS = [1, 3, 6, 12];
const EMPTY_FORM = { name: "", price: "", durationMonths: 1, customMonths: "", description: "" };

function termLabel(months: number) {
  if (months === 1) return "Monthly";
  if (months === 12) return "Annual";
  if (months % 12 === 0) return `${months / 12}-Year`;
  return `${months}-Month`;
}

const fmt = (n: number) => n.toLocaleString("en-IN");

function Spinner({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.2" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

type FormState = typeof EMPTY_FORM;

function PlanForm({
  mode, form, setForm, error, submitting, onCancel, onSubmit,
}: {
  mode: "create" | "edit";
  form: FormState;
  setForm: (f: FormState) => void;
  error: string;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const previewMonths = form.durationMonths === 0 ? Number(form.customMonths) : form.durationMonths;
  const showPriceHint = form.price && previewMonths > 0;
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-lg text-gray-900">{mode === "edit" ? "Edit Plan" : "New Plan"}</h2>
        <button
          onClick={onCancel}
          aria-label="Close"
          className="text-gray-400 hover:text-gray-700 p-1"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1.5 block font-medium">Plan Name</label>
          <input
            required
            placeholder="e.g. Annual, Quarterly"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
          />
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1.5 block font-medium">Term</label>
          <div className="grid grid-cols-5 gap-1.5">
            {PRESETS.map((m) => {
              const active = form.durationMonths === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setForm({ ...form, durationMonths: m, customMonths: "" })}
                  className={`py-2.5 rounded-xl text-xs font-semibold border transition ${
                    active
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {m === 12 ? "1 yr" : `${m} mo`}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setForm({ ...form, durationMonths: 0 })}
              className={`py-2.5 rounded-xl text-xs font-semibold border transition ${
                form.durationMonths === 0
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
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
              inputMode="numeric"
              placeholder="Number of months"
              value={form.customMonths}
              onChange={(e) => setForm({ ...form, customMonths: e.target.value })}
              className="w-full mt-2 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          )}
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1.5 block font-medium">Price (₹)</label>
          <div className="relative">
            <input
              required
              type="number"
              min="0"
              inputMode="numeric"
              placeholder="0"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 pr-24"
            />
            {showPriceHint && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 tabular-nums">
                ₹{fmt(Math.round(Number(form.price) / previewMonths))}/mo
              </span>
            )}
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1.5 block font-medium">
            Description <span className="text-gray-400 font-normal">— optional</span>
          </label>
          <textarea
            placeholder="What's included?"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none"
          />
        </div>

        {error && <p className="text-red-500 text-xs">{error}</p>}

        <div className="flex gap-2 mt-1">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-3 font-semibold text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-[2] bg-gray-900 hover:bg-gray-800 text-white rounded-xl py-3 font-semibold text-sm disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {submitting && <Spinner className="w-4 h-4" />}
            {submitting
              ? mode === "edit" ? "Saving…" : "Creating…"
              : mode === "edit" ? "Save Plan" : "Create Plan"}
          </button>
        </div>
      </form>
    </div>
  );
}

function PlanCard({
  plan, onEdit, onDelete, deleting,
}: {
  plan: Plan;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const perMo = Math.round(plan.price / plan.durationMonths);
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 p-4 transition ${deleting ? "opacity-50" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold tracking-wide uppercase text-gray-500">
              {termLabel(plan.durationMonths)}
            </span>
          </div>
          <h3 className="font-bold text-gray-900 leading-tight truncate">{plan.name}</h3>
          {plan.description && (
            <p className="text-xs text-gray-500 mt-1 leading-snug line-clamp-2">{plan.description}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className="text-xl font-bold text-gray-900 tabular-nums">₹{fmt(plan.price)}</div>
          <div className="text-[11px] text-gray-400 mt-0.5 tabular-nums">₹{fmt(perMo)}/mo</div>
        </div>
      </div>

      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
        <button
          onClick={onEdit}
          disabled={deleting}
          className="flex-1 text-xs font-semibold bg-gray-50 hover:bg-gray-100 text-gray-800 px-3 py-2 rounded-xl transition disabled:opacity-50"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          disabled={deleting}
          className="flex-1 text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          {deleting && <Spinner className="w-3 h-3" />}
          {deleting ? "Removing" : "Delete"}
        </button>
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 flex flex-col gap-2">
          <div className="skeleton h-3 w-20" />
          <div className="skeleton h-5 w-32" />
          <div className="skeleton h-3 w-44" />
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="skeleton h-6 w-20" />
          <div className="skeleton h-3 w-12" />
        </div>
      </div>
      <div className="skeleton h-8 w-full mt-3" />
    </div>
  );
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    try {
      setPlans(await store.getPlans());
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  const sortedPlans = useMemo(
    () => [...plans].sort((a, b) => a.price / a.durationMonths - b.price / b.durationMonths),
    [plans]
  );

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
    setShowForm(false);
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
      name: form.name.trim(),
      price: Number(form.price),
      durationMonths: months,
      description: form.description.trim(),
    };
    setSubmitting(true);
    try {
      if (editingId) {
        const updated = await store.updatePlan(editingId, payload);
        setPlans((prev) => prev.map((p) => (p.id === editingId ? updated : p)));
      } else {
        const created = await store.createPlan(payload);
        setPlans((prev) => [created, ...prev]);
      }
      closeForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save plan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this plan? This cannot be undone.")) return;
    setDeletingId(id);
    const prev = plans;
    setPlans((p) => p.filter((x) => x.id !== id));
    try {
      await store.deletePlan(id);
      if (editingId === id) closeForm();
    } catch (err) {
      setPlans(prev);
      setError(err instanceof Error ? err.message : "Failed to delete plan");
    } finally {
      setDeletingId(null);
    }
  };

  const isCreating = showForm && !editingId;
  const isEditing = editingId !== null;

  return (
    <div className="py-5">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-black text-gray-900">Plans</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">{plans.length} total</span>
          {!isCreating && !isEditing && (
            <button
              onClick={() => { setForm(EMPTY_FORM); setEditingId(null); setError(""); setShowForm(true); }}
              aria-label="Add new plan"
              className="w-9 h-9 rounded-full bg-gray-900 hover:bg-gray-800 text-white flex items-center justify-center transition tap"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          )}
        </div>
      </div>
      <p className="text-sm text-gray-400 mb-4">Membership tiers and pricing</p>

      {isCreating && (
        <div className="mb-4">
          <PlanForm
            mode="create"
            form={form}
            setForm={setForm}
            error={error}
            submitting={submitting}
            onCancel={closeForm}
            onSubmit={handleSubmit}
          />
        </div>
      )}

      <div className="flex flex-col gap-3">
        {loading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : plans.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400 text-sm">
            No plans yet
          </div>
        ) : (
          sortedPlans.map((p) =>
            editingId === p.id ? (
              <PlanForm
                key={p.id}
                mode="edit"
                form={form}
                setForm={setForm}
                error={error}
                submitting={submitting}
                onCancel={closeForm}
                onSubmit={handleSubmit}
              />
            ) : (
              <PlanCard
                key={p.id}
                plan={p}
                onEdit={() => startEdit(p)}
                onDelete={() => handleDelete(p.id)}
                deleting={deletingId === p.id}
              />
            )
          )
        )}
      </div>
    </div>
  );
}
