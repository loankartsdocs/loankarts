"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function BrokerResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleUpdatePassword(e: FormEvent) {
    e.preventDefault();

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setMessage("");

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage(
      "Password updated successfully. You can now login to your Connector Panel."
    );
    setPassword("");
    setConfirmPassword("");
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#f5f9fc] px-4 py-8 sm:px-6">
      {/* Top brand strip */}
      <div className="mx-auto mb-8 flex max-w-5xl items-center justify-between">
        <a href="/" className="flex items-center">
          <img
            src="/loankarts-logo-transparent.png"
            alt="LoanKarts"
            className="h-auto w-[145px] object-contain sm:w-[165px]"
          />
        </a>

        <div className="hidden rounded-full border border-slate-200 bg-white px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-500 shadow-sm sm:block">
          Partner Portal
        </div>
      </div>

      <div className="mx-auto flex min-h-[calc(100vh-130px)] max-w-5xl items-center justify-center">
        <div className="grid w-full max-w-[900px] overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(7,59,76,0.12)] md:grid-cols-[0.82fr_1.18fr]">

          {/* Brand panel */}
          <div className="relative hidden overflow-hidden bg-[#062f40] p-9 text-white md:flex md:flex-col md:justify-between">
            <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full border border-white/10" />
            <div className="absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-[#08b8d4]/10" />

            <div className="relative">
              <div className="inline-flex rounded-2xl border border-white/10 bg-white/5 p-3">
                <img
                  src="/logo-white.png"
                  alt="LoanKarts"
                  className="h-auto w-[150px] object-contain"
                />
              </div>

              <p className="mt-12 text-[10px] font-extrabold uppercase tracking-[0.24em] text-[#08b8d4]">
                Account Security
              </p>

              <h2 className="mt-3 text-[30px] font-black leading-[1.08]">
                Protect your
                <span className="block text-[#08b8d4]">
                  partner account.
                </span>
              </h2>

              <p className="mt-5 max-w-[280px] text-[13px] leading-6 text-white/60">
                Create a new password and continue using your LoanKarts Connector
                Panel securely.
              </p>

              <div className="mt-8 space-y-3">
                {[
                  "Secure password recovery",
                  "Protected connector access",
                  "Fast account restoration",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#08b8d4]/10 text-xs font-black text-[#08b8d4]">
                      ✓
                    </span>
                    <span className="text-[12px] font-bold text-white/85">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <p className="relative text-[10px] text-white/35">
              © {new Date().getFullYear()} LoanKarts • Partner Portal
            </p>
          </div>

          {/* Form panel */}
          <div className="p-6 sm:p-9 lg:p-11">
            <div className="mb-7">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.10)]" />
                Secure Access
              </div>

              <h1 className="text-[30px] font-black leading-tight tracking-[-0.02em] text-[#073b4c] sm:text-[34px]">
                Reset Password
              </h1>

              <p className="mt-2 max-w-[470px] text-[13px] leading-6 text-slate-500">
                Set a new password for your LoanKarts connector account and regain
                secure access to your dashboard.
              </p>
            </div>

            {message && (
              <div className="mb-6 flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-sm font-black text-white">
                  ✓
                </div>
                <div>
                  <p className="text-[12px] font-extrabold text-emerald-800">
                    Password Updated
                  </p>
                  <p className="mt-1 text-[12px] leading-5 text-emerald-700">
                    {message}
                  </p>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="mb-6 flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-black text-red-600">
                  !
                </div>
                <div>
                  <p className="text-[12px] font-extrabold text-red-800">
                    Unable to update password
                  </p>
                  <p className="mt-1 text-[12px] leading-5 text-red-700">
                    {errorMessage}
                  </p>
                </div>
              </div>
            )}

            {!ready ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-extrabold text-[#073b4c]">
                  Reset link required
                </p>
                <p className="mt-2 text-[12px] leading-5 text-slate-500">
                  Please open this page from the password reset link sent to
                  your registered email address.
                </p>
              </div>
            ) : (
              <form onSubmit={handleUpdatePassword}>
                <label className="block text-[12px] font-extrabold uppercase tracking-[0.06em] text-[#073b4c]">
                  New Password
                  <input
                    required
                    minLength={6}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    autoComplete="new-password"
                    className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-normal normal-case tracking-normal outline-none transition placeholder:text-slate-400 focus:border-[#08b8d4] focus:ring-4 focus:ring-cyan-50"
                  />
                </label>

                <label className="mt-5 block text-[12px] font-extrabold uppercase tracking-[0.06em] text-[#073b4c]">
                  Confirm Password
                  <input
                    required
                    minLength={6}
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                    className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-normal normal-case tracking-normal outline-none transition placeholder:text-slate-400 focus:border-[#08b8d4] focus:ring-4 focus:ring-cyan-50"
                  />
                </label>

                <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="text-[#08b8d4]">●</span>
                  Use at least 6 characters for your new password.
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-[#073b4c] px-5 text-[13px] font-extrabold text-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-[1px] hover:bg-[#0b5269] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Updating Password..." : "UPDATE PASSWORD  →"}
                </button>
              </form>
            )}

            <div className="mt-6 border-t border-slate-100 pt-5 text-center">
              <a
                href="/broker/login"
                className="text-[12px] font-extrabold text-[#08aeca] hover:underline"
              >
                ← Back to Connector Login
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}