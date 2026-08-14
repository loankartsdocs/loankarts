"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type FileStatus =
  | "Submitted"
  | "Processing"
  | "Approved"
  | "Disbursed"
  | "Rejected";

type DatabaseFile = {
  id: string;
  customer_name: string;
  mobile: string;
  email: string | null;
  loan_type: string;
  loan_amount: number;
  city: string;
  employment: string;
  monthly_income: number | null;
  remarks: string | null;
  status: FileStatus;
  update_text: string | null;
  broker_name: string;
  broker_id: string | null;
  created_at: string;
};

const COMMISSION_RATES: Record<string, number> = {
  "personal loan": 1.6,
  "business loan": 1.2,
  "home loan": 0.45,
  lap: 0.6,
  "used car loan": 1.5,
  "new car loan": 0.5,
};

function getCommissionRate(loanType: string) {
  const type = loanType.toLowerCase().trim();

  if (type.includes("personal")) return 1.6;
  if (type.includes("business")) return 1.2;
  if (type.includes("home")) return 0.45;
  if (type === "lap" || type.includes("lap")) return 0.6;
  if (type.includes("used") && type.includes("car")) return 1.5;
  if (type.includes("new") && type.includes("car")) return 0.5;

  return COMMISSION_RATES[type] || 0;
}

function calculateCommission(file: DatabaseFile) {
  if (file.status !== "Disbursed") return 0;

  const rate = getCommissionRate(file.loan_type);

  return (Number(file.loan_amount || 0) * rate) / 100;
}

