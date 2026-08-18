"use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";

type ConnectorProfile = {
  id: string;
  connector_code: string | null;
  full_name: string;
  email: string;
};

export default function BrokerRegisterPage() {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [connectorCode, setConnectorCode] = useState("");

  async function getConnectorProfile(
    userId: string
  ): Promise<ConnectorProfile | null> {
    // Database trigger ko profile create karne ke liye thoda time dete hain.
    for (let attempt = 0; attempt < 10; attempt++) {
      const { data, error } = await supabase
        .from("connector_profiles")
        .select("id, connector_code, full_name, email")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.warn(
          `Connector profile lookup attempt ${attempt + 1}:`,
          error.message
        );
      }

      if (data) {
        return data as ConnectorProfile;
      }

      await new Promise((resolve) => setTimeout(resolve, 700));
    }

    return null;
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault();

    setLoading(true);
    setMessage("");
    setErrorMessage("");
    setConnectorCode("");

    const cleanName = name.trim();
    const cleanMobile = mobile.trim();
    const cleanEmail = email.trim().toLowerCase();

    // =====================================================
    // VALIDATION
    // =====================================================

    if (!cleanName) {
      setErrorMessage("Please enter your full name.");
      setLoading(false);
      return;
    }

    if (!cleanMobile) {
      setErrorMessage("Please enter your mobile number.");
      setLoading(false);
      return;
    }

    const mobileDigits = cleanMobile.replace(/\D/g, "");

    if (mobileDigits.length !== 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number.");
      setLoading(false);
      return;
    }

    if (!cleanEmail) {
      setErrorMessage("Please enter your email address.");
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

    try {
      // =====================================================
      // 1. CREATE SUPABASE AUTH ACCOUNT
      // =====================================================

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: cleanName,
            mobile: cleanMobile,

            // IMPORTANT:
            // Database trigger uses this to identify broker accounts.
            role: "broker",
          },
        },
      });

      if (error) {
        console.error("Auth registration error:", error);

        const errorText = error.message.toLowerCase();

        if (
          errorText.includes("already registered") ||
          errorText.includes("already exists") ||
          errorText.includes("user already registered")
        ) {
          setErrorMessage(
            "This email is already registered. Please login to your connector account."
          );
        } else if (errorText.includes("database error saving new user")) {
          setErrorMessage(
            "Account could not be created because the database profile setup failed. Please try again. If the problem continues, check the connector profile trigger in Supabase."
          );
        } else {
          setErrorMessage(error.message);
        }

        setLoading(false);
        return;
      }

      if (!data.user) {
        setErrorMessage(
          "Account could not be created. Please try again."
        );
        setLoading(false);
        return;
      }

      // =====================================================
      // 2. DATABASE TRIGGER CREATES CONNECTOR PROFILE
      // =====================================================
      //
      // auth.users
      //      ↓
      // create_broker_connector_profile()
      //      ↓
      // connector_profiles
      //      ↓
      // permanent connector_code
      //
      // Example:
      // LKC-0001
      // LKC-0002
      // LKC-0003
      // LKC-0004
      //
      // Frontend DOES NOT generate the ID.
      // This prevents duplicate IDs.
      // =====================================================

      const profile = await getConnectorProfile(data.user.id);

      // =====================================================
      // 3. CONNECTOR ID FOUND
      // =====================================================

      if (profile?.connector_code) {
        setConnectorCode(profile.connector_code);
      }

      // =====================================================
      // 4. IF EMAIL CONFIRMATION IS DISABLED
      // =====================================================

      if (data.session) {
        // Profile mil gaya hai to directly broker dashboard.
        if (profile?.connector_code) {
          window.location.href = "/broker";
          return;
        }

        // Profile trigger ko thoda aur time chahiye ho sakta hai.
        setMessage(
          "Account created successfully. Your connector profile is being prepared. Please refresh your dashboard shortly."
        );

        setLoading(false);
        return;
      }

      // =====================================================
      // 5. EMAIL CONFIRMATION REQUIRED
      // =====================================================

      if (profile?.connector_code) {
        setMessage(
          `Account created successfully. Your permanent Connector ID is ${profile.connector_code}. Please check your email to verify your account, then login.`
        );
      } else {
        setMessage(
          "Account created successfully. Please check your email to verify your account. Your permanent Connector ID will appear automatically after login."
        );
      }

      setLoading(false);
    } catch (error) {
      console.error("Registration error:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );

      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f8fb] px-5 py-10">

      {/* =====================================================
          LOGO
      ===================================================== */}

      <div className="mx-auto mb-8 flex justify-center">
        <a href="/">
          <img
            src="/loankarts-logo-transparent.png"
            alt="LoanKarts"
            className="h-20 w-auto max-w-[300px] object-contain"
          />
        </a>
      </div>

      {/* =====================================================
          REGISTER CARD
      ===================================================== */}

      <div className="mx-auto w-full max-w-[480px]">

        <form
          onSubmit={handleRegister}
          className="rounded-[24px] border border-slate-200 bg-white p-7 shadow-xl sm:p-9"
        >

          {/* =================================================
              TITLE
          ================================================= */}

          <div className="text-center">

            <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#08aeca]">
              LOANKARTS PARTNER
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight text-[#082f42]">
              Become a Connector Partner
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Create your LoanKarts connector account and join our partner
              network.
            </p>

          </div>

          {/* =================================================
              ERROR
          ================================================= */}

          {errorMessage && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">

              <p className="font-bold">
                Registration failed
              </p>

              <p className="mt-1">
                {errorMessage}
              </p>

            </div>
          )}

          {/* =================================================
              SUCCESS
          ================================================= */}

          {message && (
            <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">

              <p className="font-bold">
                Registration successful
              </p>

              <p className="mt-1 leading-6">
                {message}
              </p>

              {/* ============================================
                  CONNECTOR ID
              ============================================ */}

              {connectorCode && (
                <div className="mt-4 rounded-xl border border-green-300 bg-white p-5 text-center shadow-sm">

                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
                    Your Connector ID
                  </p>

                  <p className="mt-2 text-3xl font-black tracking-[0.12em] text-[#082f42]">
                    {connectorCode}
                  </p>

                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    This ID is permanently assigned to your account and will
                    remain the same.
                  </p>

                </div>
              )}

            </div>
          )}

          {/* =================================================
              NAME
          ================================================= */}

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
              autoComplete="name"
              className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-[#082f42] outline-none transition placeholder:text-slate-400 focus:border-[#08b8d4] focus:ring-4 focus:ring-cyan-100"
            />

          </div>

          {/* =================================================
              MOBILE
          ================================================= */}

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
              autoComplete="tel"
              maxLength={15}
              className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-[#082f42] outline-none transition placeholder:text-slate-400 focus:border-[#08b8d4] focus:ring-4 focus:ring-cyan-100"
            />

          </div>

          {/* =================================================
              EMAIL
          ================================================= */}

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
              autoComplete="email"
              className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-[#082f42] outline-none transition placeholder:text-slate-400 focus:border-[#08b8d4] focus:ring-4 focus:ring-cyan-100"
            />

          </div>

          {/* =================================================
              PASSWORD
          ================================================= */}

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
              autoComplete="new-password"
              className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-[#082f42] outline-none transition placeholder:text-slate-400 focus:border-[#08b8d4] focus:ring-4 focus:ring-cyan-100"
            />

          </div>

          {/* =================================================
              CONFIRM PASSWORD
          ================================================= */}

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
              autoComplete="new-password"
              className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-[#082f42] outline-none transition placeholder:text-slate-400 focus:border-[#08b8d4] focus:ring-4 focus:ring-cyan-100"
            />

          </div>

          {/* =================================================
              BUTTON
          ================================================= */}

          <button
            type="submit"
            disabled={loading}
            className="mt-7 flex h-[52px] w-full items-center justify-center rounded-xl bg-[#08b8d4] px-5 text-sm font-black text-white shadow-lg shadow-cyan-500/15 transition hover:-translate-y-0.5 hover:bg-[#079eb7] disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Creating Account...
              </>
            ) : (
              "CREATE CONNECTOR ACCOUNT →"
            )}
          </button>

          {/* =================================================
              LOGIN
          ================================================= */}

          <div className="mt-6 text-center">

            <p className="text-sm text-slate-500">
              Already have a connector account?
            </p>

            <a
              href="/broker/login"
              className="mt-1 inline-block text-sm font-extrabold text-[#08aeca] hover:underline"
            >
              Login to your account →
            </a>

          </div>

          {/* =================================================
              BACK
          ================================================= */}

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