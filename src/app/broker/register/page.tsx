"use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function BrokerRegisterPage() {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleRegister(e: FormEvent) {
    e.preventDefault();

    setLoading(true);
    setMessage("");
    setErrorMessage("");

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
      console.error(error);
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      window.location.href = "/broker";
      return;
    }

    setMessage(
      "Account created successfully. Please check your email to verify your account, then login."
    );

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#f4f8fb] px-5 py-10">

      {/* LOGO */}
      <div className="mx-auto mb-8 flex justify-center">
        <a href="/">
          <img
            src="/loankarts-logo-transparent.png"
            alt="LoanKarts"
            className="h-20 w-auto max-w-[300px] object-contain"
          />
        </a>
      </div>

      {/* REGISTER CARD */}
      <div className="mx-auto w-full max-w-[480px]">

        <form
          onSubmit={handleRegister}
          className="rounded-[24px] border border-slate-200 bg-white p-7 shadow-xl sm:p-9"
        >

          {/* TITLE */}
          <div className="text-center">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#08aeca]">
              LOANKARTS PARTNER
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight text-[#082f42]">
              Become a Broker Partner
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Create your LoanKarts broker account and join our partner network.
            </p>
          </div>

          {/* ERROR */}
          {errorMessage && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p className="font-bold">Registration failed</p>
              <p className="mt-1">{errorMessage}</p>
            </div>
          )}

          {/* SUCCESS */}
          {message && (
            <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
              <p className="font-bold">Registration successful</p>
              <p className="mt-1">{message}</p>
            </div>
          )}

          {/* NAME */}
          <div className="mt-7">
            <label className="mb-2 block text-sm font-bold text-[#082f42]">
              Full Name
            </label>

            <input
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-[#082f42] outline-none transition placeholder:text-slate-400 focus:border-[#08b8d4] focus:ring-4 focus:ring-cyan-100"
            />
          </div>

          {/* MOBILE */}
          <div className="mt-5">
            <label className="mb-2 block text-sm font-bold text-[#082f42]">
              Mobile Number
            </label>

            <input
              required
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="+91 Enter mobile number"
              className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-[#082f42] outline-none transition placeholder:text-slate-400 focus:border-[#08b8d4] focus:ring-4 focus:ring-cyan-100"
            />
          </div>

          {/* EMAIL */}
          <div className="mt-5">
            <label className="mb-2 block text-sm font-bold text-[#082f42]">
              Email Address
            </label>

            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-[#082f42] outline-none transition placeholder:text-slate-400 focus:border-[#08b8d4] focus:ring-4 focus:ring-cyan-100"
            />
          </div>

          {/* PASSWORD */}
          <div className="mt-5">
            <label className="mb-2 block text-sm font-bold text-[#082f42]">
              Password
            </label>

            <input
              required
              type="password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-[#082f42] outline-none transition placeholder:text-slate-400 focus:border-[#08b8d4] focus:ring-4 focus:ring-cyan-100"
            />
          </div>

          {/* CONFIRM PASSWORD */}
          <div className="mt-5">
            <label className="mb-2 block text-sm font-bold text-[#082f42]">
              Confirm Password
            </label>

            <input
              required
              type="password"
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-[#082f42] outline-none transition placeholder:text-slate-400 focus:border-[#08b8d4] focus:ring-4 focus:ring-cyan-100"
            />
          </div>

          {/* BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="mt-7 flex h-13 w-full items-center justify-center rounded-xl bg-[#08b8d4] px-5 py-4 text-sm font-black text-white shadow-lg shadow-cyan-500/15 transition hover:bg-[#079eb7] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Creating Account..."
              : "CREATE BROKER ACCOUNT →"}
          </button>

          {/* LOGIN */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              Already have a broker account?
            </p>

            <a
              href="/broker/login"
              className="mt-1 inline-block text-sm font-extrabold text-[#08aeca] hover:underline"
            >
              Login to your account →
            </a>
          </div>

          {/* BACK */}
          <a
            href="/"
            className="mt-5 block text-center text-sm font-bold text-slate-400 transition hover:text-[#08aeca]"
          >
            ← Back to Main Website
          </a>

        </form>

        <p className="mt-5 text-center text-xs text-slate-400">
          LoanKarts — Your trusted loan assistance partner
        </p>

      </div>
    </main>
  );
}