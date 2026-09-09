"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";

type LoanFile = {
  id: string;
  broker_id: string | null;
  broker_name: string;
  connector_code: string | null;
  customer_name: string;
  loan_type: string;
  status: string;
  loan_amount: number;
  commission_rate: number;
  commission_amount: number;
  document_paths: Record<string, string | null> | null;
  update_text: string | null;
  created_at?: string;
  file_code: string | null;
};

type Broker = {
  id: string;
  name: string;
  connectorCode: string;
  total: number;
  processing: number;
  approved: number;
  disbursed: number;
  rejected: number;
  amount: number;
  totalCommission: number;
  fileList: LoanFile[];
};

type ConnectorProfile = {
  id: string;
  connector_code: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  alternate_phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  bank_name: string | null;
  account_holder_name: string | null;
  account_number: string | null;
  ifsc_code: string | null;
  branch_name: string | null;
  account_type: string | null;
};

type WithdrawalRequest = {
  id: string;
  broker_id: string;
  connector_code: string | null;
  amount: number;
  status: string;
  requested_at: string;
  processed_at: string | null;
  admin_note: string | null;
  bank_name: string | null;
  account_holder_name: string | null;
  account_number: string | null;
  ifsc_code: string | null;
};

export default function BrokerManagementPage() {
  const [files, setFiles] = useState<LoanFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const [selectedBroker, setSelectedBroker] = useState<Broker | null>(null);
  const [detailsBroker, setDetailsBroker] = useState<Broker | null>(null);
  const [detailsProfile, setDetailsProfile] = useState<ConnectorProfile | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [pendingWithdrawalCount, setPendingWithdrawalCount] = useState(0);
  const [profiles, setProfiles] = useState<ConnectorProfile[]>([]);
  const loadRequestRef = useRef(0);

  async function getStableAdminUser() {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) console.error("Supabase session error:", error);
      if (session?.user) return session.user;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) return user;

      if (attempt < 7) {
        await new Promise((resolve) =>
          setTimeout(resolve, 250 + attempt * 100)
        );
      }
    }

    return null;
  }

  async function loadPendingWithdrawalCount() {
    const { count, error } = await supabase
      .from("withdrawal_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "Pending");

    if (!error) setPendingWithdrawalCount(count || 0);
  }

  async function loadConnectorDetails(broker: Broker) {
    setDetailsLoading(true);
    setDetailsBroker(broker);

    try {
      let profile: ConnectorProfile | null = null;

      // 1) Profile UUID is the strongest identifier.
      if (broker.id) {
        const { data } = await supabase
          .from("connector_profiles")
          .select("*")
          .eq("id", broker.id)
          .maybeSingle();

        if (data) profile = data as ConnectorProfile;
      }

      // 2) Connector code is stable across the admin and broker pages.
      if (!profile && broker.connectorCode && broker.connectorCode !== "LKC-PENDING") {
        const { data } = await supabase
          .from("connector_profiles")
          .select("*")
          .eq("connector_code", broker.connectorCode)
          .maybeSingle();

        if (data) profile = data as ConnectorProfile;
      }

      // Profile edits are keyed by the connector profile record. If an older
      // loan file has a different broker_id, resolve the same connector by
      // email/name before declaring profile data unavailable.
      if (!profile) {
        const profileEmail = profiles.find((item) =>
          item.email && item.email.trim().toLowerCase() === broker.name.trim().toLowerCase()
        );
        if (profileEmail) profile = profileEmail;
      }

      // 3) Legacy records can still identify a broker by email.
      if (!profile && broker.id.includes("@")) {
        const { data } = await supabase
          .from("connector_profiles")
          .select("*")
          .ilike("email", broker.id)
          .maybeSingle();

        if (data) profile = data as ConnectorProfile;
      }

      setDetailsProfile(profile);

      let withdrawalQuery = supabase
        .from("withdrawal_requests")
        .select("*")
        .order("requested_at", { ascending: false });

      if (profile?.id) {
        withdrawalQuery = withdrawalQuery.eq("broker_id", profile.id);
      } else if (broker.connectorCode && broker.connectorCode !== "LKC-PENDING") {
        withdrawalQuery = withdrawalQuery.eq("connector_code", broker.connectorCode);
      } else {
        setWithdrawals([]);
        return;
      }

      const { data: withdrawalData, error: withdrawalError } =
        await withdrawalQuery;

      if (withdrawalError) {
        console.error("withdrawal_requests error:", withdrawalError);
        setWithdrawals([]);
      } else {
        setWithdrawals((withdrawalData || []) as WithdrawalRequest[]);
      }
    } catch (error) {
      console.error("Unable to load connector details:", error);
      setDetailsProfile(null);
      setWithdrawals([]);
    } finally {
      setDetailsLoading(false);
    }
  }

  async function loadBrokers() {
    const requestId = ++loadRequestRef.current;
    setLoading(true);
    setError("");

    const [filesResult, profilesResult] = await Promise.all([
      supabase
        .from("loan_files")
        .select(
          `
            id,
            broker_id,
            file_code,
            broker_name,
            connector_code,
            customer_name,
            loan_type,
            status,
            loan_amount,
            commission_rate,
            commission_amount,
            document_paths,
            update_text,
            created_at
          `
        )
        .order("created_at", { ascending: false }),
      supabase.from("connector_profiles").select("*"),
    ]);

    if (requestId !== loadRequestRef.current) return;

    if (filesResult.error) {
      console.error(filesResult.error);
      setError(filesResult.error.message);
      setLoading(false);
      return;
    }

    if (profilesResult.error) {
      // File data is still useful, so don't blank the page just because the
      // profile query has a temporary/RLS problem.
      console.error("connector_profiles error:", profilesResult.error);
    }

    setFiles((filesResult.data || []) as LoanFile[]);
    setProfiles((profilesResult.data || []) as ConnectorProfile[]);
    setLoading(false);
  }

  useEffect(() => {
    let mounted = true;
    let redirectTimer: number | null = null;

    const redirectToLogin = () => {
      if (!mounted) return;
      window.location.replace("/admin/login");
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (session?.user) {
        if (redirectTimer !== null) {
          window.clearTimeout(redirectTimer);
          redirectTimer = null;
        }
        void loadBrokers();
        void loadPendingWithdrawalCount();
        if (detailsBroker) void loadConnectorDetails(detailsBroker);
        return;
      }

      if (event === "SIGNED_OUT") redirectToLogin();
    });

    const initialize = async () => {
      const user = await getStableAdminUser();
      if (!mounted) return;

      if (user) {
        if (user.email?.trim().toLowerCase() !== "docs@loankarts.com") {
          await supabase.auth.signOut();
          return;
        }
        void loadBrokers();
        void loadPendingWithdrawalCount();
      } else {
        redirectTimer = window.setTimeout(() => redirectToLogin(), 1200);
      }
    };

    void initialize();

    const loanChannel = supabase
      .channel("admin-broker-loan-files")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "loan_files",
        },
        () => {
          if (mounted) void loadBrokers();
        }
      )
      .subscribe();

    const profileChannel = supabase
      .channel("admin-connector-profiles")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "connector_profiles",
        },
        () => {
          if (!mounted) return;
          void loadBrokers();
          if (detailsBroker) void loadConnectorDetails(detailsBroker);
        }
      )
      .subscribe();

    const withdrawalChannel = supabase
      .channel("admin-withdrawal-notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "withdrawal_requests",
        },
        () => {
          if (!mounted) return;
          void loadPendingWithdrawalCount();
          if (detailsBroker) void loadConnectorDetails(detailsBroker);
        }
      )
      .subscribe();

    const poll = window.setInterval(() => {
      if (!mounted) return;
      void loadPendingWithdrawalCount();
      void loadBrokers();
      if (detailsBroker) void loadConnectorDetails(detailsBroker);
    }, 10000);

    return () => {
      mounted = false;
      if (redirectTimer !== null) window.clearTimeout(redirectTimer);
      window.clearInterval(poll);
      subscription.unsubscribe();
      supabase.removeChannel(loanChannel);
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(withdrawalChannel);
    };
    // Channels intentionally mount once for this page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const brokers = useMemo<Broker[]>(() => {
    const map = new Map<string, Broker>();
    const byConnectorCode = new Map<string, string>();
    const byName = new Map<string, string>();

    // IMPORTANT: connector_profiles is the source of truth for the connector
    // list. This keeps connectors visible even when they have zero loan files,
    // and it makes profile edits immediately visible in admin.
    profiles.forEach((profile) => {
      const id = profile.id;
      const name =
        profile.full_name?.trim() ||
        displayBrokerName(profile.email || "") ||
        "Connector Partner";
      const connectorCode = profile.connector_code || "LKC-PENDING";

      map.set(id, {
        id,
        name,
        connectorCode,
        total: 0,
        processing: 0,
        approved: 0,
        disbursed: 0,
        rejected: 0,
        amount: 0,
        totalCommission: 0,
        fileList: [],
      });

      if (profile.connector_code) {
        byConnectorCode.set(profile.connector_code.toLowerCase(), id);
      }
      if (profile.email) {
        byName.set(profile.email.toLowerCase(), id);
      }
      if (profile.full_name) {
        byName.set(profile.full_name.trim().toLowerCase(), id);
      }
    });

    const createFileBroker = (file: LoanFile, key: string) => {
      const broker: Broker = {
        id: key,
        name: displayBrokerName(file.broker_name),
        connectorCode: file.connector_code || "LKC-PENDING",
        total: 0,
        processing: 0,
        approved: 0,
        disbursed: 0,
        rejected: 0,
        amount: 0,
        totalCommission: 0,
        fileList: [],
      };
      map.set(key, broker);
      if (file.connector_code) {
        byConnectorCode.set(file.connector_code.toLowerCase(), key);
      }
      if (file.broker_name) {
        byName.set(file.broker_name.trim().toLowerCase(), key);
      }
      return broker;
    };

    files.forEach((file) => {
      let key: string | undefined;

      if (file.broker_id && map.has(file.broker_id)) {
        key = file.broker_id;
      }

      if (!key && file.connector_code) {
        key = byConnectorCode.get(file.connector_code.toLowerCase());
      }

      if (!key && file.broker_name) {
        key = byName.get(file.broker_name.trim().toLowerCase());
      }

      if (!key) {
        key = file.broker_id || file.broker_name || file.id;
      }

      const broker = map.get(key) || createFileBroker(file, key);

      // Prefer fresh profile values over legacy values stored on loan_files.
      if (file.connector_code && broker.connectorCode === "LKC-PENDING") {
        broker.connectorCode = file.connector_code;
      }

      broker.fileList.push(file);
      broker.total += 1;
      broker.amount += Number(file.loan_amount || 0);

      if (file.status === "Processing") broker.processing += 1;
      if (file.status === "Approved") broker.approved += 1;
      if (file.status === "Disbursed") {
        broker.disbursed += 1;
        broker.totalCommission += Number(file.commission_amount || 0);
      }
      if (file.status === "Rejected") broker.rejected += 1;
    });

    return Array.from(map.values()).sort((a, b) => {
      const aPending = a.connectorCode === "LKC-PENDING" ? 1 : 0;
      const bPending = b.connectorCode === "LKC-PENDING" ? 1 : 0;
      if (aPending !== bPending) return aPending - bPending;
      return a.name.localeCompare(b.name);
    });
  }, [files, profiles]);

  const filteredBrokers = brokers.filter((broker) => {
    const query = search.toLowerCase().trim();

    if (!query) return true;

    return (
      broker.name.toLowerCase().includes(query) ||
      broker.connectorCode.toLowerCase().includes(query)
    );
  });

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
async function updateWithdrawalStatus(
  withdrawalId: string,
  status: "Pending" | "Approved" | "Rejected" | "Paid"
) {
  if (!withdrawalId) return;

  const updateData: {
    status: string;
    processed_at?: string;
  } = {
    status,
  };

  if (status === "Approved" || status === "Rejected" || status === "Paid") {
    updateData.processed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("withdrawal_requests")
    .update(updateData)
    .eq("id", withdrawalId);

  if (error) {
    console.error(error);
    alert(error.message);
    return;
  }

  setWithdrawals((current) =>
    current.map((item) =>
      item.id === withdrawalId
        ? {
            ...item,
            status,
            processed_at:
              updateData.processed_at || item.processed_at,
          }
        : item
    )
  );

  await loadPendingWithdrawalCount();
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
        connector_code,
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
            <a
              href="/admin"
              aria-label="LoanKarts Admin Dashboard"
              className="flex h-10 w-[150px] shrink-0 items-center justify-start px-0 sm:h-11 sm:w-[175px]"
            >
              <img
                src="/loankarts-logo-white.png"
                alt="LoanKarts"
                className="h-6 w-auto max-w-full object-contain sm:h-7"
              />
            </a>

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
            <button
              type="button"
              onClick={() => {
                if (pendingWithdrawalCount > 0) {
                  window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
                }
              }}
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-lg text-white transition hover:border-[#10b7d3]/50 hover:bg-[#10b7d3]/10"
              aria-label={`${pendingWithdrawalCount} pending withdrawal requests`}
              title={`${pendingWithdrawalCount} pending withdrawal request${pendingWithdrawalCount === 1 ? "" : "s"}`}
            >
              🔔
              {pendingWithdrawalCount > 0 && (
                <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white shadow-lg">
                  {pendingWithdrawalCount > 99 ? "99+" : pendingWithdrawalCount}
                </span>
              )}
            </button>

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
            placeholder="Search connector name or LKC code (e.g. LKC-0001)..."
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
              Connectors are shown from registered connector profiles and submitted loan files.
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

                          <div className="mt-1 inline-flex items-center rounded-lg bg-cyan-50 px-2.5 py-1 ring-1 ring-cyan-100">
                            <span className="text-[11px] font-black tracking-wide text-[#0799b5]">
                              {broker.connectorCode}
                            </span>
                          </div>
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
                              onClick={() => loadConnectorDetails(broker)}
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

                      <div className="mt-1 inline-flex items-center rounded-lg bg-cyan-50 px-2.5 py-1 ring-1 ring-cyan-100">
                        <span className="text-xs font-black tracking-wide text-[#0799b5]">
                          {broker.connectorCode}
                        </span>
                      </div>
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
                        onClick={() => loadConnectorDetails(broker)}
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
                <div className="mt-2 inline-flex items-center rounded-lg bg-white/10 px-3 py-1.5 ring-1 ring-white/20">
                  <span className="text-xs font-black tracking-wider text-[#10b7d3]">
                    {selectedBroker.connectorCode}
                  </span>
                </div>
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
                                          onClick={() => openDocument(String(path))}
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
      {/* CONNECTOR DETAILS MODAL */}
      {/* ========================= */}
      {detailsBroker && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-[#050b20]/75 p-3 backdrop-blur-md sm:p-5"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setDetailsBroker(null);
              setDetailsProfile(null);
              setWithdrawals([]);
            }
          }}
        >
          <div
            className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] bg-[#f6f9fb] shadow-2xl ring-1 ring-white/20"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* HEADER */}
            <div className="relative shrink-0 overflow-hidden bg-[#062536] px-5 py-5 text-white sm:px-7">
              <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full bg-[#10b7d3]/10" />

              <div className="relative flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#10b7d3] text-xl font-black shadow-lg">
                    {detailsBroker.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#10b7d3]">
                      LOANKARTS • CONNECTOR PROFILE
                    </p>
                    <h3 className="mt-1 truncate text-xl font-black sm:text-2xl">
                      {detailsProfile?.full_name || detailsBroker.name}
                    </h3>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-lg bg-white/10 px-3 py-1 text-[10px] font-black tracking-wider text-[#10b7d3] ring-1 ring-white/10">
                        {detailsProfile?.connector_code || detailsBroker.connectorCode}
                      </span>
                      <span className="text-[10px] font-bold text-white/45">
                        Complete connector overview
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setDetailsBroker(null);
                    setDetailsProfile(null);
                    setWithdrawals([]);
                  }}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-lg font-bold transition hover:bg-white hover:text-[#062536]"
                  aria-label="Close connector details"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* BODY */}
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
              {detailsLoading && !detailsProfile ? (
                <div className="flex min-h-[360px] items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#10b7d3]" />
                    <p className="mt-4 text-sm font-bold text-slate-500">
                      Loading connector details...
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* STATS */}
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    <StatCard label="Total Files" value={detailsBroker.total} tone="slate" />
                    <StatCard label="Processing" value={detailsBroker.processing} tone="amber" />
                    <StatCard label="Approved" value={detailsBroker.approved} tone="blue" />
                    <StatCard label="Disbursed" value={detailsBroker.disbursed} tone="green" />
                    <StatCard label="Rejected" value={detailsBroker.rejected} tone="red" />
                  </div>

                  {/* PROFILE + BANK */}
                  <div className="grid gap-5 lg:grid-cols-2">
                    <InfoPanel title="Connector Information" icon="👤">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <InfoItem label="Full Name" value={detailsProfile?.full_name || detailsBroker.name} />
                        <InfoItem label="Connector ID" value={detailsProfile?.connector_code || detailsBroker.connectorCode} />
                        <InfoItem label="Email" value={detailsProfile?.email || "Not available"} />
                        <InfoItem label="Phone" value={detailsProfile?.phone || "Not available"} />
                        <InfoItem label="Alternate Phone" value={detailsProfile?.alternate_phone || "Not available"} />
                        <InfoItem label="Gender" value={detailsProfile?.gender || "Not available"} />
                        <InfoItem label="Date of Birth" value={detailsProfile?.date_of_birth ? formatDate(detailsProfile.date_of_birth) : "Not available"} />
                        <InfoItem label="Pincode" value={detailsProfile?.pincode || "Not available"} />
                        <div className="sm:col-span-2">
                          <InfoItem label="Address" value={[detailsProfile?.address, detailsProfile?.city, detailsProfile?.state].filter(Boolean).join(", ") || "Not available"} />
                        </div>
                      </div>
                    </InfoPanel>

                    <InfoPanel title="Bank & Payout Details" icon="🏦">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <InfoItem label="Account Holder" value={detailsProfile?.account_holder_name || "Not available"} />
                        <InfoItem label="Bank Name" value={detailsProfile?.bank_name || "Not available"} />
                        <InfoItem label="Account Number" value={detailsProfile?.account_number ? maskAccount(detailsProfile.account_number) : "Not available"} />
                        <InfoItem label="IFSC Code" value={detailsProfile?.ifsc_code || "Not available"} />
                        <InfoItem label="Branch" value={detailsProfile?.branch_name || "Not available"} />
                        <InfoItem label="Account Type" value={detailsProfile?.account_type || "Not available"} />
                      </div>
                    </InfoPanel>
                  </div>

                  {/* COMMISSION + WITHDRAWAL */}
                  <div className="grid gap-5 lg:grid-cols-[1fr_1.35fr]">
                    <div className="rounded-3xl border border-green-100 bg-gradient-to-br from-green-50 to-white p-5 shadow-sm sm:p-6">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-green-700">
                        Earnings Overview
                      </p>

                      <p className="mt-2 text-3xl font-black text-green-700">
                        {money(detailsBroker.totalCommission)}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Total commission from disbursed files
                      </p>

                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl bg-white p-4 ring-1 ring-green-100">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Loan Value
                          </p>
                          <p className="mt-1 text-lg font-black text-[#073b4c]">
                            {money(detailsBroker.amount)}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-white p-4 ring-1 ring-green-100">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Withdrawals
                          </p>
                          <p className="mt-1 text-lg font-black text-[#073b4c]">
                            {money(withdrawals.reduce((sum, item) => sum + Number(item.amount || 0), 0))}
                          </p>
                        </div>
                      </div>
                    </div>

                    <InfoPanel title="Withdrawal Requests" icon="💸">
                      {withdrawals.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-7 text-center">
                          <p className="text-2xl">💸</p>
                          <p className="mt-2 text-sm font-black text-slate-600">
                            No withdrawal requests yet
                          </p>
                          <p className="mt-1 text-[11px] text-slate-400">
                            New connector payout requests will appear here automatically.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {withdrawals.map((request) => (
                            <div key={request.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                                <div>
                                  <p className="text-xl font-black text-[#073b4c]">
                                    {money(Number(request.amount || 0))}
                                  </p>
                                  <p className="mt-1 text-[10px] text-slate-400">
                                    Requested {formatDateTime(request.requested_at)}
                                  </p>
                                </div>

                               <div className="flex items-center gap-2">
  <select
    value={request.status}
    onChange={(e) =>
      updateWithdrawalStatus(
        request.id,
        e.target.value as "Pending" | "Approved" | "Rejected" | "Paid"
      )
    }
    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-[#073b4c] outline-none focus:border-[#10b7d3]"
  >
    <option value="Pending">Pending</option>
    <option value="Approved">Approved</option>
    <option value="Rejected">Rejected</option>
    <option value="Paid">Paid</option>
  </select>

  <WithdrawalBadge status={request.status} />
</div>
                              </div>

                              {request.admin_note && (
                                <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
                                  <span className="font-black">Admin note:</span> {request.admin_note}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </InfoPanel>
                  </div>

                  {/* FILE PERFORMANCE */}
                  <InfoPanel title="Loan File Performance" icon="📁">
                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                      <table className="w-full min-w-[820px]">
                        <thead className="bg-slate-50">
                          <tr className="text-left text-[10px] font-black uppercase tracking-wider text-slate-500">
                            <th className="px-4 py-3">File ID</th>
                            <th className="px-4 py-3">Customer</th>
                            <th className="px-4 py-3">Loan</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Commission</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailsBroker.fileList.map((file) => (
                            <tr key={file.id} className="border-t border-slate-100">
                              <td className="px-4 py-3 text-xs font-black text-[#073b4c]">
                               {file.file_code || file.id}
                              </td>
                              <td className="px-4 py-3">
                                <p className="text-xs font-black text-slate-700">{file.customer_name}</p>
                              </td>
                              <td className="px-4 py-3">
                                <p className="text-xs font-bold text-slate-700">{file.loan_type}</p>
                                <p className="mt-0.5 text-[10px] text-slate-400">{money(file.loan_amount)}</p>
                              </td>
                              <td className="px-4 py-3">
                                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-black text-slate-700">
                                  {file.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-xs font-black text-green-600">
                                {file.status === "Disbursed" ? money(getCommissionAmount(file)) : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </InfoPanel>

                  {pendingWithdrawalCount > 0 && withdrawals.some((item) => item.status === "Pending") && (
                    <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <span className="text-xl">🔔</span>
                      <div>
                        <p className="text-sm font-black text-amber-800">
                          Withdrawal request needs attention
                        </p>
                        <p className="mt-1 text-[11px] leading-5 text-amber-700">
                          This connector has a pending payout request. Review the request and process it from your admin payout workflow.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* FOOTER */}
            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:px-7">
              <p className="hidden text-[10px] text-slate-400 sm:block">
                Connector information • File performance • Bank details • Withdrawal history
              </p>
              <button
                onClick={() => {
                  setDetailsBroker(null);
                  setDetailsProfile(null);
                  setWithdrawals([]);
                }}
                className="ml-auto rounded-xl bg-[#073b4c] px-5 py-2.5 text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-[#052f3d]"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function maskAccount(value: string) {
  // Admin connector details should show the complete account number.
  // Keep the value as entered in connector_profiles.
  return String(value || "").trim();
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "slate" | "amber" | "blue" | "green" | "red";
}) {
  const tones = {
    slate: "bg-slate-50 text-[#073b4c] ring-slate-200",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    green: "bg-green-50 text-green-700 ring-green-100",
    red: "bg-red-50 text-red-700 ring-red-100",
  };

  return (
    <div className={`rounded-2xl p-4 ring-1 ${tones[tone]}`}>
      <p className="text-[9px] font-black uppercase tracking-[0.14em] opacity-65">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}

function InfoPanel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#062536] text-base">
          {icon}
        </div>
        <div>
          <h4 className="text-base font-black text-[#073b4c]">{title}</h4>
          <p className="mt-0.5 text-[10px] text-slate-400">
            Connector account information
          </p>
        </div>
      </div>
      {children}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] font-black uppercase tracking-[0.13em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-xs font-bold text-[#073b4c]">
        {value}
      </p>
    </div>
  );
}

function WithdrawalBadge({ status }: { status: string }) {
  const config: Record<string, string> = {
    Pending: "border-amber-200 bg-amber-50 text-amber-700",
    Approved: "border-blue-200 bg-blue-50 text-blue-700",
    Paid: "border-green-200 bg-green-50 text-green-700",
    Rejected: "border-red-200 bg-red-50 text-red-700",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1.5 text-[10px] font-black ${
        config[status] || "border-slate-200 bg-slate-50 text-slate-600"
      }`}
    >
      {status}
    </span>
  );
}
