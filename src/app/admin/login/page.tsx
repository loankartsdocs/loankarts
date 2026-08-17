"use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("docs@loankarts.com");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleLogin(e: FormEvent) {
    e.preventDefault();

    setLoading(true);
    setErrorMessage("");

    const loginEmail = email.trim().toLowerCase();

    // Only LoanKarts admin account is allowed
    if (loginEmail !== "docs@loankarts.com") {
      setErrorMessage(
        "This account is not authorized to access the Admin Portal."
      );
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    // Double security check
    if (
      !data.user ||
      data.user.email?.toLowerCase() !== "docs@loankarts.com"
    ) {
      await supabase.auth.signOut();

      setErrorMessage(
        "You are not authorized to access the LoanKarts Admin Portal."
      );

      setLoading(false);
      return;
    }

    window.location.href = "/admin";
  }

  return (
    <main className="min-h-screen bg-[#f4f8fb]">

      {/* =====================================================
          PREMIUM HEADER
      ===================================================== */}
      <header className="h-[76px] border-b border-white/10 bg-[#061f2a] shadow-[0_8px_30px_rgba(0,0,0,0.16)]">
       <div className="mx-auto flex h-[76px] max-w-7xl items-center px-5 sm:px-8">

          {/* Logo */}
         <div className="flex h-[48px] w-[190px] shrink-0 items-center overflow-hidden">
  <img
    src="/loankarts-logo-white.png"
    alt="LoanKarts"
    style={{
      width: "190px",
      height: "48px",
      objectFit: "contain",
      objectPosition: "left center",
      display: "block",
    }}
  />
</div>
          {/* Divider */}
          <div className="mx-4 hidden h-9 w-px bg-white/15 sm:block" />

          {/* Portal Title */}
          <div className="hidden sm:block">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#10b7d3]">
              Admin Portal
            </p>

            <p className="mt-0.5 text-sm font-bold text-white">
              LoanKarts Management
            </p>
          </div>
        </div>
      </header>

      {/* =====================================================
          LOGIN AREA
      ===================================================== */}
      <section className="flex min-h-[calc(100vh-76px)] items-center justify-center px-5 py-10 sm:px-6">

        <div className="w-full max-w-[430px]">

          {/* Logo / Welcome */}
          <div className="mb-7 text-center">

            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#061f2a] shadow-lg">
              <span className="text-xl text-[#10b7d3]">✓</span>
            </div>

            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#10b7d3]">
              Secure Access
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight text-[#073b4c] sm:text-4xl">
              Admin Login
            </h1>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
              Sign in to manage connector partners, loan applications and
              commissions.
            </p>
          </div>

          {/* =================================================
              LOGIN CARD
          ================================================= */}
          <form
            onSubmit={handleLogin}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.09)] sm:p-8"
          >

            {/* Card Header */}
            <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-5">
              <div>
                <p className="text-sm font-black text-[#073b4c]">
                  Welcome back
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Authorized administrators only
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>

                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
                  Secure
                </span>
              </div>
            </div>

            {/* Error */}
            {errorMessage && (
              <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4">
                <div className="flex gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-sm">
                    !
                  </div>

                  <div>
                    <p className="text-sm font-black text-rose-700">
                      Login failed
                    </p>

                    <p className="mt-1 text-xs leading-5 text-rose-600">
                      {errorMessage}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-600">
                Admin Email
              </label>

              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  @
                </span>

                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="docs@loankarts.com"
                  autoComplete="email"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#10b7d3] focus:bg-white focus:ring-4 focus:ring-cyan-50"
                />
              </div>
            </div>

            {/* Password */}
            <div className="mt-5">
              <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-600">
                Password
              </label>

              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  •
                </span>

                <input
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  autoComplete="current-password"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-16 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#10b7d3] focus:bg-white focus:ring-4 focus:ring-cyan-50"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-bold text-slate-500 transition hover:bg-slate-100 hover:text-[#073b4c]"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#073b4c] px-5 text-sm font-black text-white shadow-lg shadow-[#073b4c]/15 transition hover:-translate-y-0.5 hover:bg-[#0b5269] hover:shadow-xl disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Signing in...
                </>
              ) : (
                <>
                  LOGIN TO ADMIN PORTAL
                  <span className="text-[#10b7d3]">→</span>
                </>
              )}
            </button>

            {/* Back */}
            <a
              href="/"
              className="mt-5 block text-center text-xs font-bold text-slate-500 transition hover:text-[#0b91a9]"
            >
              ← Back to Main Website
            </a>
          </form>

          {/* Footer */}
          <p className="mt-6 text-center text-[11px] font-medium text-slate-400">
            LoanKarts Management Portal • Authorized Access Only
          </p>
        </div>
      </section>
    </main>
  );
}