"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type LoanFile = {
  id: string;
  broker_id: string | null;
  broker_name: string;
  customer_name: string;
  loan_type: string;
  status: string;
  loan_amount: number;
  commission_rate: number;
  commission_amount: number;
  document_paths: Record<string, string | null> | null;
  update_text: string | null;
  created_at?: string;
};

type Broker = {
  id: string;
  name: string;
  total: number;
  processing: number;
  approved: number;
  disbursed: number;
  rejected: number;
  amount: number;
  totalCommission: number;
  fileList: LoanFile[];
};

export default function BrokerManagementPage() {
  const [files, setFiles] = useState<LoanFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const [selectedBroker, setSelectedBroker] = useState<Broker | null>(null);
  const [detailsBroker, setDetailsBroker] = useState<Broker | null>(null);

  useEffect(() => {
    loadBrokers();
  }, []);

  async function loadBrokers() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("loan_files")
      .select(
        `
        id,
        broker_id,
        broker_name,
        customer_name,
        loan_type,
        status,
        loan_amount,
        commission_rate,
        commission_amount,
        document_paths,
        update_text
        `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setError(error.message);
      setLoading(false);
      return;
    }

    setFiles((data || []) as LoanFile[]);
    setLoading(false);
  }

  const brokers = useMemo<Broker[]>(() => {
    const map = new Map<string, Broker>();

    files.forEach((file) => {
      const id = file.broker_id || file.broker_name || "unknown";

      if (!map.has(id)) {
        map.set(id, {
          id,
          name: displayBrokerName(file.broker_name),
          total: 0,
          processing: 0,
          approved: 0,
          disbursed: 0,
          rejected: 0,
          amount: 0,
          totalCommission: 0,
          fileList: [],
        });
      }

      const broker = map.get(id)!;

      broker.fileList.push(file);
      broker.total += 1;
      broker.amount += Number(file.loan_amount || 0);

      if (file.status === "Processing") {
        broker.processing += 1;
      }

      if (file.status === "Approved") {
        broker.approved += 1;
      }

      if (file.status === "Disbursed") {
        broker.disbursed += 1;
        broker.totalCommission += Number(file.commission_amount || 0);
      }

      if (file.status === "Rejected") {
        broker.rejected += 1;
      }
    });

    return Array.from(map.values());
  }, [files]);

  const filteredBrokers = brokers.filter((broker) =>
    broker.name.toLowerCase().includes(search.toLowerCase())
  );

  function money(value: number) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value || 0);
  }

  function percentage(value: number) {
    return `${Number(value || 0).toFixed(2)}%`;
  }

  function displayBrokerName(name: string) {
    const raw = String(name || "").trim();

    if (!raw) return "Connector Partner";

    if (raw.includes("@")) {
      const localPart = raw.split("@")[0].replace(/[._-]+/g, " ").trim();

      if (!localPart) return "Connector Partner";

      return localPart
        .split(/\s+/)
        .map(
          (part) =>
            part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
        )
        .join(" ");
    }

    return raw;
  }

  function statusMeta(status: string) {
    switch (status) {
      case "Disbursed":
        return {
          label: "Disbursed",
          dot: "bg-emerald-500",
          badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
          animate: true,
        };
      case "Approved":
        return {
          label: "Approved",
          dot: "bg-sky-500",
          badge: "border-sky-200 bg-sky-50 text-sky-700",
          animate: false,
        };
      case "Processing":
        return {
          label: "Processing",
          dot: "bg-amber-500",
          badge: "border-amber-200 bg-amber-50 text-amber-700",
          animate: true,
        };
      case "Rejected":
        return {
          label: "Rejected",
          dot: "bg-rose-500",
          badge: "border-rose-200 bg-rose-50 text-rose-700",
          animate: false,
        };
      default:
        return {
          label: "Submitted",
          dot: "bg-cyan-500",
          badge: "border-cyan-200 bg-cyan-50 text-cyan-700",
          animate: true,
        };
    }
  }

  async function openDocument(path: string) {
    const { data, error } = await supabase.storage
      .from("loan-documents")
      .createSignedUrl(path, 3600);

    if (error || !data?.signedUrl) {
      console.error(error);
      alert("Unable to open document");
      return;
    }

    window.open(data.signedUrl, "_blank");
  }

  function getCommissionRate(file: LoanFile) {
    const storedRate = Number(file.commission_rate || 0);
    if (storedRate > 0) return storedRate;

    const type = file.loan_type.toLowerCase().trim();

    if (type.includes("personal")) return 1.6;
    if (type.includes("business")) return 1.2;
    if (type.includes("home")) return 0.45;
    if (type === "lap" || type.includes("lap")) return 0.6;
    if (type.includes("used") && type.includes("car")) return 1.5;
    if (type.includes("new") && type.includes("car")) return 0.5;

    return 0;
  }

  function getCommissionAmount(file: LoanFile, status = file.status) {
    if (status !== "Disbursed") return 0;
    return Number(file.loan_amount || 0) * (getCommissionRate(file) / 100);
  }

  async function updateFileStatus(fileId: string, status: string) {
    if (!fileId) {
      alert("Loan file ID missing");
      return;
    }

    // Commission is earned only when the file becomes Disbursed.
    // Calculate it from the loan amount and stored commission rate.
    const currentFile = files.find((file) => file.id === fileId);

    if (!currentFile) {
      alert("Loan file not found");
      return;
    }

    const commissionAmount = getCommissionAmount(currentFile, status);
    const commissionRate = getCommissionRate(currentFile);

    const statusMessages: Record<string, string> = {
      Submitted: "Loan file submitted successfully.",
      Processing: "Loan file is currently under processing.",
      Approved: "Loan file has been approved by LoanKarts.",
      Disbursed: "Loan amount has been disbursed successfully.",
      Rejected: "Loan file has been rejected. Please contact LoanKarts for details.",
    };

    const { error } = await supabase
      .from("loan_files")
      .update({
        status,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        update_text: statusMessages[status] || `Loan file status updated to ${status}.`,
      })
      .eq("id", fileId);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    const { data: updatedFile, error: fetchError } = await supabase
      .from("loan_files")
      .select(
        `
        id,
        broker_id,
        broker_name,
        customer_name,
        loan_type,
        status,
        loan_amount,
        commission_rate,
        commission_amount,
        document_paths
        `
      )
      .eq("id", fileId)
      .single();

    if (fetchError) {
      console.error(fetchError);

      setFiles((current) =>
        current.map((file) =>
          file.id === fileId
            ? {
                ...file,
                status,
                commission_amount: commissionAmount,
              }
            : file
        )
      );

      setSelectedBroker((current) =>
        current
          ? {
              ...current,
              fileList: current.fileList.map((file) =>
                file.id === fileId
                  ? {
                      ...file,
                      status,
                      commission_amount: commissionAmount,
                    }
                  : file
              ),
              totalCommission: current.fileList
                .map((file) =>
                  file.id === fileId
                    ? {
                        ...file,
                        status,
                        commission_amount: commissionAmount,
                      }
                    : file
                )
                .filter((file) => file.status === "Disbursed")
                .reduce(
                  (sum, file) => sum + Number(file.commission_amount || 0),
                  0
                ),
            }
          : null
      );

      setDetailsBroker((current) =>
        current
          ? {
              ...current,
              fileList: current.fileList.map((file) =>
                file.id === fileId
                  ? {
                      ...file,
                      status,
                      commission_amount: commissionAmount,
                    }
                  : file
              ),
              totalCommission: current.fileList
                .map((file) =>
                  file.id === fileId
                    ? {
                        ...file,
                        status,
                        commission_amount: commissionAmount,
                      }
                    : file
                )
                .filter((file) => file.status === "Disbursed")
                .reduce(
                  (sum, file) => sum + Number(file.commission_amount || 0),
                  0
                ),
            }
          : null
      );

      return;
    }

    const freshFile = updatedFile as LoanFile;

    setFiles((current) =>
      current.map((file) => (file.id === fileId ? freshFile : file))
    );

    setSelectedBroker((current) =>
      current
        ? {
            ...current,
            fileList: current.fileList.map((file) =>
              file.id === fileId ? freshFile : file
            ),
            totalCommission: current.fileList
              .map((file) => (file.id === fileId ? freshFile : file))
              .filter((file) => file.status === "Disbursed")
              .reduce(
                (sum, file) => sum + Number(file.commission_amount || 0),
                0
              ),
          }
        : null
    );

    setDetailsBroker((current) =>
      current
        ? {
            ...current,
            fileList: current.fileList.map((file) =>
              file.id === fileId ? freshFile : file
            ),
            totalCommission: current.fileList
              .map((file) => (file.id === fileId ? freshFile : file))
              .filter((file) => file.status === "Disbursed")
              .reduce(
                (sum, file) => sum + Number(file.commission_amount || 0),
                0
              ),
          }
        : null
    );

    await loadBrokers();
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f4f8fb]">
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
                Admin Portal
              </p>
              <p className="mt-0.5 truncate text-sm font-bold text-white">
                Connector Management
              </p>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex shrink-0 items-center gap-2">
            <a
              href="/admin"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-xs font-black text-white transition hover:border-[#10b7d3]/50 hover:bg-[#10b7d3]/10 sm:px-4 sm:text-sm"
            >
              <span>←</span>
              <span>Dashboard</span>
            </a>

            <button
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = "/admin/login";
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 text-xs font-black text-[#073b4c] shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-100 sm:px-4 sm:text-sm"
            >
              <span>Logout</span>
              <span>↗</span>
            </button>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <section className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10">
        <div className="mb-5">
          <p className="font-bold uppercase tracking-wide text-[#10b7d3]">
            LoanKarts Management
          </p>

          <h2 className="mt-1.5 text-3xl font-black tracking-tight text-[#073b4c] sm:text-4xl">
            Connector Management
          </h2>

          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            View connector activity, loan file performance and commissions.
          </p>
        </div>

        {/* SEARCH */}
        <div className="rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)] ring-1 ring-slate-200 sm:p-5">
          <label className="mb-2 block text-sm font-bold text-slate-700">
            Search Connector
          </label>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search connector name, email or connector ID..."
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#10b7d3] focus:ring-2 focus:ring-cyan-100"
          />
        </div>

        {/* ERROR */}
        {error && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            <p className="font-bold">Unable to load connectors</p>

            <p className="mt-1 text-sm">{error}</p>
          </div>
        )}

        {/* BROKERS */}
        <div className="mt-5 overflow-hidden rounded-2xl bg-white shadow-[0_12px_32px_rgba(15,23,42,0.06)] ring-1 ring-slate-200">
          <div className="border-b border-slate-200 px-4 py-4 sm:px-6">
            <h3 className="text-xl font-black text-[#073b4c]">
              Connector Partners
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Connectors are shown from submitted loan files.
            </p>
          </div>

          {loading ? (
            <div className="px-6 py-14 text-center text-slate-500">
              Loading connectors...
            </div>
          ) : filteredBrokers.length === 0 ? (
            <div className="px-6 py-14 text-center text-slate-500">
              No connectors found.
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}
              <div className="hidden md:block">
                <table className="w-full table-fixed">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="w-[22%] px-4 py-4">Connector</th>
                      <th className="w-[8%] px-2 py-4">Files</th>
                      <th className="w-[9%] px-2 py-4">Processing</th>
                      <th className="w-[9%] px-2 py-4">Approved</th>
                      <th className="w-[9%] px-2 py-4">Disbursed</th>
                      <th className="w-[9%] px-2 py-4">Rejected</th>
                      <th className="w-[12%] px-2 py-4">Loan Amount</th>
                      <th className="w-[11%] px-2 py-4">Commission</th>
                      <th className="w-[11%] px-3 py-4">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredBrokers.map((broker) => (
                      <tr
                        key={broker.id}
                        className="border-t border-slate-100 transition hover:bg-slate-50/80"
                      >
                        <td className="px-4 py-4">
                          <p className="break-words font-black text-[#073b4c]">
                            {broker.name}
                          </p>

                          <p className="mt-1 break-all text-[11px] text-slate-400">
                            {broker.id === "unknown"
                              ? "Connector ID unavailable"
                              : broker.id}
                          </p>
                        </td>

                        <td className="px-2 py-4">
                          <span className="inline-flex min-w-8 items-center justify-center rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-black text-slate-700 ring-1 ring-slate-200">
                            {broker.total}
                          </span>
                        </td>

                        <td className="px-2 py-4">
                          <span className="inline-flex min-w-8 items-center justify-center rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-black text-amber-700 ring-1 ring-amber-100">
                            {broker.processing}
                          </span>
                        </td>

                        <td className="px-2 py-4">
                          <span className="inline-flex min-w-8 items-center justify-center rounded-lg bg-sky-50 px-2.5 py-1.5 text-xs font-black text-sky-700 ring-1 ring-sky-100">
                            {broker.approved}
                          </span>
                        </td>

                        <td className="px-2 py-4">
                          <span className="inline-flex min-w-8 items-center justify-center rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">
                            {broker.disbursed}
                          </span>
                        </td>

                        <td className="px-2 py-4">
                          <span className="inline-flex min-w-8 items-center justify-center rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-black text-rose-700 ring-1 ring-rose-100">
                            {broker.rejected}
                          </span>
                        </td>

                        <td className="px-2 py-5 font-black text-[#073b4c]">
                          {money(broker.amount)}
                        </td>

                        <td className="px-2 py-4">
                          <p className="font-black text-green-600">
                            {money(broker.totalCommission)}
                          </p>

                          <p className="mt-1 text-[10px] text-slate-400">
                            Disbursed only
                          </p>
                        </td>

                        <td className="px-3 py-4">
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => setSelectedBroker(broker)}
                              className="w-full whitespace-nowrap rounded-xl bg-[#10b7d3] px-3 py-2 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#0da8c1] hover:shadow-md"
                            >
                              View Files
                            </button>

                            <button
                              onClick={() => setDetailsBroker(broker)}
                              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-xs font-black text-[#073b4c] transition hover:border-[#10b7d3] hover:bg-[#e8f9fc] hover:text-[#073b4c]"
                            >
                              Connector Details
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARDS */}
              <div className="space-y-3 p-3 md:hidden">
                {filteredBrokers.map((broker) => (
                  <div
                    key={broker.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.05)]"
                  >
                    <div className="mb-4">
                      <p className="font-black text-[#073b4c]">
                        {broker.name}
                      </p>

                      <p className="mt-1 break-all text-xs text-slate-400">
                        {broker.id}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">Total Files</p>
                        <p className="mt-1 text-xl font-black text-[#073b4c]">
                          {broker.total}
                        </p>
                      </div>

                      <div className="rounded-xl bg-amber-50 p-3">
                        <p className="text-xs text-slate-500">Processing</p>
                        <p className="mt-1 text-xl font-black text-amber-600">
                          {broker.processing}
                        </p>
                      </div>

                      <div className="rounded-xl bg-blue-50 p-3">
                        <p className="text-xs text-slate-500">Approved</p>
                        <p className="mt-1 text-xl font-black text-blue-600">
                          {broker.approved}
                        </p>
                      </div>

                      <div className="rounded-xl bg-green-50 p-3">
                        <p className="text-xs text-slate-500">Disbursed</p>
                        <p className="mt-1 text-xl font-black text-green-600">
                          {broker.disbursed}
                        </p>
                      </div>

                      <div className="rounded-xl bg-red-50 p-3">
                        <p className="text-xs text-slate-500">Rejected</p>
                        <p className="mt-1 text-xl font-black text-red-600">
                          {broker.rejected}
                        </p>
                      </div>

                      <div className="rounded-xl bg-cyan-50 p-3">
                        <p className="text-xs text-slate-500">Loan Amount</p>
                        <p className="mt-1 text-lg font-black text-[#073b4c]">
                          {money(broker.amount)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 rounded-xl bg-green-50 p-3">
                      <p className="text-xs text-green-700">
                        Total Commission
                      </p>

                      <p className="mt-1 text-xl font-black text-green-700">
                        {money(broker.totalCommission)}
                      </p>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setSelectedBroker(broker)}
                        className="rounded-xl bg-[#10b7d3] px-3 py-3 text-sm font-bold text-white"
                      >
                        View Files
                      </button>

                      <button
                        onClick={() => setDetailsBroker(broker)}
                        className="rounded-xl border border-[#10b7d3] px-3 py-3 text-sm font-bold text-[#073b4c]"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ========================= */}
      {/* VIEW FILES MODAL */}
      {/* ========================= */}
      {selectedBroker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-5">
          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-white/20">
            {/* MODAL HEADER */}
            <div className="flex shrink-0 items-center justify-between bg-[#073b4c] px-5 py-4 text-white sm:px-6 sm:py-5">
              <div className="min-w-0">
                <h3 className="truncate text-lg font-black sm:text-xl">
                  {selectedBroker.name}
                </h3>

                <p className="text-xs text-slate-300 sm:text-sm">
                  Loan Files & Commission
                </p>
              </div>

              <button
                onClick={() => setSelectedBroker(null)}
                className="ml-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/30 text-lg font-bold hover:bg-white hover:text-[#073b4c]"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
              {selectedBroker.fileList.length === 0 ? (
                <p className="py-10 text-center text-slate-500">
                  No loan files found.
                </p>
              ) : (
                <div className="space-y-4">
                  {selectedBroker.fileList.map((file) => (
                    <div
                      key={file.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
                    >
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                        <div className="min-w-0 flex-1">
                          <p className="break-words font-black text-[#073b4c]">
                            {file.customer_name}
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            Loan Type:{" "}
                            <span className="font-bold text-[#073b4c]">
                              {file.loan_type || "N/A"}
                            </span>
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            Loan Amount:{" "}
                            <span className="font-bold">
                              {money(file.loan_amount)}
                            </span>
                          </p>

                          {/* COMMISSION */}
                          {file.status === "Disbursed" ? (
                            <div className="mt-3 rounded-xl bg-green-50 p-4">
                              <p className="text-xs font-bold uppercase tracking-wide text-green-700">
                                Connector Commission
                              </p>

                              <div className="mt-2 flex flex-wrap items-center gap-6">
                                <div>
                                  <p className="text-xs text-slate-500">
                                    Rate
                                  </p>

                                  <p className="font-black text-green-700">
                                    {percentage(getCommissionRate(file))}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-xs text-slate-500">
                                    Commission
                                  </p>

                                  <p className="text-lg font-black text-green-700">
                                    {money(getCommissionAmount(file))}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-3 rounded-xl bg-slate-50 p-3">
                              <p className="text-xs font-bold text-slate-500">
                                Commission will be calculated when this file is
                                Disbursed.
                              </p>
                            </div>
                          )}

                          {/* DOCUMENTS */}
                          {file.document_paths &&
                            Object.entries(file.document_paths).length > 0 && (
                              <div className="mt-4 border-t border-slate-200 pt-4">
                                <p className="mb-2 text-sm font-black text-[#073b4c]">
                                  Documents
                                </p>

                                <div className="flex flex-wrap gap-2">
                                  {Object.entries(file.document_paths).map(
                                    ([name, path]) =>
                                      path && (
                                        <button
                                          key={name}
                                          onClick={() => openDocument(path)}
                                          className="rounded-xl bg-[#10b7d3] px-3 py-2 text-xs font-bold text-white hover:bg-[#0da8c1]"
                                        >
                                          View {name}
                                        </button>
                                      )
                                  )}
                                </div>
                              </div>
                            )}

                          {/* UPDATE STATUS */}
                          <div className="mt-4 border-t border-slate-200 pt-4">
                            <p className="mb-2 text-sm font-black text-[#073b4c]">
                              Update Status
                            </p>

                            <select
                              value={file.status}
                              onChange={(e) =>
                                updateFileStatus(file.id, e.target.value)
                              }
                              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold outline-none focus:border-[#10b7d3]"
                            >
                              <option value="Processing">Processing</option>
                              <option value="Approved">Approved</option>
                              <option value="Disbursed">Disbursed</option>
                              <option value="Rejected">Rejected</option>
                            </select>
                          </div>
                        </div>

                        {(() => {
                          const meta = statusMeta(file.status);

                          return (
                            <span
                              className={`inline-flex w-fit shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-[11px] font-black ${meta.badge}`}
                            >
                              <span className="relative flex h-2 w-2 shrink-0">
                                {meta.animate && (
                                  <span
                                    className={`absolute inline-flex h-full w-full animate-ping rounded-full ${meta.dot} opacity-60`}
                                  />
                                )}
                                <span
                                  className={`relative inline-flex h-2 w-2 rounded-full ${meta.dot}`}
                                />
                              </span>
                              {meta.label}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* MODAL FOOTER */}
            <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 text-right sm:px-6 sm:py-4">
              <button
                onClick={() => setSelectedBroker(null)}
                className="rounded-xl bg-[#073b4c] px-5 py-2.5 font-bold text-white hover:bg-[#052f3d]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================= */}
      {/* BROKER DETAILS MODAL */}
      {/* ========================= */}
      {detailsBroker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-5">
          <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-white/20">
            {/* HEADER */}
            <div className="flex shrink-0 items-center justify-between bg-[#073b4c] px-5 py-4 text-white sm:px-6 sm:py-5">
              <div className="min-w-0">
                <h3 className="truncate text-lg font-black sm:text-xl">
                  {detailsBroker.name}
                </h3>

                <p className="text-xs text-slate-300 sm:text-sm">
                  Connector Details
                </p>
              </div>

              <button
                onClick={() => setDetailsBroker(null)}
                className="ml-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/30 text-lg font-bold hover:bg-white hover:text-[#073b4c]"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* BODY */}
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                <div className="rounded-2xl bg-slate-50 p-4 sm:p-5">
                  <p className="text-sm text-slate-500">Total Files</p>

                  <p className="mt-2 text-2xl font-black text-[#073b4c]">
                    {detailsBroker.total}
                  </p>
                </div>

                <div className="rounded-2xl bg-amber-50 p-4 sm:p-5">
                  <p className="text-sm text-slate-500">Processing</p>

                  <p className="mt-2 text-2xl font-black text-amber-600">
                    {detailsBroker.processing}
                  </p>
                </div>

                <div className="rounded-2xl bg-blue-50 p-4 sm:p-5">
                  <p className="text-sm text-slate-500">Approved</p>

                  <p className="mt-2 text-2xl font-black text-blue-600">
                    {detailsBroker.approved}
                  </p>
                </div>

                <div className="rounded-2xl bg-green-50 p-4 sm:p-5">
                  <p className="text-sm text-slate-500">Disbursed</p>

                  <p className="mt-2 text-2xl font-black text-green-600">
                    {detailsBroker.disbursed}
                  </p>
                </div>

                <div className="rounded-2xl bg-red-50 p-4 sm:p-5">
                  <p className="text-sm text-slate-500">Rejected</p>

                  <p className="mt-2 text-2xl font-black text-red-600">
                    {detailsBroker.rejected}
                  </p>
                </div>

                <div className="rounded-2xl bg-cyan-50 p-4 sm:p-5">
                  <p className="text-sm text-slate-500">
                    Total Loan Amount
                  </p>

                  <p className="mt-2 break-words text-2xl font-black text-[#073b4c]">
                    {money(detailsBroker.amount)}
                  </p>
                </div>

                {/* TOTAL COMMISSION */}
                <div className="rounded-2xl bg-green-50 p-4 sm:col-span-2 sm:p-5">
                  <p className="text-sm font-bold text-green-700">
                    TOTAL CONNECTOR COMMISSION
                  </p>

                  <p className="mt-2 break-words text-3xl font-black text-green-700">
                    {money(detailsBroker.totalCommission)}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Calculated only on Disbursed loan files
                  </p>
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 text-right sm:px-6 sm:py-4">
              <button
                onClick={() => setDetailsBroker(null)}
                className="rounded-xl bg-[#073b4c] px-5 py-2.5 font-bold text-white hover:bg-[#052f3d]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}