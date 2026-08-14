"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type BrokerAuthModalProps = {
  open: boolean;
  onClose: () => void;
  defaultMode?: "login" | "register";
};

export default function BrokerAuthModal({
  open,
  onClose,
  defaultMode = "login",
}: BrokerAuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">(defaultMode);

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // IMPORTANT:
  // Footer se register mode open hone par modal ka mode bhi update hoga.
  useEffect(() => {
    setMode(defaultMode);
    setErrorMessage("");
    setSuccessMessage("");
  }, [defaultMode, open]);

  const changeMode = (newMode: "login" | "register") => {
    setMode(newMode);
    setErrorMessage("");
    setSuccessMessage("");
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          setErrorMessage(error.message);
          setLoading(false);
          return;
        }

        window.location.href = "/broker";
        return;
      }

      if (!name.trim()) {
        setErrorMessage("Please enter your full name.");
        setLoading(false);
        return;
      }

      if (!mobile.trim()) {
        setErrorMessage("Please enter your mobile number.");
        setLoading(false);
        return;
      }

      if (password.length < 6) {
        setErrorMessage("Password must be at least 6 characters.");
        setLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setErrorMessage("Passwords do not match.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: name.trim(),
            mobile: mobile.trim(),
            role: "broker",
          },
        },
      });

      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }

      if (data.session) {
        window.location.href = "/broker";
        return;
      }

      setSuccessMessage(
        "Account created successfully. Please check your email to verify your account."
      );

      setLoading(false);
    } catch (error) {
      console.error(error);
      setErrorMessage("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-[#020817]/75 px-4 py-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative flex max-h-[92vh] w-full max-w-[820px] overflow-hidden rounded-[24px] border border-white/10 bg-white shadow-2xl">

        {/* CLOSE */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xl font-semibold text-white transition hover:bg-white/20"
          aria-label="Close"
        >
          ×
        </button>

        {/* =========================================================
            LEFT BRAND PANEL - DESKTOP
        ========================================================= */}
        <div className="hidden w-[39%] shrink-0 flex-col justify-between bg-[#062536] px-7 py-8 text-white md:flex">

          <div>
            <img
              src="/logo-white.png"
              alt="LoanKarts"
              className="h-auto w-[145px] object-contain"
            />

            <div className="mt-12">
              <p className="text-[9px] font-extrabold uppercase tracking-[0.24em] text-[#08b8d4]">
                LOANKARTS PARTNER
              </p>

              <h2 className="mt-3 text-[27px] font-black leading-[1.15]">
                Grow your business
                <span className="block text-[#08b8d4]">
                  with LoanKarts.
                </span>
              </h2>

              <p className="mt-4 max-w-[240px] text-[12px] leading-5 text-white/55">
                Join our partner network and grow your loan business with
                professional support.
              </p>
            </div>

            <div className="mt-8 space-y-4">

              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#08b8d4]/10 text-[13px] font-bold text-[#08b8d4]">
                  ✓
                </span>

                <div>
                  <p className="text-[12px] font-bold text-white">
                    Easy Partner Access
                  </p>
                  <p className="mt-0.5 text-[10px] text-white/40">
                    Simple partner account management.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#08b8d4]/10 text-[13px] font-bold text-[#08b8d4]">
                  ✓
                </span>

                <div>
                  <p className="text-[12px] font-bold text-white">
                    Professional Support
                  </p>
                  <p className="mt-0.5 text-[10px] text-white/40">
                    Support throughout your journey.
                  </p>
                </div>
              </div>

            </div>
          </div>

          <p className="text-[9px] text-white/30">
            Your trusted loan assistance partner
          </p>

        </div>

        {/* =========================================================
            RIGHT FORM AREA
        ========================================================= */}
        <div className="min-w-0 flex-1 overflow-y-auto bg-white">

          {/* MOBILE BRANDING */}
          <div className="bg-[#062536] px-6 pb-5 pt-6 text-white md:hidden">

            <img
              src="/logo-white.png"
              alt="LoanKarts"
              className="h-auto w-[135px] object-contain"
            />

            <p className="mt-4 text-[9px] font-extrabold uppercase tracking-[0.22em] text-[#08b8d4]">
              LOANKARTS PARTNER
            </p>

          </div>

          <div className="p-6 sm:p-8">

            {/* TITLE */}
            <div className="pr-8">

              <p className="text-[9px] font-extrabold uppercase tracking-[0.22em] text-[#08aeca] md:hidden">
                PARTNER ACCOUNT
              </p>

              <h2 className="mt-1 text-[25px] font-black leading-tight text-[#082f42] sm:text-[28px]">
                {mode === "login"
                  ? "Broker Login"
                  : "Become a Broker Partner"}
              </h2>

              <p className="mt-2 max-w-[420px] text-[12px] leading-5 text-slate-500">
                {mode === "login"
                  ? "Sign in to access your LoanKarts partner dashboard."
                  : "Create your broker account and join the LoanKarts partner network."}
              </p>

            </div>

            {/* TABS */}
            <div className="mt-5 flex rounded-xl bg-[#f1f7f9] p-1">

              <button
                type="button"
                onClick={() => changeMode("login")}
                className={`flex-1 rounded-lg py-2.5 text-[12px] font-extrabold transition ${
                  mode === "login"
                    ? "bg-white text-[#073b4c] shadow-sm"
                    : "text-slate-500 hover:text-[#073b4c]"
                }`}
              >
                Login
              </button>

              <button
                type="button"
                onClick={() => changeMode("register")}
                className={`flex-1 rounded-lg py-2.5 text-[12px] font-extrabold transition ${
                  mode === "register"
                    ? "bg-white text-[#073b4c] shadow-sm"
                    : "text-slate-500 hover:text-[#073b4c]"
                }`}
              >
                Create Account
              </button>

            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="mt-5">

              {/* ERROR */}
              {errorMessage && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-[12px] leading-5 text-red-700">
                  <p className="font-bold">Please check your details</p>
                  <p>{errorMessage}</p>
                </div>
              )}

              {/* SUCCESS */}
              {successMessage && (
                <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-[12px] leading-5 text-green-700">
                  <p className="font-bold">✓ Account Created</p>
                  <p>{successMessage}</p>
                </div>
              )}

              {/* NAME + MOBILE - SIGNUP ONLY */}
              {mode === "register" && (
                <div className="grid gap-3 sm:grid-cols-2">

                  <label className="block text-[12px] font-bold text-[#082f42]">
                    Full Name

                    <input
                      required
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Full name"
                      autoComplete="name"
                      className="mt-1.5 h-10 w-full rounded-xl border border-slate-300 px-3 text-[12px] font-normal outline-none transition placeholder:text-slate-400 focus:border-[#08b8d4] focus:ring-4 focus:ring-cyan-50"
                    />
                  </label>

                  <label className="block text-[12px] font-bold text-[#082f42]">
                    Mobile Number

                    <input
                      required
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="Mobile number"
                      autoComplete="tel"
                      className="mt-1.5 h-10 w-full rounded-xl border border-slate-300 px-3 text-[12px] font-normal outline-none transition placeholder:text-slate-400 focus:border-[#08b8d4] focus:ring-4 focus:ring-cyan-50"
                    />
                  </label>

                </div>
              )}

              {/* EMAIL */}
              <label
                className={`block text-[12px] font-bold text-[#082f42] ${
                  mode === "register" ? "mt-3.5" : ""
                }`}
              >
                Email Address

                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  autoComplete="email"
                  className="mt-1.5 h-10 w-full rounded-xl border border-slate-300 px-3 text-[12px] font-normal outline-none transition placeholder:text-slate-400 focus:border-[#08b8d4] focus:ring-4 focus:ring-cyan-50"
                />
              </label>

              {/* PASSWORD */}
              <label className="mt-3.5 block text-[12px] font-bold text-[#082f42]">
                Password

                <input
                  required
                  type="password"
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  autoComplete={
                    mode === "login"
                      ? "current-password"
                      : "new-password"
                  }
                  className="mt-1.5 h-10 w-full rounded-xl border border-slate-300 px-3 text-[12px] font-normal outline-none transition placeholder:text-slate-400 focus:border-[#08b8d4] focus:ring-4 focus:ring-cyan-50"
                />
              </label>

              {/* CONFIRM PASSWORD */}
              {mode === "register" && (
                <label className="mt-3.5 block text-[12px] font-bold text-[#082f42]">
                  Confirm Password

                  <input
                    required
                    type="password"
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                    className="mt-1.5 h-10 w-full rounded-xl border border-slate-300 px-3 text-[12px] font-normal outline-none transition placeholder:text-slate-400 focus:border-[#08b8d4] focus:ring-4 focus:ring-cyan-50"
                  />
                </label>
              )}

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={loading}
                className="mt-5 flex h-11 w-full items-center justify-center rounded-xl bg-[#08b8d4] px-5 text-[12px] font-extrabold text-white shadow-lg shadow-cyan-500/15 transition hover:bg-[#079eb7] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? mode === "login"
                    ? "Signing in..."
                    : "Creating Account..."
                  : mode === "login"
                  ? "LOGIN TO BROKER PANEL →"
                  : "CREATE BROKER ACCOUNT →"}
              </button>

              {/* SWITCH */}
              <p className="mt-4 text-center text-[12px] text-slate-500">

                {mode === "login" ? (
                  <>
                    Don't have a broker account?{" "}
                    <button
                      type="button"
                      onClick={() => changeMode("register")}
                      className="font-extrabold text-[#08aeca] hover:underline"
                    >
                      Create Account
                    </button>
                  </>
                ) : (
                  <>
                    Already have a broker account?{" "}
                    <button
                      type="button"
                      onClick={() => changeMode("login")}
                      className="font-extrabold text-[#08aeca] hover:underline"
                    >
                      Login
                    </button>
                  </>
                )}

              </p>

            </form>

          </div>
        </div>

      </div>
    </div>
  );
}