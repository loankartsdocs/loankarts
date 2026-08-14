"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type FileStatus =
  | "Submitted"
  | "Processing"
  | "Approved"
  | "Disbursed"
  | "Rejected";

type DocumentPaths = Record<string, string | null> | null;

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
  commission_rate: number | null;
  commission_amount: number | null;
  document_paths: DocumentPaths;
  created_at: string;
};

type LoanFile = DatabaseFile;

const documentLabels: Record<string, string> = {
  aadhaarFront: "Aadhaar Front",
  aadhaarBack: "Aadhaar Back",
  pan: "PAN Card",
  bankStatement: "Bank Statement",
  itr: "ITR",
  salarySlip: "Salary Slip",
  other: "Other Document",
};

export default function BrokerDashboard() {
  const [files, setFiles] = useState<LoanFile[]>([]);
  const [brokerName, setBrokerName] = useState("Broker Partner");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<LoanFile | null>(null);
  const [openingDocument, setOpeningDocument] = useState<string | null>(null);

  async function loadFiles() {
    setLoading(true);
    setErrorMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw new Error(userError.message);
      }

      if (!user) {
        window.location.href = "/broker/login";
        return;
      }

      const metadataName =
        typeof user.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name.trim()
          : "";

      setBrokerName(
        metadataName ||
          (typeof user.email === "string" ? user.email.split("@")[0] : "Broker Partner")
      );

      const { data, error } = await supabase
        .from("loan_files")
        .select(
          `
          id,
          customer_name,
          mobile,
          email,
          loan_type,
          loan_amount,
          city,
          employment,
          monthly_income,
          remarks,
          status,
          update_text,
          commission_rate,
          commission_amount,
          document_paths,
          created_at
        `
        )
        .eq("broker_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        throw new Error(error.message);
      }

      setFiles((data || []) as LoanFile[]);
    } catch (error) {
      console.error(error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load your loan files."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFiles();

    const channel = supabase
      .channel("broker-loan-files")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "loan_files",
        },
        () => {
          loadFiles();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

 const stats = useMemo(() => ({
    total: files.length,
    submitted: files.filter((f) => f.status === "Submitted").length,
    processing: files.filter((f) => f.status === "Processing").length,
    approved: files.filter((f) => f.status === "Approved").length,
    disbursed: files.filter((f) => f.status === "Disbursed").length,
    rejected: files.filter((f) => f.status === "Rejected").length,
    totalCommission: files.reduce(
      (sum, file) => sum + commissionAmount(file),
      0
    ),
  }), [files]);

  function money(value: number | null) {
    if (value === null || value === undefined) return "—";

    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  }

  function commissionAmount(file: LoanFile) {
    if (file.status !== "Disbursed") return 0;
    if (file.commission_amount !== null && file.commission_amount !== undefined) {
      return Number(file.commission_amount);
    }
    const rate = Number(file.commission_rate || 0);
    return (Number(file.loan_amount || 0) * rate) / 100;
  }

  function statusClass(status: FileStatus) {
    switch (status) {
      case "Disbursed":
        return "bg-green-100 text-green-700";

      case "Approved":
        return "bg-blue-100 text-blue-700";

      case "Processing":
        return "bg-amber-100 text-amber-700";

      case "Rejected":
        return "bg-red-100 text-red-700";

      default:
        return "bg-slate-100 text-slate-700";
    }
  }

  function statusIcon(status: FileStatus) {
    switch (status) {
      case "Submitted":
        return "📨";

      case "Processing":
        return "⏳";

      case "Approved":
        return "✅";

      case "Disbursed":
        return "💰";

      case "Rejected":
        return "❌";

      default:
        return "📄";
    }
  }

  async function openDocument(
    path: string | null,
    documentName: string
  ) {
    if (!path) {
      alert("This document is not available.");
      return;
    }

    setOpeningDocument(documentName);

    try {
      const { data, error } = await supabase.storage
        .from("loan-documents")
        .createSignedUrl(path, 3600);

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.signedUrl) {
        throw new Error("Unable to create document link.");
      }

      window.open(data.signedUrl, "_blank");
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Unable to open document."
      );
    } finally {
      setOpeningDocument(null);
    }
  }

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
    } finally {
      window.location.href = "/";
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f8fb]">
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050b20]/95 text-white shadow-xl backdrop-blur">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-5 py-4 sm:px-6 lg:px-8">
          <a href="/" className="flex items-center gap-4">
            <div className="flex h-12 w-[150px] items-center">
              <img
                src="/logo-white.png"
                alt="LoanKarts"
                width={150}
                height={42}
                className="h-[42px] w-[150px] object-contain"
              />
            </div>

            <div className="hidden border-l border-white/15 pl-4 sm:block">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#08b8d4]">
                Partner Portal
              </p>
              <p className="mt-0.5 text-xs text-white/55">
                LoanKarts Broker Dashboard
              </p>
            </div>
          </a>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-extrabold text-white transition hover:border-red-300/40 hover:bg-red-500/10 hover:text-red-100 sm:px-5 sm:text-sm"
          >
            Logout
          </button>
        </div>
      </header>

      {/* CONTENT */}
      <section className="mx-auto max-w-[1280px] px-5 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="relative overflow-hidden rounded-[28px] bg-[#062536] px-6 py-8 text-white shadow-2xl sm:px-8 lg:px-10">
          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#08b8d4]/10 blur-3xl" />
          <div className="absolute -bottom-28 right-1/3 h-56 w-56 rounded-full bg-[#08b8d4]/10 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-center">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-[#08b8d4]">
                WELCOME, {brokerName}
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                Broker Dashboard
              </h2>

              <p className="mt-2 max-w-[620px] text-sm leading-6 text-white/60 sm:text-base">
                Track your submitted loan files, monitor application progress,
                and view your latest commission updates.
              </p>
            </div>

            <a
              href="/broker/submit"
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[#08b8d4] px-6 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5 hover:bg-[#079eb7]"
            >
              +&nbsp; SUBMIT NEW FILE
            </a>
          </div>
        </div>

        {/* ERROR */}
        {errorMessage && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            <p className="font-bold">
              ❌ Unable to load files
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
        <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-7">
          <Stat
            title="Total Files"
            value={stats.total}
            icon="📁"
          />

          <Stat
            title="Submitted"
            value={stats.submitted}
            icon="📨"
          />

          <Stat
            title="Processing"
            value={stats.processing}
            icon="⏳"
          />

          <Stat
            title="Approved"
            value={stats.approved}
            icon="✅"
          />

          <Stat
            title="Disbursed"
            value={stats.disbursed}
            icon="💰"
          />

          <Stat
            title="Rejected"
            value={stats.rejected}
            icon="❌"
          />

          <MoneyStat
            title="Commission"
            value={stats.totalCommission}
            icon="💰"
          />
        </div>

        {/* FILES */}
        <div className="mt-7 overflow-hidden rounded-[28px] bg-white shadow-xl shadow-slate-200/50 ring-1 ring-slate-200">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 bg-white px-5 py-5 sm:px-6 md:flex-row md:items-center">
            <div>
              <h3 className="text-xl font-black tracking-tight text-[#073b4c]">
                My Loan Files
              </h3>

              <p className="mt-1 text-[11px] text-slate-500">
                Latest status and updates from LoanKarts.
              </p>
            </div>

            <a
              href="/broker/submit"
              className="rounded-xl border border-[#10b7d3] px-5 py-2.5 text-sm font-bold text-[#0b91a9] hover:bg-cyan-50"
            >
              Submit Another File
            </a>
          </div>

          {loading ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#10b7d3]" />

              <p className="mt-4 text-sm font-semibold text-slate-500">
                Loading your loan files...
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px]">
                <thead className="bg-[#f7fafc]">
                  <tr className="text-left text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
                    <th className="px-6 py-4">
                      File ID
                    </th>

                    <th className="px-6 py-4">
                      Customer
                    </th>

                    <th className="px-6 py-4">
                      Loan
                    </th>

                    <th className="px-6 py-4">
                      Status
                    </th>

                    <th className="px-6 py-4">
                      Latest Update
                    </th>

                    <th className="px-6 py-4">
                      Commission
                    </th>

                    <th className="px-6 py-4">
                      Date
                    </th>

                    <th className="px-6 py-4">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {files.map((file) => (
                    <tr
                      key={file.id}
                      className="border-t border-slate-100 transition hover:bg-[#f7fcfd]"
                    >
                      <td className="px-5 py-4">
                        <span className="text-[12px] font-extrabold text-[#073b4c]">
                          {file.id}
                        </span>
                      </td>

                      <td className="px-5 py-4">
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

                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-700">
                          {file.loan_type}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {money(file.loan_amount)}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex min-w-[92px] items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-extrabold tracking-tight shadow-sm ${statusClass(
                            file.status
                          )}`}
                        >
                          <span
                            className={`relative flex h-2 w-2 items-center justify-center ${
                              file.status === "Disbursed"
                                ? "text-green-600"
                                : file.status === "Approved"
                                ? "text-blue-600"
                                : file.status === "Processing"
                                ? "text-amber-600"
                                : file.status === "Rejected"
                                ? "text-red-600"
                                : "text-slate-500"
                            }`}
                          >
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-35" />
                            <span className="relative h-1.5 w-1.5 rounded-full bg-current" />
                          </span>
                          <span>{file.status}</span>
                        </span>
                      </td>

                      <td className="max-w-xs px-6 py-5 text-sm text-slate-600">
                        {file.update_text ||
                          "No update available yet."}
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-[13px] font-extrabold text-green-600">
                          {file.status === "Disbursed"
                            ? money(commissionAmount(file))
                            : "—"}
                        </p>
                        {file.status === "Disbursed" && (
                          <p className="mt-1 text-xs text-slate-400">
                            {Number(file.commission_rate || 0).toFixed(2)}%
                          </p>
                        )}
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-500">
                        {new Date(
                          file.created_at
                        ).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      <td className="px-5 py-4">
                        <button
                          onClick={() =>
                            setSelectedFile(file)
                          }
                          className="whitespace-nowrap rounded-lg bg-[#08b8d4] px-4 py-2 text-[11px] font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#079eb7]"
                        >
                          View File
                        </button>
                      </td>
                    </tr>
                  ))}

                  {files.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-6 py-14 text-center"
                      >
                        <div className="text-4xl">
                          📁
                        </div>

                        <p className="mt-3 font-bold text-slate-700">
                          No loan files submitted yet
                        </p>

                        <p className="mt-1 text-[11px] text-slate-500">
                          Submit your first loan file to start
                          tracking it here.
                        </p>

                        <a
                          href="/broker/submit"
                          className="mt-5 inline-block rounded-xl bg-[#10b7d3] px-5 py-3 text-sm font-black text-white"
                        >
                          Submit New File
                        </a>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* INFO */}
        <div className="mt-6 rounded-2xl border border-cyan-100 bg-gradient-to-r from-cyan-50 to-white p-5 shadow-sm">
          <p className="font-bold text-[#073b4c]">
            📌 Live File Tracking
          </p>

          <p className="mt-1 text-sm leading-6 text-slate-600">
            When the LoanKarts team changes your application
            status or adds an update, it will appear here automatically.
          </p>
        </div>

        <div className="mt-5 flex flex-col justify-between gap-2 px-1 text-xs text-slate-400 sm:flex-row">
          <p>LoanKarts Broker Partner Portal</p>
          <p>Secure file tracking &amp; commission updates</p>
        </div>
      </section>

      {/* FILE DETAILS POPUP */}
      {selectedFile && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#050b20]/80 p-3 backdrop-blur-md sm:p-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="broker-file-title"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedFile(null);
            }
          }}
        >
          <div
            className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl ring-1 ring-white/20"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* POPUP HEADER — stays fixed while details scroll */}
            <div className="flex shrink-0 items-center justify-between bg-[#062536] px-5 py-5 text-white sm:px-7">
              <div className="min-w-0 pr-4">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#08b8d4]">
                  LOANKARTS • LOAN FILE
                </p>

                <h3
                  id="broker-file-title"
                  className="mt-1 truncate text-xl font-black sm:text-2xl"
                >
                  {selectedFile.customer_name}
                </h3>

                <p className="mt-1 truncate text-xs text-white/55 sm:text-sm">
                  File ID: {selectedFile.id}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                aria-label="Close file details"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/5 text-2xl font-light leading-none text-white transition hover:border-white/40 hover:bg-white hover:text-[#062536]"
              >
                ×
              </button>
            </div>

            {/* POPUP BODY — only this area scrolls */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain overscroll-y-contain p-5 sm:p-6 [scrollbar-width:thin]">
              {/* APPLICATION SUMMARY */}
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 p-5">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
                      Application Status
                    </p>

                    <div className="mt-3">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-extrabold ${statusClass(
                          selectedFile.status
                        )}`}
                      >
                        <span>{statusIcon(selectedFile.status)}</span>
                        {selectedFile.status}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-5">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
                      Loan Amount
                    </p>

                    <p className="mt-3 text-2xl font-black text-[#062536]">
                      {money(selectedFile.loan_amount)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-green-100 bg-green-50 p-5">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-green-700">
                      Your Commission
                    </p>

                    <p className="mt-3 text-2xl font-black text-green-700">
                      {selectedFile.status === "Disbursed"
                        ? money(commissionAmount(selectedFile))
                        : "Pending"}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      {selectedFile.status === "Disbursed"
                        ? `${Number(selectedFile.commission_rate || 0).toFixed(2)}% commission`
                        : "Payable after disbursement"}
                    </p>
                  </div>
                </div>

                {/* APPLICATION PROGRESS */}
                <div className="mt-7">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-black text-[#062536]">
                      Application Progress
                    </p>
                    <p className="text-xs font-bold text-slate-400">
                      {selectedFile.status === "Rejected"
                        ? "Application closed"
                        : selectedFile.status === "Disbursed"
                        ? "Completed"
                        : "In progress"}
                    </p>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-4">
                    {[
                      "Submitted",
                      "Processing",
                      "Approved",
                      "Disbursed",
                    ].map((status, index) => {
                      const currentIndex = [
                        "Submitted",
                        "Processing",
                        "Approved",
                        "Disbursed",
                      ].indexOf(selectedFile.status);

                      const done =
                        selectedFile.status !== "Rejected" &&
                        currentIndex >= index;

                      const current = selectedFile.status === status;

                      return (
                        <div key={status} className="flex items-center gap-2">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black ${
                              done
                                ? "bg-[#08b8d4] text-white"
                                : "bg-slate-100 text-slate-400"
                            }`}
                          >
                            {done ? "✓" : index + 1}
                          </div>

                          <div className="min-w-0">
                            <p
                              className={`text-xs font-extrabold ${
                                current
                                  ? "text-[#062536]"
                                  : done
                                  ? "text-slate-600"
                                  : "text-slate-400"
                              }`}
                            >
                              {status}
                            </p>
                            {current && (
                              <p className="text-[10px] font-semibold text-[#08aeca]">
                                Current stage
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {selectedFile.status === "Rejected" && (
                    <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                      ❌ This application has been rejected.
                    </div>
                  )}
                </div>
              </div>

              {/* CUSTOMER DETAILS */}
              <div className="mt-6">
                <h4 className="text-[15px] font-extrabold text-[#073b4c]">
                  Customer Details
                </h4>

                <div className="mt-3 grid gap-4 md:grid-cols-2">
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
                    value={selectedFile.email || "Not provided"}
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
                    value={money(
                      selectedFile.monthly_income
                    )}
                  />

                  <Info
                    label="Loan Type"
                    value={selectedFile.loan_type}
                  />

                  <Info
                    label="Application Date"
                    value={new Date(
                      selectedFile.created_at
                    ).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  />
                </div>
              </div>

              {/* REMARKS */}
              <div className="mt-6">
                <h4 className="text-[15px] font-extrabold text-[#073b4c]">
                  Remarks
                </h4>

                <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                  {selectedFile.remarks ||
                    "No remarks provided."}
                </div>
              </div>

              {/* LATEST UPDATE */}
              <div className="mt-6">
                <h4 className="text-[15px] font-extrabold text-[#073b4c]">
                  Latest LoanKarts Update
                </h4>

                <div className="mt-3 rounded-2xl border border-cyan-100 bg-cyan-50 p-5">
                  <p className="font-bold text-[#073b4c]">
                    📌 Application Update
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {selectedFile.update_text ||
                      "No update available yet."}
                  </p>
                </div>
              </div>

              {/* DOCUMENTS */}
              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-[15px] font-extrabold text-[#073b4c]">
                      Customer Documents
                    </h4>

                    <p className="mt-1 text-[11px] text-slate-500">
                      Open uploaded documents securely.
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {Object.entries(documentLabels).map(
                    ([key, label]) => {
                      const path =
                        selectedFile.document_paths?.[key] ||
                        null;

                      return (
                        <div
                          key={key}
                          className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-xl">
                              📄
                            </div>

                            <div className="min-w-0">
                              <p className="truncate font-bold text-[#073b4c]">
                                {label}
                              </p>

                              <p
                                className={`mt-1 text-xs font-semibold ${
                                  path
                                    ? "text-green-600"
                                    : "text-slate-400"
                                }`}
                              >
                                {path
                                  ? "Document uploaded"
                                  : "Not uploaded"}
                              </p>
                            </div>
                          </div>

                          <button
                            disabled={
                              !path ||
                              openingDocument === key
                            }
                            onClick={() =>
                              openDocument(path, key)
                            }
                            className={`shrink-0 rounded-xl px-4 py-2.5 text-xs font-black text-white ${
                              path
                                ? "bg-[#10b7d3] hover:bg-[#0da8c1]"
                                : "cursor-not-allowed bg-slate-300"
                            }`}
                          >
                            {openingDocument === key
                              ? "Opening..."
                              : "View"}
                          </button>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>

              {/* CLOSE */}
              <div className="mt-8 flex justify-end border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="rounded-xl bg-[#062536] px-6 py-3 text-sm font-extrabold text-white transition hover:bg-[#0b5269]"
                >
                  Close File
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
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
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 break-words font-bold text-[#073b4c]">
        {value}
      </p>
    </div>
  );
}

function MoneyStat({
  title,
  value,
}: {
  title: string;
  value: number;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-green-100 bg-gradient-to-br from-white to-green-50 px-4 py-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-[18px] shadow-sm">
          💰
        </div>

        <p className="text-[18px] font-black tracking-tight text-green-700">
          {new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
          }).format(value || 0)}
        </p>
      </div>

      <p className="mt-3 text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
        {title}
      </p>
    </div>
  );
}

function Stat({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: string;
}) {
  const iconMap: Record<string, string> = {
    "📁": "📁",
    "📨": "📨",
    "⏳": "⏳",
    "✅": "✅",
    "💰": "💰",
    "❌": "❌",
  };

  return (
    <div className="group rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#08b8d4]/30 hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#062536] text-[18px] shadow-sm">
          {iconMap[icon] || "•"}
        </div>

        <span className="text-2xl font-black tracking-tight text-[#062536]">
          {value}
        </span>
      </div>

      <p className="mt-3 text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
        {title}
      </p>
    </div>
  );
}