export default function AdminPage() {
  const [files, setFiles] = useState<DatabaseFile[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | FileStatus>(
    "All"
  );

  const [selectedFile, setSelectedFile] =
    useState<DatabaseFile | null>(null);

  const [newStatus, setNewStatus] =
    useState<FileStatus>("Processing");

  const [newUpdate, setNewUpdate] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadFiles() {
    setLoading(true);
    setErrorMessage("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/admin/login";
        return;
      }

      if (user.email?.toLowerCase() !== "docs@loankarts.com") {
        await supabase.auth.signOut();
        window.location.href = "/admin/login";
        return;
      }

      const { data, error } = await supabase
        .from("loan_files")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        throw new Error(error.message);
      }

      setFiles((data || []) as DatabaseFile[]);
    } catch (error) {
      console.error(error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load loan files."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFiles();
  }, []);

  const filteredFiles = useMemo(() => {
    const text = search.toLowerCase().trim();

    return files.filter((file) => {
      const matchesSearch =
        !text ||
        file.id.toLowerCase().includes(text) ||
        file.customer_name.toLowerCase().includes(text) ||
        file.mobile.toLowerCase().includes(text) ||
        file.broker_name.toLowerCase().includes(text) ||
        file.loan_type.toLowerCase().includes(text) ||
        file.city.toLowerCase().includes(text);

      const matchesStatus =
        statusFilter === "All" ||
        file.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [files, search, statusFilter]);

  const stats = useMemo(() => {
    const totalLoanAmount = files.reduce(
      (sum, file) => sum + Number(file.loan_amount || 0),
      0
    );

    const totalCommission = files.reduce(
      (sum, file) => sum + calculateCommission(file),
      0
    );

    const brokerSet = new Set(
      files.map((file) =>
        file.broker_id || file.broker_name || "Unknown"
      )
    );

    return {
      total: files.length,

      brokers: brokerSet.size,

      submitted: files.filter(
        (file) => file.status === "Submitted"
      ).length,

      processing: files.filter(
        (file) => file.status === "Processing"
      ).length,

      approved: files.filter(
        (file) => file.status === "Approved"
      ).length,

      disbursed: files.filter(
        (file) => file.status === "Disbursed"
      ).length,

      rejected: files.filter(
        (file) => file.status === "Rejected"
      ).length,

      totalLoanAmount,

      totalCommission,
    };
  }, [files]);

  function openUpdate(file: DatabaseFile) {
    setSelectedFile(file);
    setNewStatus(file.status);
    setNewUpdate(file.update_text || "");
    setErrorMessage("");
  }

  async function saveUpdate() {
    if (!selectedFile) return;

    setSaving(true);
    setErrorMessage("");

    try {
      const updateText =
        newUpdate.trim() ||
        "Application status has been updated by LoanKarts.";

      const { data, error } = await supabase
        .from("loan_files")
        .update({
          status: newStatus,
          update_text: updateText,
        })
        .eq("id", selectedFile.id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      setFiles((previous) =>
        previous.map((file) =>
          file.id === selectedFile.id
            ? (data as DatabaseFile)
            : file
        )
      );

      setSelectedFile(null);
      setNewUpdate("");
    } catch (error) {
      console.error(error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to update application."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/admin/login";
  }

  function getStatusClass(status: FileStatus) {
    if (status === "Disbursed") {
      return "bg-green-100 text-green-700";
    }

    if (status === "Approved") {
      return "bg-blue-100 text-blue-700";
    }

    if (status === "Processing") {
      return "bg-amber-100 text-amber-700";
    }

    if (status === "Rejected") {
      return "bg-red-100 text-red-700";
    }

    return "bg-slate-100 text-slate-700";
  }

  function money(value: number) {
    return `₹${Number(value || 0).toLocaleString("en-IN")}`;
  }

  return (
    <main className="min-h-screen bg-[#f4f8fb]">

      {/* HEADER */}
      <header className="bg-[#073b4c] text-white shadow">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">

          <div className="flex items-center">
            <img
              src="/loankarts-logo-white.png"
              alt="LoanKarts"
              className="h-14 w-auto max-w-[240px] object-contain"
            />
          </div>

          <div className="flex items-center gap-2 sm:gap-3">

            <a
              href="/admin/brokers"
              className="rounded-xl border border-white/30 px-3 py-2 text-xs font-bold hover:bg-white hover:text-[#073b4c] sm:px-5 sm:py-3 sm:text-sm"
            >
              Brokers
            </a>

            <a
              href="/"
              className="hidden rounded-xl border border-white/30 px-5 py-3 text-sm font-bold hover:bg-white hover:text-[#073b4c] md:block"
            >
              Main Website
            </a>

            <button
              onClick={handleLogout}
              className="rounded-xl border border-white/30 px-3 py-2 text-xs font-bold hover:bg-white hover:text-[#073b4c] sm:px-5 sm:py-3 sm:text-sm"
            >
              Logout
            </button>

          </div>
        </div>
      </header>

      {/* CONTENT */}
      <section className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10">

        {/* TITLE */}
        <div className="mb-7">
          <p className="font-bold uppercase tracking-wide text-[#10b7d3]">
            LoanKarts Management
          </p>

          <h2 className="mt-2 text-3xl font-black text-[#073b4c] sm:text-4xl">
            Admin Dashboard
          </h2>

          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            Manage broker applications, loan files, statuses and commissions.
          </p>
        </div>

        {/* ERROR */}
        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            <p className="font-bold">
              ❌ Error
            </p>

            <p className="mt-1 text-sm">
              {errorMessage}
            </p>

            <button
              onClick={loadFiles}
              className="mt-4 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white"
            >
              Try Again
            </button>
          </div>
        )}

        {/* STATS */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">

          <StatCard
            title="Total Files"
            value={stats.total}
            icon="📁"
          />

          <StatCard
            title="Brokers"
            value={stats.brokers}
            icon="👥"
          />

          <StatCard
            title="Processing"
            value={stats.processing}
            icon="⏳"
          />

          <StatCard
            title="Approved"
            value={stats.approved}
            icon="✅"
          />

          <StatCard
            title="Disbursed"
            value={stats.disbursed}
            icon="💰"
          />

          <StatCard
            title="Rejected"
            value={stats.rejected}
            icon="❌"
          />

          <MoneyCard
            title="Loan Amount"
            value={money(stats.totalLoanAmount)}
            icon="💵"
          />

          <MoneyCard
            title="Commission"
            value={money(stats.totalCommission)}
            icon="🧾"
          />

        </div>

        {/* QUICK ACTIONS */}
        <div className="mt-7 grid gap-4 sm:grid-cols-2">

          <a
            href="/admin/brokers"
            className="rounded-2xl bg-[#073b4c] p-5 text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#0b5269]"
          >
            <p className="text-sm font-bold text-cyan-200">
              BROKER MANAGEMENT
            </p>

            <h3 className="mt-1 text-xl font-black">
              View All Brokers →
            </h3>

            <p className="mt-1 text-sm text-slate-300">
              View broker-wise files, loan amounts and commissions.
            </p>
          </a>

          <button
            onClick={loadFiles}
            className="rounded-2xl bg-white p-5 text-left shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5"
          >
            <p className="text-sm font-bold text-[#10b7d3]">
              DATA
            </p>

            <h3 className="mt-1 text-xl font-black text-[#073b4c]">
              Refresh Applications ↻
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Load the latest loan files from Supabase.
            </p>
          </button>

        </div>

        {/* SEARCH + FILTER */}
        <div className="mt-7 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">

          <div className="grid gap-4 lg:grid-cols-[1fr_220px]">

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Search Loan Files
              </label>

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search File ID, Customer, Mobile, Broker, Loan Type or City..."
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#10b7d3] focus:ring-2 focus:ring-cyan-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Filter Status
              </label>

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value as "All" | FileStatus
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-[#10b7d3]"
              >
                <option value="All">
                  All Status
                </option>

                <option value="Submitted">
                  Submitted
                </option>

                <option value="Processing">
                  Processing
                </option>

                <option value="Approved">
                  Approved
                </option>

                <option value="Disbursed">
                  Disbursed
                </option>

                <option value="Rejected">
                  Rejected
                </option>
              </select>
            </div>

          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
            <p className="font-semibold text-slate-500">
              Showing{" "}
              <span className="font-black text-[#073b4c]">
                {filteredFiles.length}
              </span>{" "}
              of{" "}
              <span className="font-black text-[#073b4c]">
                {files.length}
              </span>{" "}
              files
            </p>

            {(search || statusFilter !== "All") && (
              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("All");
                }}
                className="font-bold text-[#0b91a9] hover:underline"
              >
                Clear Filters
              </button>
            )}
          </div>

        </div>

        {/* FILE TABLE */}
        <div className="mt-6 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">

          <div className="border-b border-slate-200 px-5 py-5 sm:px-6">

            <h3 className="text-xl font-black text-[#073b4c]">
              Loan Applications
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Live applications submitted by broker partners.
            </p>

          </div>

          {loading ? (
            <div className="px-6 py-16 text-center">

              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#10b7d3]" />

              <p className="mt-4 text-sm font-semibold text-slate-500">
                Loading applications...
              </p>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[900px] xl:min-w-0">

                <thead className="bg-slate-50">

                  <tr className="text-left text-xs uppercase tracking-wide text-slate-500">

                    <th className="px-5 py-4">
                      File
                    </th>

                    <th className="px-5 py-4">
                      Customer
                    </th>

                    <th className="px-5 py-4">
                      Loan
                    </th>

                    <th className="px-5 py-4">
                      Broker
                    </th>

                    <th className="px-5 py-4">
                      Status
                    </th>

                    <th className="px-5 py-4">
                      Commission
                    </th>

                    <th className="px-5 py-4">
                      Date
                    </th>

                    <th className="px-5 py-4">
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filteredFiles.map((file) => {

                    const commission =
                      calculateCommission(file);

                    return (
                      <tr
                        key={file.id}
                        className="border-t border-slate-100 hover:bg-slate-50"
                      >

                        <td className="px-5 py-5">
                          <p className="max-w-[220px] break-all font-black text-[#073b4c]">
                            {file.id}
                          </p>
                        </td>

                        <td className="px-5 py-5">

                          <p className="font-bold text-slate-800">
                            {file.customer_name}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {file.mobile}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {file.city}
                          </p>

                        </td>

                        <td className="px-5 py-5">

                          <p className="font-semibold text-slate-700">
                            {file.loan_type}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {money(file.loan_amount)}
                          </p>

                        </td>

                        <td className="px-5 py-5 text-sm font-semibold text-slate-700">
                          {file.broker_name}
                        </td>

                        <td className="px-5 py-5">

                          <span
                            className={`rounded-full px-3 py-1.5 text-xs font-bold ${getStatusClass(
                              file.status
                            )}`}
                          >
                            {file.status}
                          </span>

                        </td>

                        <td className="px-5 py-5">

                          <p className="font-black text-green-600">
                            {money(commission)}
                          </p>

                          {file.status === "Disbursed" ? (
                            <p className="mt-1 text-xs text-slate-400">
                              {getCommissionRate(
                                file.loan_type
                              )}
                              %
                            </p>
                          ) : (
                            <p className="mt-1 text-xs text-slate-400">
                              Disbursed only
                            </p>
                          )}

                        </td>

                        <td className="px-5 py-5 text-sm text-slate-500">
                          {new Date(
                            file.created_at
                          ).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>

                        <td className="px-5 py-5">

                          <button
                            onClick={() =>
                              openUpdate(file)
                            }
                            className="whitespace-nowrap rounded-xl bg-[#073b4c] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#0b5269]"
                          >
                            Manage
                          </button>

                        </td>

                      </tr>
                    );
                  })}

                  {filteredFiles.length === 0 && (
                    <tr>

                      <td
                        colSpan={8}
                        className="px-6 py-16 text-center text-slate-500"
                      >
                        No loan files found.
                      </td>

                    </tr>
                  )}

                </tbody>

              </table>

            </div>
          )}

        </div>

      </section>

      {/* MANAGE MODAL */}
      {selectedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4">

          <div className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">

            {/* MODAL HEADER */}
            <div className="flex items-start justify-between gap-4 bg-[#073b4c] px-5 py-5 text-white sm:px-7">

              <div className="min-w-0">

                <p className="break-all text-xs font-bold text-[#10b7d3]">
                  {selectedFile.id}
                </p>

                <h3 className="mt-1 text-xl font-black sm:text-2xl">
                  Manage Application
                </h3>

                <p className="mt-1 text-sm text-slate-300">
                  {selectedFile.customer_name} •{" "}
                  {selectedFile.loan_type}
                </p>

              </div>

              <button
                onClick={() => setSelectedFile(null)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/20 text-2xl text-white hover:bg-white/10"
              >
                ×
              </button>

            </div>

            {/* MODAL BODY */}
            <div className="min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6">

              {/* CUSTOMER DETAILS */}
              <div>

                <h4 className="text-lg font-black text-[#073b4c]">
                  Customer Details
                </h4>

                <div className="mt-4 grid gap-4 rounded-2xl bg-slate-50 p-5 sm:grid-cols-2">

                  <Info
                    label="Customer Name"
                    value={selectedFile.customer_name}
                  />

                  <Info
                    label="Mobile"
                    value={selectedFile.mobile}
                  />

                  <Info
                    label="Email"
                    value={selectedFile.email || "-"}
                  />

                  <Info
                    label="City"
                    value={selectedFile.city}
                  />

                  <Info
                    label="Employment"
                    value={selectedFile.employment}
                  />

                  <Info
                    label="Monthly Income"
                    value={
                      selectedFile.monthly_income
                        ? money(
                            selectedFile.monthly_income
                          )
                        : "-"
                    }
                  />

                  <Info
                    label="Broker"
                    value={selectedFile.broker_name}
                  />

                  <Info
                    label="Loan Type"
                    value={selectedFile.loan_type}
                  />

                  <Info
                    label="Loan Amount"
                    value={money(
                      selectedFile.loan_amount
                    )}
                  />

                  <Info
                    label="Commission Rate"
                    value={`${getCommissionRate(
                      selectedFile.loan_type
                    )}%`}
                  />

                  <Info
                    label="Current Commission"
                    value={money(
                      calculateCommission(selectedFile)
                    )}
                  />

                  <Info
                    label="Current Status"
                    value={selectedFile.status}
                  />

                </div>

              </div>

              {/* CUSTOMER REMARKS */}
              <div className="mt-6">

                <h4 className="text-lg font-black text-[#073b4c]">
                  Customer Remarks
                </h4>

                <div className="mt-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                  {selectedFile.remarks ||
                    "No customer remarks available."}
                </div>

              </div>

              {/* STATUS */}
              <div className="mt-6">

                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Update Status
                </label>

                <select
                  value={newStatus}
                  onChange={(e) =>
                    setNewStatus(
                      e.target.value as FileStatus
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-[#10b7d3] focus:ring-2 focus:ring-cyan-100"
                >

                  <option value="Submitted">
                    Submitted
                  </option>

                  <option value="Processing">
                    Processing
                  </option>

                  <option value="Approved">
                    Approved
                  </option>

                  <option value="Disbursed">
                    Disbursed
                  </option>

                  <option value="Rejected">
                    Rejected
                  </option>

                </select>

                {newStatus === "Disbursed" && (
                  <div className="mt-3 rounded-xl border border-green-200 bg-green-50 p-4">

                    <p className="text-xs font-bold uppercase text-green-700">
                      Broker Commission
                    </p>

                    <p className="mt-1 text-2xl font-black text-green-700">
                      {money(
                        (Number(
                          selectedFile.loan_amount
                        ) *
                          getCommissionRate(
                            selectedFile.loan_type
                          )) /
                          100
                      )}
                    </p>

                    <p className="mt-1 text-xs text-green-600">
                      {getCommissionRate(
                        selectedFile.loan_type
                      )}
                      % of loan amount
                    </p>

                  </div>
                )}

              </div>

              {/* UPDATE */}
              <div className="mt-5">

                <label className="mb-2 block text-sm font-bold text-slate-700">
                  File Update / Admin Remark
                </label>

                <textarea
                  value={newUpdate}
                  onChange={(e) =>
                    setNewUpdate(e.target.value)
                  }
                  rows={5}
                  placeholder="Write the latest update for the broker..."
                  className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#10b7d3] focus:ring-2 focus:ring-cyan-100"
                />

              </div>

              {/* OLD UPDATE */}
              <div className="mt-5 rounded-xl bg-slate-50 p-4">

                <p className="text-xs font-bold uppercase text-slate-500">
                  Current Update
                </p>

                <p className="mt-2 text-sm text-slate-700">
                  {selectedFile.update_text ||
                    "No update yet."}
                </p>

              </div>

            </div>

            {/* MODAL FOOTER */}
            <div className="sticky bottom-0 z-10 flex shrink-0 flex-col-reverse gap-3 border-t border-slate-200 bg-white p-3 shadow-[0_-4px_12px_rgba(0,0,0,0.04)] sm:flex-row sm:justify-end sm:p-4">

              <button
                onClick={() =>
                  setSelectedFile(null)
                }
                className="w-full rounded-xl border border-slate-300 px-6 py-3 font-bold text-slate-600 hover:bg-slate-50 sm:w-auto"
              >
                Cancel
              </button>

              <button
                onClick={saveUpdate}
                disabled={saving}
                className="w-full rounded-xl bg-[#10b7d3] px-6 py-3 font-black text-white hover:bg-[#0da8c1] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {saving
                  ? "Saving..."
                  : "Save Update"}
              </button>

            </div>

          </div>

        </div>
      )}

    </main>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">

      <div className="flex items-center justify-between gap-2">

        <span className="text-xl sm:text-2xl">
          {icon}
        </span>

        <span className="text-xl font-black text-[#073b4c] sm:text-2xl">
          {value}
        </span>

      </div>

      <p className="mt-3 text-xs font-bold text-slate-500 sm:text-sm">
        {title}
      </p>

    </div>
  );
}

function MoneyCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">

      <div className="flex items-center justify-between gap-2">

        <span className="text-xl sm:text-2xl">
          {icon}
        </span>

      </div>

      <p className="mt-2 truncate text-base font-black text-[#073b4c] sm:text-lg">
        {value}
      </p>

      <p className="mt-1 text-xs font-bold text-slate-500 sm:text-sm">
        {title}
      </p>

    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">

      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-slate-700">
        {value}
      </p>

    </div>
  );
}