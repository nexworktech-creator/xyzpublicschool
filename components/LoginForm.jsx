"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm({ portal, redirectTo, title, subtitle }) {
  const router = useRouter();
  const [mode, setMode] = useState("password"); // "password" | "pin"
  const [form, setForm] = useState({ email: "", password: "" });
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const body = mode === "pin" ? { pin, portal } : { ...form, portal };
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-5 py-16">
      <p className="font-display text-sm italic text-brass-600">XYZ Public School</p>
      <h1 className="mt-1 font-display text-3xl text-navy">{title}</h1>
      <p className="mt-2 text-sm text-navy-600">{subtitle}</p>

      {(portal === "admin" || portal === "teacher") && (
        <div className="mt-6 flex gap-2 text-xs">
          <button type="button" onClick={() => setMode("password")}
            className={`rounded-sm border px-3 py-1.5 ${mode === "password" ? "border-brass bg-brass-50 text-navy" : "border-navy-100 text-navy-400"}`}>
            Email &amp; Password
          </button>
          <button type="button" onClick={() => setMode("pin")}
            className={`rounded-sm border px-3 py-1.5 ${mode === "pin" ? "border-brass bg-brass-50 text-navy" : "border-navy-100 text-navy-400"}`}>
            Quick PIN
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-4 space-y-4 rounded-sm border border-navy-100 bg-white p-6 shadow-plaque">
        {mode === "pin" ? (
          <div>
            <label htmlFor="pin" className="mb-1 block text-sm text-navy-600">
              {portal === "teacher" ? "Teacher PIN" : "Admin PIN"}
            </label>
            <input
              id="pin"
              type="password"
              inputMode="numeric"
              required
              autoComplete="off"
              placeholder={portal === "teacher" ? "Ask Admin to set your PIN" : "Default: 12345"}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full rounded-sm border border-navy-100 px-3 py-2 text-sm tracking-widest focus:border-brass"
            />
          </div>
        ) : (
          <>
            <div>
              <label htmlFor="email" className="mb-1 block text-sm text-navy-600">Email</label>
              <input
                id="email"
                type="email"
                required
                autoComplete="username"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-sm border border-navy-100 px-3 py-2 text-sm focus:border-brass"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1 block text-sm text-navy-600">Password</label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="Default: 12345"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-sm border border-navy-100 px-3 py-2 text-sm focus:border-brass"
              />
            </div>
          </>
        )}

        {error && <p className="text-sm text-maroon" role="alert">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-sm bg-navy px-5 py-2.5 text-sm font-medium text-ivory transition-colors hover:bg-navy-600 disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
