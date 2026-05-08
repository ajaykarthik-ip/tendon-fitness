"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Me {
  id: string;
  username: string;
  name: string;
}

export default function AdminProfilePage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then(setMe)
      .finally(() => setLoading(false));
  }, []);

  const change = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (newPassword !== confirmPassword) {
      setMsg({ kind: "err", text: "New passwords do not match" });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg({ kind: "err", text: data.error || "Failed to change password" });
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMsg({ kind: "ok", text: "Password updated" });
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  };

  if (loading) {
    return <div className="py-10 text-center text-gray-400 text-sm">Loading…</div>;
  }

  return (
    <div className="py-5">
      <h1 className="text-3xl font-black text-gray-900 mb-5">Admin</h1>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-4">
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Signed in as</div>
        <div className="text-lg font-bold text-gray-900">{me?.name || me?.username}</div>
        <div className="text-sm text-gray-500">@{me?.username}</div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-4">
        <h2 className="font-bold text-base text-gray-900 mb-3">Change password</h2>
        <form onSubmit={change} className="flex flex-col gap-3">
          <input type="text" name="username" autoComplete="username" defaultValue={me?.username} hidden readOnly />
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block font-medium">Current password</label>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block font-medium">New password</label>
            <input
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block font-medium">Confirm new password</label>
            <input
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>
          {msg && (
            <p className={`text-xs ${msg.kind === "ok" ? "text-green-600" : "text-red-500"}`}>
              {msg.text}
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="bg-gray-900 text-white rounded-xl py-3 font-semibold text-sm hover:bg-gray-800 disabled:opacity-50"
          >
            {busy ? "Updating…" : "Update password"}
          </button>
        </form>
      </div>

      <button
        onClick={logout}
        className="w-full bg-white border border-red-200 text-red-600 rounded-2xl py-3 font-semibold text-sm hover:bg-red-50"
      >
        Sign out
      </button>
    </div>
  );
}
