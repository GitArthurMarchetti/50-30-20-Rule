"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export default function LoginPage() {
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
    <main className="min-h-dvh flex items-center justify-center bg-gray-100 p-4">
      <form noValidate onSubmit={onSubmit} className="w-full max-w-sm bg-white p-6 rounded-lg shadow space-y-3">
        <h1 className="text-2xl font-bold">Entrar</h1>

        <input
          className="w-full border rounded px-3 py-2"
          type="email"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          className="w-full border rounded px-3 py-2"
          type="password"
          placeholder="senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {err && <p className="text-red-600 text-sm">{err}</p>}

        <button
          className="w-full py-2 rounded bg-blue-600 text-white font-semibold disabled:opacity-60"
          disabled={loading}
          type="submit"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}
