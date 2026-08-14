"use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("docs@loankarts.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleLogin(e: FormEvent) {
    e.preventDefault();

    setLoading(true);
    setErrorMessage("");

    const loginEmail = email.trim().toLowerCase();

    // Only the LoanKarts admin email can access the Admin Panel
    if (loginEmail !== "docs@loankarts.com") {
      setErrorMessage(
        "This account is not authorized to access the Admin Panel."
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

    // Double-check the logged-in account
    if (
      !data.user ||
      data.user.email?.toLowerCase() !== "docs@loankarts.com"
    ) {
      await supabase.auth.signOut();

      setErrorMessage(
        "You are not authorized to access the Admin Panel."
      );

      setLoading(false);
      return;
    }

    window.location.href = "/admin";
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f8fb] px-5">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <img
            src="/loankarts-logo-transparent.png"
            alt="LoanKarts — You Think to Grow, We Can Help"
            className="h-20 w-auto max-w-[300px] object-contain"
          />
        </div>

        {/* Login Form */}
        <form
          onSubmit={handleLogin}
          className="rounded-3xl bg-white p-7 shadow-xl ring-1 ring-slate-200"
        >
          <h2 className="text-2xl font-black text-[#073b4c]">
            Admin Login
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Sign in to manage broker loan applications.
          </p>

          {/* Error */}
          {errorMessage && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p className="font-bold">
                ❌ Login failed
              </p>

              <p className="mt-1">
                {errorMessage}
              </p>
            </div>
          )}

          {/* Email */}
          <div className="mt-6">
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Admin Email
            </label>

            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="docs@loankarts.com"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#10b7d3] focus:ring-2 focus:ring-cyan-100"
            />
          </div>

          {/* Password */}
          <div className="mt-5">
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Password
            </label>

            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#10b7d3] focus:ring-2 focus:ring-cyan-100"
            />
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-[#073b4c] px-5 py-4 font-black text-white transition hover:bg-[#0b5269] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Signing in..."
              : "LOGIN TO ADMIN PANEL →"}
          </button>

          {/* Back */}
          <a
            href="/"
            className="mt-5 block text-center text-sm font-bold text-[#0b91a9] hover:underline"
          >
            ← Back to Main Website
          </a>
        </form>
      </div>
    </main>
  );
}