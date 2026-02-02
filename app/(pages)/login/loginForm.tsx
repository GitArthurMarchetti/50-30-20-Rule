"use client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { authService } from "@/app/lib/client/auth-service";
import { ApiError } from "@/app/lib/client/api-client";
import { EMAIL_REGEX } from "@/app/lib/validation-constants";


export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = useMemo(() => params.get("next") || "/", [params]);
  const registered = useMemo(() => params.get("registered") === "true", [params]);

  const emailInputRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const lastSubmitTimeRef = useRef<number>(0);

  // Load saved email from localStorage (only once on mount)
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem("rememberedEmail");
      if (savedEmail) {
        setEmail(savedEmail);
        setEmailValid(EMAIL_REGEX.test(savedEmail));
      }
      // Auto-focus on email input
      emailInputRef.current?.focus();
    } catch {
      // WHY: localStorage might not be available in SSR - silently fail
      // This is expected behavior and doesn't affect functionality
    }
  }, []);

  useEffect(() => {
    if (registered) {
      setSuccess("Account created successfully! Please sign in to continue.");
      // Clear the query parameter
      router.replace("/login", { scroll: false });
    }
  }, [registered, router]);

  // Validate email in real-time (memoized)
  const handleEmailChange = useCallback((value: string) => {
    setEmail(value);
    if (value.length > 0) {
      setEmailValid(EMAIL_REGEX.test(value));
    } else {
      setEmailValid(null);
    }
  }, []);

  // Toggle password visibility (memoized)
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  // Memoize submit handler to prevent recreation
  const onSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple rapid submissions (debounce)
    const now = Date.now();
    const timeSinceLastSubmit = now - lastSubmitTimeRef.current;
    if (timeSinceLastSubmit < 1000) { // 1 second minimum between submissions
      return;
    }
    lastSubmitTimeRef.current = now;

    if (loading) return;      
    setLoading(true);
    setErr("");

    try {
      await authService.login({ email, password });
      // Save email to localStorage for next time
      try {
        localStorage.setItem("rememberedEmail", email.trim().toLowerCase());
      } catch {
        // WHY: localStorage might not be available - silently fail
        // Email saving is a convenience feature, not critical functionality
      }
      router.push(next);
      router.refresh();
    } catch (e: unknown) {
      // Handle rate limiting errors
      if (e instanceof ApiError && e.statusCode === 429) {
        setErr(e.message || "Too many login attempts. Please wait before trying again.");
      } else {
        const message = e instanceof ApiError
          ? e.message
          : e instanceof Error
          ? e.message
          : "Login failed";
        setErr(message);
      }
    } finally {
      setLoading(false);
    }
  }, [email, password, loading, next, router]);

  return (
    <main className="min-h-dvh flex items-center justify-center  ">
      <form noValidate onSubmit={onSubmit} className="w-full max-w-sm secondary-background p-6 rounded-lg shadow-lg space-y-5">
        <h1 className="text-8xl font-bold text-white text-center">LOGIN</h1>

        <div className="relative">
          <input
            ref={emailInputRef}
            className={`w-full rounded px-3 py-2 text-white transaction-background pr-10 ${
              emailValid === false && email.length > 0 ? "ring-2 ring-red-500" : ""
            } ${emailValid === true ? "ring-2 ring-green-500" : ""}`}
            type="email"
            placeholder="email"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            required
            autoComplete="email"
          />
          {emailValid === true && email.length > 0 && (
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">✓</span>
          )}
          {emailValid === false && email.length > 0 && (
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500">✗</span>
          )}
        </div>

        <div className="relative">
          <input
            className="w-full rounded px-3 py-2 text-white transaction-background pr-10"
            type={showPassword ? "text" : "password"}
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white text-sm"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? "👁️" : "👁️‍🗨️"}
          </button>
        </div>

        {success && <p className="text-green-600 text-sm" role="alert">{success}</p>}
        {err && <p className="text-red-600 text-sm" role="alert">{err}</p>}

        <button
          className="w-full py-2 rounded bg-gray-300 text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          disabled={loading}
          type="submit"
          aria-label="Sign in"
          onClick={(e) => {
            // Additional protection: prevent double-click
            if (loading) {
              e.preventDefault();
              return false;
            }
          }}
        >
          {loading ? "Join..." : "Join"}
        </button>

        <p className="text-center text-white text-sm">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-gray-300 hover:text-white underline">
            Sign up
          </Link>
        </p>
      </form>
    </main>
  );
}