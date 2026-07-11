"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { signUpSchema, type SignUpInput } from "@/lib/validations/auth";

export default function SignUpPage() {
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
        router.push("/");
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
        callbackURL: "/",
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0B0F19] p-6">
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
            <button
              onClick={() => handleOAuth("google")}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg border border-[#424754]/20 text-[#dfe2f1] hover:bg-[#171b26] transition-all disabled:opacity-50"
              style={{ background: "rgba(23, 27, 38, 0.5)" }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor"></path>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor"></path>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="currentColor"></path>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor"></path>
              </svg>
              <span className="text-sm font-medium">Continue with Google</span>
            </button>

            <button
              onClick={() => handleOAuth("github")}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg border border-[#424754]/20 text-[#dfe2f1] hover:bg-[#171b26] transition-all disabled:opacity-50"
              style={{ background: "rgba(23, 27, 38, 0.5)" }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M12 1.27a11 11 0 00-3.48 21.46c.55.09.73-.24.73-.55v-1.84c-3.03.66-3.67-1.46-3.67-1.46-.5-1.27-1.21-1.61-1.21-1.61-.99-.68.08-.66.08-.66 1.1.08 1.67 1.13 1.67 1.13.97 1.66 2.54 1.18 3.17.9.1-.7.37-1.18.69-1.45-2.42-.27-4.96-1.21-4.96-5.38 0-1.19.42-2.17 1.12-2.93-.11-.28-.48-1.39.11-2.88 0 0 .91-.29 3 1.12A10.33 10.33 0 0112 6.58c.93 0 1.87.13 2.75.38 2.08-1.41 2.99-1.12 2.99-1.12.6 1.49.23 2.6.12 2.88.7.76 1.12 1.74 1.12 2.93 0 4.19-2.55 5.11-4.98 5.38.39.33.74.99.74 1.99v2.96c0 .3.18.65.74.55A11 11 0 0012 1.27z" fill="currentColor"></path>
              </svg>
              <span className="text-sm font-medium">Continue with GitHub</span>
            </button>
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
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full rounded-lg py-3 px-4 text-[#dfe2f1] placeholder:text-[#c2c6d6]/30 focus:ring-1 focus:ring-[#adc6ff] focus:border-[#adc6ff] transition-all"
                style={{
                  background: "rgba(10, 14, 24, 0.8)",
                  border: "1px solid rgba(66, 71, 84, 0.3)",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-lg font-medium text-[#002e6a] transition-all disabled:opacity-50"
              style={{
                background: "#adc6ff",
                boxShadow: "0 0 20px rgba(59, 130, 246, 0.15)",
              }}
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </button>
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
            <a href="#" className="underline underline-offset-4 hover:opacity-100 transition-opacity">Terms of Service</a> and{" "}
            <a href="#" className="underline underline-offset-4 hover:opacity-100 transition-opacity">Privacy Policy</a>.
          </p>
          <p className="text-xs text-[#c2c6d6] opacity-30">© 2024 Axiom AI. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
}
