"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type CustomerApplication = {
  id: string;
  customer_name: string;
  mobile: string;
  email: string | null;
  loan_type: string;
  loan_amount: number;
  employment: string;
  remarks: string | null;
  status: "New" | "Contacted" | "Processing" | "Approved" | "Rejected" | "Closed";
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
};

const statuses: CustomerApplication["status"][] = [
  "New",
  "Contacted",
  "Processing",
  "Approved",
  "Rejected",
  "Closed",
];

function money(value: number) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

export default function CustomerDashboardPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [customer, setCustomer] = useState<CustomerApplication | null>(null);
  const [status, setStatus] = useState<CustomerApplication["status"]>("New");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function loadCustomer() {
    if (!id) return;

    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.email?.toLowerCase() !== "docs@loankarts.com") {
      router.replace("/admin/login");
      return;
    }

    const { data, error: fetchError } = await supabase
      .from("customer_applications")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) {
      console.error(fetchError);
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    const record = data as CustomerApplication;
    setCustomer(record);
    setStatus(record.status);
    setNotes(record.admin_notes || "");
    setLoading(false);
  }

  useEffect(() => {
    loadCustomer();
  }, [id]);

  async function saveChanges() {
    if (!customer) return;

    setSaving(true);
    setSaved(false);
    setError("");

    const { data, error: updateError } = await supabase
      .from("customer_applications")
      .update({
        status,
        admin_notes: notes.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", customer.id)
      .select("*")
      .single();

    if (updateError) {
      console.error(updateError);
      setError(updateError.message);
      setSaving(false);
      return;
    }

    setCustomer(data as CustomerApplication);
    setSaved(true);
    setSaving(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/admin/login");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f8fb]">
        <div className="rounded-2xl bg-white px-8 py-7 text-center shadow-lg ring-1 ring-slate-200">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-[#10b7d3]" />
          <p className="mt-4 text-sm font-bold text-slate-500">
            Loading customer...
          </p>
        </div>
      </main>
    );
  }

  if (!customer) {
    return (
      <main className="min-h-screen bg-[#f4f8fb] p-6">
        <div className="mx-auto mt-20 max-w-xl rounded-2xl bg-white p-8 text-center shadow-lg ring-1 ring-slate-200">
          <h1 className="text-2xl font-black text-[#073b4c]">
            Customer not found
          </h1>
          <p className="mt-2 text-sm text-slate-500">{error}</p>
          <button
            onClick={() => router.push("/admin")}
            className="mt-6 rounded-xl bg-[#073b4c] px-5 py-3 text-sm font-black text-white"
          >
            ← Back to Admin
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f8fb]">
      {/* PREMIUM ADMIN HEADER */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#061f2a]/95 text-white shadow-[0_8px_30px_rgba(0,0,0,0.16)] backdrop-blur">
        <div className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">

          {/* BRAND */}
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="flex h-10 w-[150px] shrink-0 items-center justify-start px-0 sm:h-11 sm:w-[175px]">
              <img
                src="/loankarts-logo-white.png"
                alt="LoanKarts"
                className="h-6 w-auto max-w-full object-contain sm:h-7"
              />
            </div>

            <div className="hidden min-w-0 border-l border-white/15 pl-4 sm:block">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#10b7d3]">
                Customer Management
              </p>
              <p className="mt-0.5 truncate text-sm font-bold text-white">
                LoanKarts Customer Dashboard
              </p>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => router.push("/admin")}
              className="hidden rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-white/15 sm:inline-flex"
            >
              ← Admin Dashboard
            </button>

            <button
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white px-4 py-2.5 text-sm font-black text-[#073b4c] shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-100"
            >
              <span>Logout</span>
              <span className="text-base">↗</span>
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10">
        <div className="mb-6">
          <p className="text-[10px] font-black uppercase tracking-[.22em] text-[#10b7d3]">
            CUSTOMER PROFILE
          </p>
          <div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-[#073b4c] sm:text-4xl">
                {customer.customer_name}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Application ID: {customer.id}
              </p>
            </div>
            <span className="w-fit rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-xs font-black text-cyan-700">
              {customer.status}
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        {saved && (
          <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
            Customer details updated successfully.
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
          <div className="space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-7">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#10b7d3]">
                    APPLICATION
                  </p>
                  <h2 className="mt-1 text-xl font-black text-[#073b4c]">
                    Loan Requirement
                  </h2>
                </div>
                <div className="rounded-2xl bg-[#e9f8fb] px-4 py-3 text-right">
                  <p className="text-[9px] font-black uppercase text-[#0b91a9]">
                    Amount
                  </p>
                  <p className="mt-1 text-lg font-black text-[#073b4c]">
                    {money(customer.loan_amount)}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {[
                  ["Loan Type", customer.loan_type],
                  ["Employment", customer.employment],
                  ["Mobile", customer.mobile],
                  ["Email", customer.email || "Not provided"],
                  ["Applied On", new Date(customer.created_at).toLocaleString("en-IN")],
                  ["Last Updated", new Date(customer.updated_at).toLocaleString("en-IN")],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                      {label}
                    </p>
                    <p className="mt-2 break-words text-sm font-bold text-[#073b4c]">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-7">
              <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#10b7d3]">
                CUSTOMER REQUIREMENT
              </p>
              <h2 className="mt-1 text-xl font-black text-[#073b4c]">
                Additional Details
              </h2>
              <div className="mt-4 rounded-2xl bg-slate-50 p-5 text-sm leading-7 text-slate-700">
                {customer.remarks || "No additional details provided."}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href={`tel:${customer.mobile}`}
                className="inline-flex items-center justify-center rounded-xl bg-[#073b4c] px-5 py-3 text-xs font-black !text-white shadow-sm transition hover:bg-[#0b5269] hover:!text-white"
              >
                📞 CALL CUSTOMER
              </a>
              {customer.email && (
                <a
                  href={`mailto:${customer.email}`}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-black text-[#073b4c] hover:bg-slate-50"
                >
                  ✉ EMAIL CUSTOMER
                </a>
              )}
            </div>
          </div>

          <aside className="h-fit rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-7">
            <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#10b7d3]">
              ADMIN CONTROL
            </p>
            <h2 className="mt-1 text-xl font-black text-[#073b4c]">
              Manage Customer
            </h2>

            <label className="mt-6 block text-xs font-black uppercase tracking-wider text-slate-500">
              Application Status
            </label>
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as CustomerApplication["status"])
              }
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-[#10b7d3] focus:ring-4 focus:ring-cyan-50"
            >
              {statuses.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <label className="mt-5 block text-xs font-black uppercase tracking-wider text-slate-500">
              Admin Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={8}
              placeholder="Add follow-up notes, customer discussion, lender update..."
              className="mt-2 w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#10b7d3] focus:ring-4 focus:ring-cyan-50"
            />

            <button
              onClick={saveChanges}
              disabled={saving}
              className="mt-4 w-full rounded-xl bg-[#08b8d4] py-3.5 text-xs font-black text-white transition hover:bg-[#079eb7] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "SAVING..." : "SAVE CUSTOMER UPDATE →"}
            </button>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                Internal Note
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Only authorized LoanKarts admin users can access this customer dashboard.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}