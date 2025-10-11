"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";


export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;      
    setLoading(true);
    setErr("");

    try {
      const r = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data.message || "Falha no login");
      }

      router.push(next);
      router.refresh();
    } catch (e: unknown) {
      setErr(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh flex items-center justify-center  ">
      <form noValidate onSubmit={onSubmit} className="w-full max-w-sm secondary-background p-6 rounded-lg shadow-lg space-y-5">
        <h1 className="text-8xl font-bold text-white text-center">LOGIN</h1>

        <input
          className="w-full  rounded px-3 py-2 text-white transaction-background"
          type="email"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          className="w-full  rounded px-3 py-2 text-white transaction-background"
          type="password"
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {err && <p className="text-red-600 text-sm">{err}</p>}

        <button
          className="w-full py-2 rounded bg-gray-300 text-black font-semibold disabled:opacity-50 "
          disabled={loading}
          type="submit"
        >
          {loading ? "Join..." : "Join"}
        </button>
      </form>
    </main>
  );
}