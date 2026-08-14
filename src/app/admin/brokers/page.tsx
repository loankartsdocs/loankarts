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
          name: file.broker_name || "Unknown Broker",
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
      {/* HEADER */}
      <header className="bg-[#073b4c] text-white shadow">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-center">
            <img
              src="/loankarts-logo-white.png"
              alt="LoanKarts"
              className="h-14 w-auto max-w-[240px] object-contain"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={loadBrokers}
              className="rounded-xl border border-[#10b7d3] px-3 py-2 text-xs font-bold hover:bg-[#10b7d3] sm:px-5 sm:py-3 sm:text-sm"
            >
              Refresh
            </button>
            <a
              href="/admin"
              className="rounded-xl border border-white/30 px-3 py-2 text-xs font-bold hover:bg-white hover:text-[#073b4c] sm:px-5 sm:py-3 sm:text-sm"
            >
              ← Dashboard
            </a>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <section className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10">
        <div className="mb-6 sm:mb-8">
          <p className="font-bold uppercase tracking-wide text-[#10b7d3]">
            LoanKarts Management
          </p>

          <h2 className="mt-2 text-3xl font-black text-[#073b4c] sm:text-4xl">
            Broker Management
          </h2>

          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            View broker activity, loan file performance and commissions.
          </p>
        </div>

        {/* SEARCH */}
        <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
          <label className="mb-2 block text-sm font-bold text-slate-700">
            Search Broker
          </label>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search broker name..."
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#10b7d3] focus:ring-2 focus:ring-cyan-100"
          />
        </div>

        {/* ERROR */}
        {error && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            <p className="font-bold">Unable to load brokers</p>

            <p className="mt-1 text-sm">{error}</p>
          </div>
        )}

        {/* BROKERS */}
        <div className="mt-6 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-200 px-4 py-5 sm:px-6">
            <h3 className="text-xl font-black text-[#073b4c]">
              Broker Partners
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Brokers are shown from submitted loan files.
            </p>
          </div>

          {loading ? (
            <div className="px-6 py-14 text-center text-slate-500">
              Loading brokers...
            </div>
          ) : filteredBrokers.length === 0 ? (
            <div className="px-6 py-14 text-center text-slate-500">
              No brokers found.
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}
              <div className="hidden md:block">
                <table className="w-full table-fixed">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="w-[22%] px-4 py-4">Broker</th>
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
                        className="border-t border-slate-100 hover:bg-slate-50"
                      >
                        <td className="px-4 py-5">
                          <p className="break-words font-black text-[#073b4c]">
                            {broker.name}
                          </p>

                          <p className="mt-1 break-all text-[11px] text-slate-400">
                            {broker.id === "unknown"
                              ? "Broker ID unavailable"
                              : broker.id}
                          </p>
                        </td>

                        <td className="px-2 py-5">
                          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">
                            {broker.total}
                          </span>
                        </td>

                        <td className="px-2 py-5">
                          <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-700">
                            {broker.processing}
                          </span>
                        </td>

                        <td className="px-2 py-5">
                          <span className="rounded-full bg-blue-100 px-3 py-1.5 text-xs font-bold text-blue-700">
                            {broker.approved}
                          </span>
                        </td>

                        <td className="px-2 py-5">
                          <span className="rounded-full bg-green-100 px-3 py-1.5 text-xs font-bold text-green-700">
                            {broker.disbursed}
                          </span>
                        </td>

                        <td className="px-2 py-5">
                          <span className="rounded-full bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700">
                            {broker.rejected}
                          </span>
                        </td>

                        <td className="px-2 py-5 font-black text-[#073b4c]">
                          {money(broker.amount)}
                        </td>

                        <td className="px-2 py-5">
                          <p className="font-black text-green-600">
                            {money(broker.totalCommission)}
                          </p>

                          <p className="mt-1 text-[10px] text-slate-400">
                            Disbursed only
                          </p>
                        </td>

                        <td className="px-3 py-5">
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => setSelectedBroker(broker)}
                              className="w-full whitespace-nowrap rounded-xl bg-[#10b7d3] px-3 py-2 text-xs font-bold text-white hover:bg-[#0da8c1]"
                            >
                              View Files
                            </button>

                            <button
                              onClick={() => setDetailsBroker(broker)}
                              className="w-full rounded-xl border border-[#10b7d3] px-2 py-2 text-xs font-bold text-[#073b4c] hover:bg-[#10b7d3] hover:text-white"
                            >
                              Broker Details
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARDS */}
              <div className="space-y-4 p-4 md:hidden">
                {filteredBrokers.map((broker) => (
                  <div
                    key={broker.id}
                    className="rounded-2xl border border-slate-200 p-4 shadow-sm"
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
          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
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
                      className="rounded-2xl border border-slate-200 p-4 sm:p-5"
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
                                Broker Commission
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

                        <span
                          className={`w-fit shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${
                            file.status === "Disbursed"
                              ? "bg-green-100 text-green-700"
                              : file.status === "Approved"
                              ? "bg-blue-100 text-blue-700"
                              : file.status === "Rejected"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {file.status}
                        </span>
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
          <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            {/* HEADER */}
            <div className="flex shrink-0 items-center justify-between bg-[#073b4c] px-5 py-4 text-white sm:px-6 sm:py-5">
              <div className="min-w-0">
                <h3 className="truncate text-lg font-black sm:text-xl">
                  {detailsBroker.name}
                </h3>

                <p className="text-xs text-slate-300 sm:text-sm">
                  Broker Details
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
                    TOTAL BROKER COMMISSION
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