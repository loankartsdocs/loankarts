"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type LoanFile = {
  id: string;
  file_code: string | null;
  customer_name: string;
  loan_type: string;
  loan_amount: number;
  status: string;
  commission_amount: number | null;
  commission_rate: number | null;
  created_at: string;
  disbursed_at: string | null;
};

type WithdrawalRequest = {
  id: string;
  amount: number;
  status: "Pending" | "Approved" | "Rejected" | "Paid";
  requested_at: string;
  processed_at: string | null;
  admin_note: string | null;
};

type PayoutItem = {
  id: string;
  withdrawal_request_id: string;
  loan_file_id: string;
  commission_amount: number;
  created_at: string;
  file_code: string | null;
  customer_name: string;
  status: string;
  request_status: string;
};

function money(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function addOneMonth(value: string) {
  const date = new Date(value);
  const originalDay = date.getDate();
  date.setMonth(date.getMonth() + 1);

  // JS rolls dates such as 31 Jan into March. Clamp to the last day
  // of the target month so the UI matches the database's one-month rule.
  if (date.getDate() !== originalDay) {
    date.setDate(0);
  }

  return date;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusBadge(status: string) {
  switch (status) {
    case "Paid":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Approved":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "Rejected":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "Pending":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

export default function BrokerWalletPage() {
  const [files, setFiles] = useState<LoanFile[]>([]);
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [payoutItems, setPayoutItems] = useState<PayoutItem[]>([]);
  const [connectorCode, setConnectorCode] = useState("");
  const [brokerName, setBrokerName] = useState("Connector Partner");
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function loadWallet() {
    setLoading(true);
    setErrorMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw new Error(userError.message);

      if (!user) {
        window.location.href = "/broker/login";
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("connector_profiles")
        .select("connector_code, full_name")
        .eq("id", user.id)
        .maybeSingle();

      if (!profileError && profile) {
        setConnectorCode(String(profile.connector_code || ""));
        setBrokerName(String(profile.full_name || "Connector Partner"));
      }

      const { data: loanData, error: loanError } = await supabase
        .from("loan_files")
        .select(
          "id, file_code, customer_name, loan_type, loan_amount, status, commission_amount, commission_rate, created_at, disbursed_at"
        )
        .eq("broker_id", user.id)
        .eq("status", "Disbursed")
        .order("disbursed_at", { ascending: false });

      if (loanError) throw new Error(loanError.message);

      const { data: requestData, error: requestError } = await supabase
        .from("withdrawal_requests")
        .select("id, amount, status, requested_at, processed_at, admin_note")
        .eq("broker_id", user.id)
        .order("requested_at", { ascending: false });

      if (requestError) throw new Error(requestError.message);

      const requestIds = (requestData || []).map((item) => item.id);
      let itemData: PayoutItem[] = [];

      if (requestIds.length > 0) {
        const { data, error } = await supabase
          .from("payout_items")
          .select(
            "id, withdrawal_request_id, loan_file_id, commission_amount, created_at, withdrawal_request:withdrawal_requests(status), loan_file:loan_files(file_code, customer_name, status)"
          )
          .in("withdrawal_request_id", requestIds)
          .order("created_at", { ascending: false });

        if (error) throw new Error(error.message);

        itemData = (data || []).map((item: any) => ({
          id: item.id,
          withdrawal_request_id: item.withdrawal_request_id,
          loan_file_id: item.loan_file_id,
          commission_amount: Number(item.commission_amount || 0),
          created_at: item.created_at,
          file_code: item.loan_file?.file_code || null,
          customer_name: item.loan_file?.customer_name || "Loan File",
          status: item.loan_file?.status || "Disbursed",
          request_status: item.withdrawal_request?.status || "Pending",
        }));
      }

      setFiles((loanData || []) as LoanFile[]);
      setRequests((requestData || []) as WithdrawalRequest[]);
      setPayoutItems(itemData);
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load wallet."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWallet();

    const channel = supabase
      .channel("broker-wallet-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "loan_files" },
        () => loadWallet()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "withdrawal_requests" },
        () => loadWallet()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const summary = useMemo(() => {
    const total = files.reduce(
      (sum, file) => sum + Number(file.commission_amount || 0),
      0
    );

    const now = new Date();

    const withdrawnFileIds = new Set(
      payoutItems
        .filter((item) => item.request_status !== "Rejected")
        .map((item) => item.loan_file_id)
    );

    const eligibleFiles = files.filter((file) => {
      if (withdrawnFileIds.has(file.id)) return false;
      if (!file.disbursed_at) return false;
      return addOneMonth(file.disbursed_at) <= now;
    });

    const lockedFiles = files.filter((file) => {
      if (withdrawnFileIds.has(file.id)) return false;
      if (!file.disbursed_at) return true;
      return addOneMonth(file.disbursed_at) > now;
    });

    const available = eligibleFiles.reduce(
      (sum, file) => sum + Number(file.commission_amount || 0),
      0
    );

    const locked = lockedFiles.reduce(
      (sum, file) => sum + Number(file.commission_amount || 0),
      0
    );

    const withdrawn = payoutItems
      .filter((item) => item.request_status === "Paid")
      .reduce(
        (sum, item) => sum + Number(item.commission_amount || 0),
        0
      );

    return {
      total,
      available,
      locked,
      withdrawn,
      eligibleFiles,
      lockedFiles,
    };
  }, [files, payoutItems]);

  const pendingAmount = requests
    .filter((request) => request.status === "Pending" || request.status === "Approved")
    .reduce((sum, request) => sum + Number(request.amount || 0), 0);

  async function handleWithdraw() {
    if (summary.available <= 0) return;

    setWithdrawing(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const { data, error } = await supabase.rpc(
        "request_connector_withdrawal"
      );

      if (error) throw new Error(error.message);

      setSuccessMessage(
        `Withdrawal request submitted for ${money(Number(data?.amount || summary.available))}.`
      );

      await loadWallet();
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to submit withdrawal request."
      );
    } finally {
      setWithdrawing(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f4f8fb]">
        <header className="bg-[#050b20] shadow-lg">
          <div className="mx-auto flex max-w-[1280px] items-center px-5 py-4 sm:px-8">
            <img
              src="/logo-white.png"
              alt="LoanKarts"
              className="h-[42px] w-[150px] object-contain"
            />
          </div>
        </header>
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-slate-200 border-t-[#08b8d4]" />
            <p className="mt-4 text-sm font-bold text-slate-500">
              Loading your wallet...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f3f7fa]">
      <header className="sticky top-0 z-50 bg-[#050b20] text-white shadow-xl">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-5 py-3.5 sm:px-8 lg:px-10">
          <a href="/broker" className="flex items-center gap-4">
            <img
              src="/logo-white.png"
              alt="LoanKarts"
              className="h-[40px] w-[145px] object-contain"
            />
            <div className="hidden border-l border-white/15 pl-4 sm:block">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#08b8d4]">
                Partner Portal
              </p>
              <p className="mt-0.5 text-[11px] text-white/45">
                LoanKarts Connector Wallet
              </p>
            </div>
          </a>

          <div className="flex items-center gap-3">
            {connectorCode && (
              <div className="hidden rounded-xl border border-[#08b8d4]/35 bg-[#08b8d4]/10 px-4 py-2 sm:block">
                <span className="mr-2 text-[8px] font-black uppercase tracking-widest text-white/40">
                  CONNECTOR ID
                </span>
                <span className="text-xs font-black text-[#08b8d4]">
                  {connectorCode}
                </span>
              </div>
            )}
            <button
              onClick={logout}
              className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-xs font-black transition hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-200"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto w-full max-w-[1280px] px-5 py-7 sm:px-8 lg:px-10 lg:py-9">
        <a
          href="/broker"
          className="inline-flex items-center gap-2 text-xs font-black text-slate-500 hover:text-[#08aeca]"
        >
          ← Back to Dashboard
        </a>

        <div className="mt-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.24em] text-[#08b8d4]">
              PARTNER WALLET
            </p>
            <h1 className="mt-1.5 text-3xl font-black tracking-tight text-[#062536] sm:text-[36px]">
              My Wallet
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Track your commission earnings, locked payouts and withdrawal history.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
              PARTNER
            </p>
            <p className="mt-1 text-sm font-black text-[#062536]">
              {brokerName}
            </p>
          </div>
        </div>

        {successMessage && (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">
            ✓ {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700">
            ! {errorMessage}
          </div>
        )}

        {/* SUMMARY */}
        <div className="mt-6 grid gap-5 lg:grid-cols-[1.35fr_0.85fr_0.85fr]">
          <div className="relative overflow-hidden rounded-[28px] bg-[#062536] p-7 text-white shadow-[0_18px_45px_rgba(6,37,54,0.16)] sm:p-8">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#08b8d4]/10" />
            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#08b8d4]">
                    TOTAL EARNINGS
                  </p>
                  <p className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
                    {money(summary.total)}
                  </p>
                  <p className="mt-2 text-xs text-white/45">
                    Commission earned from all disbursed files.
                  </p>
                </div>
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-2xl font-black text-[#08b8d4]">
                  ₹
                </div>
              </div>

              <div className="mt-7 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/35">
                    AVAILABLE
                  </p>
                  <p className="mt-2 text-xl font-black text-white">
                    {money(summary.available)}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/35">
                    WITHDRAWN
                  </p>
                  <p className="mt-2 text-xl font-black text-white">
                    {money(summary.withdrawn)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-amber-100 bg-white p-7 shadow-[0_10px_35px_rgba(6,37,54,0.06)]">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-xl">
              🔒
            </div>
            <p className="mt-5 text-[10px] font-black uppercase tracking-[0.18em] text-amber-700">
              LOCKED EARNINGS
            </p>
            <p className="mt-2 text-3xl font-black tracking-tight text-[#062536]">
              {money(summary.locked)}
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Locked until one full month has passed from the file's disbursement date.
            </p>
          </div>

          <div className="rounded-[28px] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-7 shadow-[0_10px_35px_rgba(6,37,54,0.06)]">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">
              ✓
            </div>
            <p className="mt-5 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
              AVAILABLE TO WITHDRAW
            </p>
            <p className="mt-2 text-3xl font-black tracking-tight text-emerald-700">
              {money(summary.available)}
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Only eligible disbursed commissions can be requested.
            </p>
          </div>
        </div>

        {/* WITHDRAWAL ACTION */}
        <div className="mt-6 overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_10px_35px_rgba(6,37,54,0.06)]">
          <div className="flex flex-col justify-between gap-5 p-6 sm:flex-row sm:items-center sm:p-7">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#062536] text-xl text-[#08b8d4]">
                ↗
              </div>
              <div>
                <h2 className="text-lg font-black text-[#062536]">
                  Withdraw Available Commission
                </h2>
                <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
                  Withdrawal requests include only commissions that have completed the one-month holding period. Locked earnings are never included.
                </p>
                {pendingAmount > 0 && (
                  <p className="mt-2 text-[10px] font-bold text-amber-600">
                    {money(pendingAmount)} is currently under withdrawal processing.
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleWithdraw}
              disabled={withdrawing || summary.available <= 0}
              className="inline-flex min-w-[220px] items-center justify-center gap-2.5 rounded-xl bg-[#08b8d4] px-6 py-3.5 text-xs font-black text-white shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5 hover:bg-[#079eb7] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
            >
              {withdrawing ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  SUBMITTING...
                </>
              ) : summary.available > 0 ? (
                <>WITHDRAW {money(summary.available)} →</>
              ) : (
                <>NO AMOUNT AVAILABLE</>
              )}
            </button>
          </div>
        </div>

        {/* ELIGIBILITY */}
        <div className="mt-6 rounded-[26px] border border-slate-200 bg-white shadow-[0_10px_35px_rgba(6,37,54,0.06)]">
          <div className="border-b border-slate-100 px-6 py-5 sm:px-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-[#062536]">
                  Commission Schedule
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Each disbursed file becomes withdrawable one month after its disbursement date.
                </p>
              </div>
              <span className="hidden rounded-full bg-cyan-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-cyan-700 sm:inline-flex">
                LIVE
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-slate-50">
                <tr className="text-left text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                  <th className="px-6 py-4">File</th>
                  <th className="px-5 py-4">Customer</th>
                  <th className="px-5 py-4">Disbursed</th>
                  <th className="px-5 py-4">Unlock Date</th>
                  <th className="px-5 py-4">Commission</th>
                  <th className="px-5 py-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file) => {
                  const alreadyRequested = payoutItems.some(
                    (item) => item.loan_file_id === file.id
                  );
                  const unlock = file.disbursed_at
                    ? addOneMonth(file.disbursed_at)
                    : null;
                  const available =
                    !alreadyRequested && unlock && unlock <= new Date();

                  return (
                    <tr key={file.id} className="border-t border-slate-100 hover:bg-slate-50/70">
                      <td className="px-6 py-4">
                        <p className="text-xs font-black text-[#062536]">
                          {file.file_code || file.id}
                        </p>
                        <p className="mt-1 text-[10px] text-slate-400">
                          {file.loan_type}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-xs font-bold text-slate-700">
                          {file.customer_name}
                        </p>
                        <p className="mt-1 text-[10px] text-slate-400">
                          Loan {money(file.loan_amount)}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-xs font-semibold text-slate-600">
                        {formatDate(file.disbursed_at)}
                      </td>
                      <td className="px-5 py-4 text-xs font-semibold text-slate-600">
                        {unlock ? formatDate(unlock.toISOString()) : "Pending date"}
                      </td>
                      <td className="px-5 py-4 text-xs font-black text-emerald-700">
                        {money(Number(file.commission_amount || 0))}
                      </td>
                      <td className="px-5 py-4">
                        {alreadyRequested ? (
                          <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-[10px] font-black text-sky-700">
                            Withdrawal Requested
                          </span>
                        ) : available ? (
                          <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-black text-emerald-700">
                            Available
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[10px] font-black text-amber-700">
                            Locked
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {files.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-14 text-center">
                      <div className="text-3xl">₹</div>
                      <p className="mt-3 text-sm font-black text-slate-700">
                        No disbursed commissions yet
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Your commission will appear here when a loan file is disbursed.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* WITHDRAWAL HISTORY */}
        <div className="mt-6 rounded-[26px] border border-slate-200 bg-white shadow-[0_10px_35px_rgba(6,37,54,0.06)]">
          <div className="border-b border-slate-100 px-6 py-5 sm:px-7">
            <h2 className="text-lg font-black text-[#062536]">
              Withdrawal History
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Every payout request and its current processing status.
            </p>
          </div>

          <div className="p-5 sm:p-7">
            {requests.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-12 text-center">
                <div className="text-3xl">↗</div>
                <p className="mt-3 text-sm font-black text-slate-700">
                  No withdrawals yet
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Your withdrawal transactions will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
                  >
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-black text-[#062536]">
                            {money(request.amount)}
                          </p>
                          <span
                            className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${statusBadge(
                              request.status
                            )}`}
                          >
                            {request.status}
                          </span>
                        </div>
                        <p className="mt-1 text-[10px] text-slate-400">
                          Request ID: {request.id}
                        </p>
                        <p className="mt-1 text-[10px] text-slate-400">
                          Requested: {formatDateTime(request.requested_at)}
                        </p>
                      </div>

                      {request.processed_at && (
                        <div className="text-left sm:text-right">
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                            PROCESSED
                          </p>
                          <p className="mt-1 text-xs font-bold text-slate-600">
                            {formatDateTime(request.processed_at)}
                          </p>
                        </div>
                      )}
                    </div>

                    {request.admin_note && (
                      <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-600">
                        <span className="font-black text-[#062536]">Admin note:</span>{" "}
                        {request.admin_note}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* TRANSACTIONS */}
        <div className="mt-6 rounded-[26px] border border-slate-200 bg-white shadow-[0_10px_35px_rgba(6,37,54,0.06)]">
          <div className="border-b border-slate-100 px-6 py-5 sm:px-7">
            <h2 className="text-lg font-black text-[#062536]">
              Commission Transactions
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              File-wise commission entries included in your payout requests.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-slate-50">
                <tr className="text-left text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                  <th className="px-6 py-4">Date</th>
                  <th className="px-5 py-4">File</th>
                  <th className="px-5 py-4">Customer</th>
                  <th className="px-5 py-4">Type</th>
                  <th className="px-5 py-4">Amount</th>
                </tr>
              </thead>
              <tbody>
                {payoutItems.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {formatDateTime(item.created_at)}
                    </td>
                    <td className="px-5 py-4 text-xs font-black text-[#062536]">
                      {item.file_code || item.loan_file_id}
                    </td>
                    <td className="px-5 py-4 text-xs font-semibold text-slate-700">
                      {item.customer_name}
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[9px] font-black text-emerald-700">
                        COMMISSION
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs font-black text-emerald-700">
                      {money(item.commission_amount)}
                    </td>
                  </tr>
                ))}

                {payoutItems.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-xs text-slate-400">
                      No payout transactions yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 flex flex-col justify-between gap-2 px-1 pb-8 text-[10px] text-slate-400 sm:flex-row">
          <p>LoanKarts Connector Partner Portal</p>
          <p>Secure commission &amp; payout tracking</p>
        </div>
      </section>
    </main>
  );
}
