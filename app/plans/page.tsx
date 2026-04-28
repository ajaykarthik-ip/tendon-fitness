"use client";
import { useEffect, useState } from "react";
import { store, Plan } from "@/lib/store";

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [form, setForm] = useState({ name: "", price: "", description: "" });
  const [error, setError] = useState("");

  useEffect(() => { setPlans(store.getPlans()); }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name || !form.price) { setError("Name and price are required."); return; }
    const newPlan: Plan = {
      id: Date.now().toString(),
      name: form.name,
      price: Number(form.price),
      description: form.description,
    };
    const updated = [newPlan, ...plans];
    store.savePlans(updated);
    setPlans(updated);
    setForm({ name: "", price: "", description: "" });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Plans</h1>
      <div className="grid md:grid-cols-3 gap-6">
        <div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="font-semibold text-gray-700 mb-4">Create New Plan</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                required
                placeholder="Plan Name (e.g. Monthly)"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              <input
                required
                type="number"
                min="0"
                placeholder="Price (₹)"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              <textarea
                placeholder="Description (optional)"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
              />
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <button
                type="submit"
                className="bg-green-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-green-700"
              >
                Create Plan
              </button>
            </form>
          </div>
        </div>

        <div className="md:col-span-2 flex flex-col gap-3">
          {plans.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex justify-between items-center">
              <div>
                <div className="font-semibold text-gray-800">{p.name}</div>
                {p.description && <div className="text-sm text-gray-400 mt-0.5">{p.description}</div>}
              </div>
              <div className="text-xl font-bold text-green-600">₹{p.price}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
