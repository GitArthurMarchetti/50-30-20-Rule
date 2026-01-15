"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useRef, useCallback, useEffect } from "react";
import { authService } from "@/app/lib/client/auth-service";
import { ApiError } from "@/app/lib/client/api-client";
import { validatePasswordStrength } from "@/app/lib/client/password-validator";
import { EMAIL_REGEX, USERNAME_REGEX, VALIDATION_LIMITS } from "@/app/lib/validation-constants";

export default function RegisterForm() {
  const router = useRouter();
  const submitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSubmitTimeRef = useRef<number>(0);

  const usernameInputRef = useRef<HTMLInputElement>(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Memoize toggle handlers
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);
  
  const toggleConfirmPasswordVisibility = useCallback(() => {
    setShowConfirmPassword((prev) => !prev);
  }, []);
  const [usernameValid, setUsernameValid] = useState<boolean | null>(null);
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const [passwordMatch, setPasswordMatch] = useState<boolean | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<{ score: number; feedback: string[] } | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-focus on username input
  useEffect(() => {
    usernameInputRef.current?.focus();
  }, []);

  // Update password strength as user types
  const handlePasswordChange = useCallback((value: string) => {
    setPassword(value);
    if (value.length > 0) {
      const strength = validatePasswordStrength(value);
      setPasswordStrength({ score: strength.score, feedback: strength.feedback });
    } else {
      setPasswordStrength(null);
    }
    // Check if passwords match
    if (confirmPassword.length > 0) {
      setPasswordMatch(value === confirmPassword);
    }
  }, [confirmPassword]);

  // Validate username in real-time (memoized)
  const handleUsernameChange = useCallback((value: string) => {
    setUsername(value);
    if (value.length > 0) {
      const trimmed = value.trim();
      const isValid = USERNAME_REGEX.test(trimmed) && 
                      trimmed.length <= VALIDATION_LIMITS.username.max && 
                      trimmed.length >= VALIDATION_LIMITS.username.min;
      setUsernameValid(isValid);
    } else {
      setUsernameValid(null);
    }
  }, []);

  // Validate email in real-time (memoized)
  const handleEmailChange = useCallback((value: string) => {
    setEmail(value);
    if (value.length > 0) {
      setEmailValid(EMAIL_REGEX.test(value));
    } else {
      setEmailValid(null);
    }
  }, []);

  // Check password match in real-time (memoized)
  const handleConfirmPasswordChange = useCallback((value: string) => {
    setConfirmPassword(value);
    if (value.length > 0) {
      setPasswordMatch(value === password);
    } else {
      setPasswordMatch(null);
    }
  }, [password]);

  // Client-side validation (memoized)
  const validateForm = useCallback((): string | null => {
    const usernameTrimmed = username.trim();
    const emailTrimmed = email.trim();

    if (!usernameTrimmed) {
      return "Username is required";
    }

    if (usernameTrimmed.length > VALIDATION_LIMITS.username.max) {
      return `Username cannot exceed ${VALIDATION_LIMITS.username.max} characters`;
    }

    // Sanitize username - only allow alphanumeric, underscore, hyphen
    if (!USERNAME_REGEX.test(usernameTrimmed)) {
      return "Username can only contain letters, numbers, spaces, underscores, and hyphens";
    }

    if (!emailTrimmed) {
      return "Email is required";
    }

    // Basic email validation
    if (!EMAIL_REGEX.test(emailTrimmed)) {
      return "Invalid email format";
    }

    if (!password) {
      return "Password is required";
    }

    if (password.length < VALIDATION_LIMITS.password.min) {
      return `Password must be at least ${VALIDATION_LIMITS.password.min} characters long`;
    }

    if (password.length > VALIDATION_LIMITS.password.max) {
      return `Password cannot exceed ${VALIDATION_LIMITS.password.max} characters`;
    }

    // Validate password strength
    const strength = validatePasswordStrength(password);
    if (!strength.valid) {
      return `Password is too weak. ${strength.feedback.join(". ")}`;
    }

    if (password !== confirmPassword) {
      return "Passwords do not match";
    }

    return null;
  }, [username, email, password, confirmPassword]);

  // Memoize submit handler
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
    
    setErr("");

    // Client-side validation
    const validationError = validateForm();
    if (validationError) {
      setErr(validationError);
      return;
    }

    setLoading(true);

    // Clear any existing timeout
    if (submitTimeoutRef.current) {
      clearTimeout(submitTimeoutRef.current);
    }

    try {
      const trimmedEmail = email.trim().toLowerCase();
      const trimmedUsername = username.trim();
      
      // Register the user
      await authService.register({ 
        username: trimmedUsername, 
        email: trimmedEmail, 
        password 
      });
      
      // Automatically log in the user after successful registration
      await authService.login({
        email: trimmedEmail,
        password: password
      });
      
      // Redirect to dashboard after successful registration and login
      router.push("/");
      router.refresh();
    } catch (e: unknown) {
      // Handle rate limiting errors
      if (e instanceof ApiError && e.statusCode === 429) {
        setErr(e.message || "Too many attempts. Please wait before trying again.");
      } else {
        // Generic error message to avoid information leakage
        const message = e instanceof ApiError
          ? e.message
          : e instanceof Error
          ? e.message
          : "Registration failed. Please try again.";
        setErr(message);
      }
    } finally {
      setLoading(false);
    }
  }, [username, email, password, loading, validateForm, router]);

  return (
    <main className="min-h-dvh flex items-center justify-center">
      <form noValidate onSubmit={onSubmit} className="w-full max-w-lg secondary-background p-6 rounded-lg shadow-lg space-y-5">
        <h1 className="text-8xl font-bold text-white text-center">REGISTER</h1>

        <div className="relative">
          <input
            ref={usernameInputRef}
            className={`w-full rounded px-3 py-2 text-white transaction-background pr-10 ${
              usernameValid === false && username.length > 0 ? "ring-2 ring-red-500" : ""
            } ${usernameValid === true ? "ring-2 ring-green-500" : ""}`}
            type="text"
            placeholder="username"
            value={username}
            onChange={(e) => handleUsernameChange(e.target.value)}
            required
            maxLength={50}
            autoComplete="username"
            aria-label="Username"
          />
          {usernameValid === true && username.length > 0 && (
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">✓</span>
          )}
          {usernameValid === false && username.length > 0 && (
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500">✗</span>
          )}
        </div>
        {username.length > 0 && usernameValid === false && (
          <p className="text-xs text-red-400 -mt-3">Only letters, numbers, spaces, underscores, and hyphens allowed</p>
        )}

        <div className="relative">
          <input
            className={`w-full rounded px-3 py-2 text-white transaction-background pr-10 ${
              emailValid === false && email.length > 0 ? "ring-2 ring-red-500" : ""
            } ${emailValid === true ? "ring-2 ring-green-500" : ""}`}
            type="email"
            placeholder="email"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            required
            autoComplete="email"
            aria-label="Email"
          />
          {emailValid === true && email.length > 0 && (
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">✓</span>
          )}
          {emailValid === false && email.length > 0 && (
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500">✗</span>
          )}
        </div>

        <div>
          <div className="relative">
            <input
              className="w-full rounded px-3 py-2 text-white transaction-background pr-10"
              type={showPassword ? "text" : "password"}
              placeholder="password"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              required
              minLength={6}
              maxLength={128}
              autoComplete="new-password"
              aria-label="Password"
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
          {passwordStrength && password.length > 0 && (
            <div className="mt-2">
              <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`h-1 flex-1 rounded ${
                      level <= passwordStrength.score
                        ? level <= 2
                          ? "bg-red-500"
                          : level === 3
                          ? "bg-yellow-500"
                          : "bg-green-500"
                        : "bg-gray-600"
                    }`}
                  />
                ))}
              </div>
              {passwordStrength.score < 3 && passwordStrength.feedback.length > 0 && (
                <p className="text-xs text-yellow-400 mt-1">
                  {passwordStrength.feedback[0]}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="relative">
          <input
            className={`w-full rounded px-3 py-2 text-white transaction-background pr-10 ${
              passwordMatch === false && confirmPassword.length > 0 ? "ring-2 ring-red-500" : ""
            } ${passwordMatch === true ? "ring-2 ring-green-500" : ""}`}
            type={showConfirmPassword ? "text" : "password"}
            placeholder="confirm password"
            value={confirmPassword}
            onChange={(e) => handleConfirmPasswordChange(e.target.value)}
            required
            minLength={6}
            maxLength={128}
            autoComplete="new-password"
            aria-label="Confirm Password"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
            {passwordMatch === true && confirmPassword.length > 0 && (
              <span className="text-green-500">✓</span>
            )}
            {passwordMatch === false && confirmPassword.length > 0 && (
              <span className="text-red-500">✗</span>
            )}
            <button
              type="button"
              onClick={toggleConfirmPasswordVisibility}
              className="text-gray-400 hover:text-white text-sm"
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>
        </div>
        {passwordMatch === false && confirmPassword.length > 0 && (
          <p className="text-xs text-red-400 -mt-3">Passwords do not match</p>
        )}

        {err && <p className="text-red-600 text-sm" role="alert">{err}</p>}

        <button
          className="w-full py-2 rounded bg-gray-300 text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          disabled={loading || passwordStrength === null || (passwordStrength !== null && passwordStrength.score < 3)}
          type="submit"
          aria-label="Create account"
          onClick={(e) => {
            // Additional protection: prevent double-click
            if (loading) {
              e.preventDefault();
              return false;
            }
          }}
        >
          {loading ? "Creating..." : "Create Account"}
        </button>

        <p className="text-center text-white text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-gray-300 hover:text-white underline">
            Sign in
          </Link>
        </p>
      </form>
    </main>
  );
}
