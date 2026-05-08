"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }
      router.replace(next);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <form
        onSubmit={submit}
        method="post"
        action="/api/auth/login"
        className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-4"
      >
        <div className="text-center mb-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gray-900 flex items-center justify-center mb-3">
            <span className="text-white font-bold text-sm tracking-tight">TF</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Admin Sign in</h1>
          <p className="text-xs text-gray-500 mt-1">Tendon Fitness</p>
        </div>

        <div>
          <label htmlFor="username" className="text-xs text-gray-500 mb-1.5 block font-medium">
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
          />
        </div>
        <div>
          <label htmlFor="password" className="text-xs text-gray-500 mb-1.5 block font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
          />
        </div>

        {error && <p className="text-red-500 text-xs">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="bg-gray-900 text-white rounded-xl py-3 font-semibold text-sm hover:bg-gray-800 disabled:opacity-50"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
