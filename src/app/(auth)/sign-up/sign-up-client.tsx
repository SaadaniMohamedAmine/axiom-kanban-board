"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { signUpSchema, type SignUpInput } from "@/lib/validations/auth";
import { RippleButton } from "@/components/ui/ripple-button";
import { SPLASH_EVENT } from "@/components/app-splash";

export function SignUpClient() {
  return (
    <Suspense fallback={null}>
      <SignUpForm />
    </Suspense>
  );
}

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [conflictError, setConflictError] = useState<{
    message: string;
    existingProvider?: string;
  } | null>(() =>
    // Better Auth redirects OAuth failures back here as `?error=...`
    // (see errorCallbackURL below) instead of resolving the signIn.social() promise.
    searchParams.get("error") === "account_not_linked"
      ? {
          message:
            "This email is already registered with a different sign-in method. Try the method you used originally.",
        }
      : null
  );
  const [formData, setFormData] = useState<SignUpInput>({
    name: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    if (searchParams.get("error") === "account_not_linked") {
      router.replace("/sign-up");
    }
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setConflictError(null);

    const validation = signUpSchema.safeParse(formData);
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await authClient.signUp.email({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        if (error.code === "EMAIL_ALREADY_LINKED") {
          setConflictError({
            message: error.message || "This email is already registered",
            existingProvider: undefined,
          });
        } else {
          setError(error.message || "Sign up failed");
        }
      } else {
        void fetch("/api/auth/signup-hook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email, name: formData.name }),
        }).catch(() => {});
        window.dispatchEvent(new Event(SPLASH_EVENT));
        router.push("/dashboard");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "github") => {
    setIsLoading(true);
    setError(null);
    setConflictError(null);

    try {
      const { error } = await authClient.signIn.social({
        provider,
        callbackURL: "/api/auth/oauth-hook?type=signup",
        errorCallbackURL: "/sign-up",
      });

      if (error) {
        if (error.code === "EMAIL_ALREADY_LINKED") {
          setConflictError({
            message: error.message || "This email is already registered",
            existingProvider: undefined,
          });
        } else {
          setError(error.message || `${provider} sign up failed`);
        }
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0B0F19] p-6 pt-28">
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[120px]"></div>
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-secondary-container/5 blur-[100px]"></div>
      </div>

      <main className="w-full max-w-md flex flex-col items-center">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-[#adc6ff] mb-2">Axiom</h1>
          <p className="text-[#c2c6d6] text-sm opacity-80">
            Let&apos;s build your intelligence layer.
          </p>
        </div>

        <div className="w-full rounded-xl p-8 relative overflow-hidden" style={{
          background: "rgba(26, 34, 54, 0.7)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(66, 71, 84, 0.3)",
          boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.5)",
        }}>
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          {conflictError && (
            <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm">
              <p className="font-medium mb-1">Email already registered</p>
              <p>{conflictError.message}</p>
            </div>
          )}

          <div className="space-y-3 mb-6">
            <RippleButton
              onClick={() => handleOAuth("google")}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg border border-[#424754]/20 text-[#dfe2f1] hover:bg-white/5 hover:border-[#4285F4]/40 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              style={{ background: "rgba(23, 27, 38, 0.5)" }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" fill="#4285F4" />
                <path d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" fill="#34A853" />
                <path d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29A11.93 11.93 0 000 12c0 1.93.46 3.76 1.29 5.38l3.98-3.09z" fill="#FBBC05" />
                <path d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.94 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" fill="#EA4335" />
              </svg>
              <span className="text-sm font-medium">Continue with Google</span>
            </RippleButton>

            <RippleButton
              onClick={() => handleOAuth("github")}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg border border-[#424754]/20 text-[#dfe2f1] hover:bg-white/5 hover:border-[#dfe2f1]/40 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              style={{ background: "rgba(23, 27, 38, 0.5)" }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M12 1.27a11 11 0 00-3.48 21.46c.55.09.73-.24.73-.55v-1.84c-3.03.66-3.67-1.46-3.67-1.46-.5-1.27-1.21-1.61-1.21-1.61-.99-.68.08-.66.08-.66 1.1.08 1.67 1.13 1.67 1.13.97 1.66 2.54 1.18 3.17.9.1-.7.37-1.18.69-1.45-2.42-.27-4.96-1.21-4.96-5.38 0-1.19.42-2.17 1.12-2.93-.11-.28-.48-1.39.11-2.88 0 0 .91-.29 3 1.12A10.33 10.33 0 0112 6.58c.93 0 1.87.13 2.75.38 2.08-1.41 2.99-1.12 2.99-1.12.6 1.49.23 2.6.12 2.88.7.76 1.12 1.74 1.12 2.93 0 4.19-2.55 5.11-4.98 5.38.39.33.74.99.74 1.99v2.96c0 .3.18.65.74.55A11 11 0 0012 1.27z" fill="#dfe2f1"></path>
              </svg>
              <span className="text-sm font-medium">Continue with GitHub</span>
            </RippleButton>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="h-[1px] flex-1 bg-[#424754]/30"></div>
            <span className="text-[#c2c6d6]/60 uppercase tracking-widest text-[10px]">or use email</span>
            <div className="h-[1px] flex-1 bg-[#424754]/30"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm text-[#c2c6d6] ml-1" htmlFor="name">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                className="w-full rounded-lg py-3 px-4 text-[#dfe2f1] placeholder:text-[#c2c6d6]/30 focus:ring-1 focus:ring-[#adc6ff] focus:border-[#adc6ff] transition-all"
                style={{
                  background: "rgba(10, 14, 24, 0.8)",
                  border: "1px solid rgba(66, 71, 84, 0.3)",
                }}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm text-[#c2c6d6] ml-1" htmlFor="email">
                Work Email
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="name@company.com"
                className="w-full rounded-lg py-3 px-4 text-[#dfe2f1] placeholder:text-[#c2c6d6]/30 focus:ring-1 focus:ring-[#adc6ff] focus:border-[#adc6ff] transition-all"
                style={{
                  background: "rgba(10, 14, 24, 0.8)",
                  border: "1px solid rgba(66, 71, 84, 0.3)",
                }}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm text-[#c2c6d6] ml-1" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full rounded-lg py-3 pl-4 pr-11 text-[#dfe2f1] placeholder:text-[#c2c6d6]/30 focus:ring-1 focus:ring-[#adc6ff] focus:border-[#adc6ff] transition-all"
                  style={{
                    background: "rgba(10, 14, 24, 0.8)",
                    border: "1px solid rgba(66, 71, 84, 0.3)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-0 top-0 h-full px-3 flex items-center text-[#c2c6d6]/50 hover:text-[#c2c6d6] transition-colors cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                      <line x1="2" x2="22" y1="2" y2="22" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <RippleButton
              type="submit"
              disabled={isLoading}
              rippleColor="rgba(0,0,0,0.15)"
              className="w-full py-4 rounded-lg font-medium text-[#002e6a] transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              style={{
                background: "#adc6ff",
                boxShadow: "0 0 20px rgba(59, 130, 246, 0.15)",
              }}
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </RippleButton>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[#c2c6d6]">
              Already have an account?{" "}
              <Link href="/login" className="text-[#adc6ff] hover:text-[#d8e2ff] transition-colors font-medium">
                Log in
              </Link>
            </p>
          </div>
        </div>

        <footer className="mt-8 text-center space-y-2">
          <p className="text-xs text-[#c2c6d6] opacity-40">
            By signing up, you agree to our{" "}
            <Link href="/terms" className="underline underline-offset-4 hover:opacity-100 transition-opacity">Terms of Service</Link> and{" "}
            <Link href="/privacy" className="underline underline-offset-4 hover:opacity-100 transition-opacity">Privacy Policy</Link>.
          </p>
          <p className="text-xs text-[#c2c6d6] opacity-30">© 2024 Axiom AI. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
}
