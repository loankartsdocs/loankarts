"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  file_code: string | null;
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
  connector_code?: string | null;
  document_paths: DocumentPaths;
  created_at: string;
};

type LoanFile = DatabaseFile;

type ConnectorProfile = {
  id: string;
  connector_code: string | null;
  full_name: string | null;
  email: string | null;
};

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

  const [brokerName, setBrokerName] =
    useState("Connector Partner");

  const [brokerEmail, setBrokerEmail] =
    useState("");

  const [connectorCode, setConnectorCode] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [selectedFile, setSelectedFile] =
    useState<LoanFile | null>(null);

  const [openingDocument, setOpeningDocument] =
    useState<string | null>(null);

  const loadRequestRef = useRef(0);
  const lastKnownFilesRef = useRef<LoanFile[]>([]);
  const lastKnownProfileRef = useRef<ConnectorProfile | null>(null);

  /* =========================================================
     LOAD BROKER DATA
     ========================================================= */

  async function getStableSession() {
    for (let attempt = 0; attempt < 16; attempt += 1) {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Supabase session error:", error);
      }

      if (session?.user) return session;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const {
          data: { session: refreshedSession },
        } = await supabase.auth.getSession();
        if (refreshedSession?.user) return refreshedSession;
      }

      if (attempt < 15) {
        await new Promise((resolve) =>
          setTimeout(resolve, Math.min(1000, 250 + attempt * 100))
        );
      }
    }

    return null;
  }

  async function loadFiles(
    providedUser?: {
      id: string;
      email?: string | null;
      user_metadata?: Record<string, unknown>;
    }
  ) {
    const requestId = ++loadRequestRef.current;
    setLoading(true);
    setErrorMessage("");

    try {
      const user = providedUser || (await getStableSession())?.user;

      if (!user) {
        // Never wipe an already-loaded dashboard during a temporary auth restore race.
        if (requestId === loadRequestRef.current) {
          try {
            const raw = localStorage.getItem("loankarts-broker-dashboard-cache");
            if (raw) {
              const cached = JSON.parse(raw) as {
                files?: LoanFile[];
                brokerName?: string;
                brokerEmail?: string;
                connectorCode?: string;
              };
              if (Array.isArray(cached.files)) {
                lastKnownFilesRef.current = cached.files;
                setFiles(cached.files);
              }
              if (cached.brokerName) setBrokerName(cached.brokerName);
              if (cached.brokerEmail) setBrokerEmail(cached.brokerEmail);
              if (cached.connectorCode) setConnectorCode(cached.connectorCode);
            }
          } catch {}
          setErrorMessage("");
          setLoading(false);
        }
        return;
      }

      const email = typeof user.email === "string" ? user.email.trim() : "";
      const metadataName =
        typeof user.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name.trim()
          : "";

      let connectorProfile: ConnectorProfile | null = null;

      // Resolve the connector profile with a short retry window. On a route
      // change/refresh Supabase can have a valid auth session while the first
      // Postgres request still sees the session being restored. The old code
      // treated that temporary empty response as a real "no profile" result,
      // which is why the dashboard briefly changed to CONNECTOR ID — / ₹0.
      for (let attempt = 0; attempt < 6 && !connectorProfile; attempt += 1) {
        const profileById = await supabase
          .from("connector_profiles")
          .select("id, connector_code, full_name, email")
          .eq("id", user.id)
          .maybeSingle();

        if (!profileById.error && profileById.data) {
          connectorProfile = profileById.data as ConnectorProfile;
          break;
        }

        if (email) {
          const profileByEmail = await supabase
            .from("connector_profiles")
            .select("id, connector_code, full_name, email")
            .ilike("email", email)
            .maybeSingle();

          if (!profileByEmail.error && profileByEmail.data) {
            connectorProfile = profileByEmail.data as ConnectorProfile;
            break;
          }
        }

        if (attempt < 5) {
          await new Promise((resolve) =>
            setTimeout(resolve, 250 + attempt * 150)
          );
        }
      }

      // Keep the last confirmed profile if this refresh returned temporarily
      // empty. Never replace known connector information with blank values.
      if (connectorProfile) {
        lastKnownProfileRef.current = connectorProfile;
        try {
          localStorage.setItem(
            "loankarts-broker-profile-cache",
            JSON.stringify({
              profile: connectorProfile,
              savedAt: Date.now(),
            })
          );
        } catch {}
      } else if (lastKnownProfileRef.current) {
        connectorProfile = lastKnownProfileRef.current;
      }

      const resolvedConnectorCode =
        connectorProfile?.connector_code?.trim() || "";

      if (requestId !== loadRequestRef.current) return;

      // Only update the UI with confirmed/cached profile values.
      if (connectorProfile?.email?.trim() || email) {
        setBrokerEmail(connectorProfile?.email?.trim() || email);
      }
      if (connectorProfile?.full_name?.trim() || metadataName || email) {
        setBrokerName(
          connectorProfile?.full_name?.trim() ||
            metadataName ||
            (email ? email.split("@")[0] : "Connector Partner")
        );
      }
      if (resolvedConnectorCode) {
        setConnectorCode(resolvedConnectorCode);
      }

      /*
       * IMPORTANT:
       * Different parts of the connector system may have saved broker_id as
       * auth user id OR connector_profiles.id. We therefore check both and,
       * when available, the permanent connector_code as a final fallback.
       * Results are merged and de-duplicated so the dashboard never appears
       * empty simply because the user came back from Wallet/Profile.
       */
      const brokerIds = Array.from(
        new Set(
          [user.id, connectorProfile?.id]
            .filter((value): value is string => Boolean(value))
            .map((value) => value.trim())
            .filter(Boolean)
        )
      );

      const queries = brokerIds.map((brokerId) =>
        supabase
          .from("loan_files")
          .select(
            `
              id,
file_code,
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
              connector_code,
              document_paths,
              created_at
            `
          )
          .eq("broker_id", brokerId)
          .order("created_at", { ascending: false })
      );

      const results = await Promise.all(queries);
      const queryErrors = results.filter((result) => result.error);

      const merged = new Map<string, LoanFile>();
      for (const result of results) {
        for (const row of result.data || []) {
          merged.set(row.id, row as LoanFile);
        }
      }

      // Some older files may have broker_id that cannot be matched after an
      // account/profile migration, but they still contain the permanent
      // connector_code. Use that only when a connector code is available.
      if (resolvedConnectorCode) {
       const { data: codeFiles, error: codeError } = await supabase
  .from("loan_files")
  .select(
    `
      id,
      file_code,
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
      connector_code,
      document_paths,
      created_at
    `
  )
          .eq("connector_code", resolvedConnectorCode)
          .order("created_at", { ascending: false });

        if (!codeError) {
          for (const row of codeFiles || []) {
            merged.set(row.id, row as LoanFile);
          }
        } else {
          console.warn("Connector-code loan file lookup failed:", codeError);
        }
      }

      if (requestId !== loadRequestRef.current) return;

      if (merged.size === 0 && queryErrors.length === results.length && !resolvedConnectorCode) {
        throw new Error(
          queryErrors[0]?.error?.message || "Unable to load your loan files."
        );
      }

      const nextFiles = Array.from(merged.values()).sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      if (nextFiles.length > 0 || lastKnownFilesRef.current.length === 0) {
        lastKnownFilesRef.current = nextFiles;
        setFiles(nextFiles);
      } else {
        setFiles(lastKnownFilesRef.current);
      }

      // Keep a persistent browser cache. This prevents the dashboard from
      // flashing to ₹0/— when the user returns from Wallet/Profile while the
      // Supabase session is being restored, then the fresh query replaces it.
      try {
        localStorage.setItem(
          "loankarts-broker-dashboard-cache",
          JSON.stringify({
            files: nextFiles,
            brokerName:
              connectorProfile?.full_name?.trim() ||
              metadataName ||
              (email ? email.split("@")[0] : "Connector Partner"),
            brokerEmail: connectorProfile?.email?.trim() || email,
            connectorCode: resolvedConnectorCode,
            savedAt: Date.now(),
          })
        );
      } catch {
        // Storage can be unavailable in private/restricted browser contexts.
      }
    } catch (error) {
      console.error("Unable to load connector dashboard:", error);

      if (requestId === loadRequestRef.current) {
        // Do not destroy already-visible data because a background refresh
        // temporarily failed.
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load your loan files."
        );
      }
    } finally {
      if (requestId === loadRequestRef.current) {
        setLoading(false);
      }
    }
  }

  /* =========================================================
     INITIAL LOAD + REALTIME + RETURN FROM OTHER PAGES
     ========================================================= */

  useEffect(() => {
    let mounted = true;
    let redirectTimer: number | null = null;

    // Show the last known dashboard immediately while Supabase restores the
    // auth session. Fresh server data is still loaded right after this.
    try {
      const raw = localStorage.getItem("loankarts-broker-dashboard-cache");
      if (raw) {
        const cached = JSON.parse(raw) as {
          files?: LoanFile[];
          brokerName?: string;
          brokerEmail?: string;
          connectorCode?: string;
          savedAt?: number;
        };

        // Cache is intentionally short-lived; it is only a visual bridge,
        // never the source of truth.
        if (cached.savedAt && Date.now() - cached.savedAt < 30 * 60 * 1000) {
          if (Array.isArray(cached.files)) setFiles(cached.files);
          if (cached.brokerName) setBrokerName(cached.brokerName);
          if (cached.brokerEmail) setBrokerEmail(cached.brokerEmail);
          if (cached.connectorCode) setConnectorCode(cached.connectorCode);
          setLoading(false);
        }
      }
    } catch {
      // Ignore malformed/unavailable browser cache.
    }

    // Restore the last confirmed connector profile immediately. This is only
    // a visual/session bridge; Supabase remains the source of truth.
    try {
      const rawProfile = localStorage.getItem("loankarts-broker-profile-cache");
      if (rawProfile) {
        const cachedProfile = JSON.parse(rawProfile) as {
          profile?: ConnectorProfile;
          savedAt?: number;
        };
        if (
          cachedProfile.profile &&
          cachedProfile.savedAt &&
          Date.now() - cachedProfile.savedAt < 24 * 60 * 60 * 1000
        ) {
          lastKnownProfileRef.current = cachedProfile.profile;
          if (cachedProfile.profile.full_name) {
            setBrokerName(cachedProfile.profile.full_name);
          }
          if (cachedProfile.profile.email) {
            setBrokerEmail(cachedProfile.profile.email);
          }
          if (cachedProfile.profile.connector_code) {
            setConnectorCode(cachedProfile.profile.connector_code);
          }
        }
      }
    } catch {}

    const redirectToLogin = () => {
      if (!mounted) return;
      window.location.replace("/broker/login");
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

        // Let the auth callback finish before doing Supabase queries. This
        // avoids auth-lock races when the browser refreshes the token.
        window.setTimeout(() => {
          if (mounted) void loadFiles(session.user);
        }, 0);
        return;
      }

      if (event === "SIGNED_OUT") {
        redirectToLogin();
      }
    });

    const initialize = async () => {
      const session = await getStableSession();
      if (!mounted) return;

      if (session?.user) {
        void loadFiles(session.user);
      } else {
        // Do not redirect during a temporary session restoration gap.
        setLoading(false);
      }
    };

    void initialize();

    let refreshTimer: number | null = null;

    const refreshOnReturn = () => {
      if (!mounted) return;
      if (refreshTimer !== null) window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => {
        if (mounted) void loadFiles();
      }, 350);
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") refreshOnReturn();
    };

    window.addEventListener("pageshow", refreshOnReturn);
    document.addEventListener("visibilitychange", handleVisibility);

    const channel = supabase
      .channel(`broker-loan-files-${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "loan_files",
        },
        () => {
          if (mounted) refreshOnReturn();
        }
      )
      .subscribe();

    const profileChannel = supabase
      .channel(`broker-profile-${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "connector_profiles",
        },
        () => {
          if (mounted) refreshOnReturn();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      if (redirectTimer !== null) window.clearTimeout(redirectTimer);
      if (refreshTimer !== null) window.clearTimeout(refreshTimer);
      subscription.unsubscribe();
      window.removeEventListener("pageshow", refreshOnReturn);
      document.removeEventListener("visibilitychange", handleVisibility);
      supabase.removeChannel(channel);
      supabase.removeChannel(profileChannel);
    };
  }, []);

  /* =========================================================
     MONEY FORMAT
     ========================================================= */

  function money(
    value: number | null
  ) {
    if (
      value === null ||
      value === undefined
    ) {
      return "—";
    }

    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }
    ).format(value);
  }

  /* =========================================================
     COMMISSION
     ========================================================= */

  function commissionAmount(
    file: LoanFile
  ) {
    if (
      file.status !== "Disbursed"
    ) {
      return 0;
    }

    if (
      file.commission_amount !==
        null &&
      file.commission_amount !==
        undefined
    ) {
      return Number(
        file.commission_amount
      );
    }

    const rate = Number(
      file.commission_rate || 0
    );

    return (
      (Number(
        file.loan_amount || 0
      ) *
        rate) /
      100
    );
  }

  /* =========================================================
     DASHBOARD TOTALS
     ========================================================= */

  const totalLoanAmount =
    useMemo(() => {
      return files.reduce(
        (sum, file) =>
          sum +
          Number(
            file.loan_amount || 0
          ),
        0
      );
    }, [files]);

  const totalCommission =
    useMemo(() => {
      return files.reduce(
        (sum, file) =>
          sum +
          commissionAmount(file),
        0
      );
    }, [files]);

  const disbursedCount =
    useMemo(() => {
      return files.filter(
        (file) =>
          file.status ===
          "Disbursed"
      ).length;
    }, [files]);

  /* =========================================================
     ONLY 5 RECENT FILES ON DASHBOARD
     ========================================================= */

  const recentFiles =
    useMemo(() => {
      return files.slice(0, 5);
    }, [files]);

  /* =========================================================
     STATUS COLORS
     ========================================================= */

  function statusClass(
    status: FileStatus
  ) {
    switch (status) {
      case "Disbursed":
        return "bg-green-50 text-green-700 border-green-200";

      case "Approved":
        return "bg-blue-50 text-blue-700 border-blue-200";

      case "Processing":
        return "bg-amber-50 text-amber-700 border-amber-200";

      case "Rejected":
        return "bg-red-50 text-red-700 border-red-200";

      default:
        return "bg-slate-50 text-slate-700 border-slate-300";
    }
  }

  /* =========================================================
     STATUS ICON
     ========================================================= */

  function statusIcon(
    status: FileStatus
  ) {
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

  /* =========================================================
     OPEN DOCUMENT
     ========================================================= */

  async function openDocument(
    path: string | null,
    documentName: string
  ) {
    if (!path) {
      alert(
        "This document is not available."
      );
      return;
    }

    setOpeningDocument(
      documentName
    );

    try {
      let objectPath =
        String(path).trim();

      if (!objectPath) {
        throw new Error(
          "Document path is empty."
        );
      }

      /*
       * If database contains complete Supabase URL,
       * convert it back to storage object path.
       */

      if (
        /^https?:\/\//i.test(
          objectPath
        )
      ) {
        const url = new URL(
          objectPath
        );

        const pathname =
          decodeURIComponent(
            url.pathname
          );

        const marker =
          "/loan-documents/";

        const index =
          pathname.indexOf(marker);

        if (index !== -1) {
          objectPath =
            pathname.slice(
              index +
                marker.length
            );
        } else {
          throw new Error(
            "Invalid Supabase document URL."
          );
        }
      }

      objectPath =
        objectPath
          .replace(/^\/+/, "")
          .replace(
            /^loan-documents\/+/,
            ""
          );

      try {
        objectPath =
          decodeURIComponent(
            objectPath
          );
      } catch {
        // Keep original path.
      }

      objectPath =
        objectPath.trim();

      if (!objectPath) {
        throw new Error(
          "Invalid document path."
        );
      }

      const {
        data,
        error,
      } = await supabase.storage
        .from("loan-documents")
        .createSignedUrl(
          objectPath,
          3600
        );

      if (error) {
        throw new Error(
          error.message
        );
      }

      if (
        !data?.signedUrl
      ) {
        throw new Error(
          "Unable to create document link."
        );
      }

      window.open(
        data.signedUrl,
        "_blank",
        "noopener,noreferrer"
      );
    } catch (error) {
      console.error(
        "Unable to open document:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Unable to open document."
      );
    } finally {
      setOpeningDocument(null);
    }
  }

  /* =========================================================
     LOGOUT
     ========================================================= */

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
    } finally {
      window.location.href = "/";
    }
  }

  /* =========================================================
     RETURN
     ========================================================= */

  return (
    <main className="min-h-screen bg-[#f4f8fb]">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050b20]/95 text-white shadow-xl backdrop-blur">

        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-5 py-4 sm:px-6 lg:px-8">

          {/* BRAND */}

          <a
            href="/broker"
            className="flex items-center gap-4"
          >

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
                LoanKarts Connector Dashboard
              </p>

            </div>

          </a>

          {/* HEADER RIGHT */}

          <div className="flex items-center gap-3">

            {connectorCode && (
              <div className="inline-flex items-center gap-2 rounded-xl border border-[#08b8d4]/45 bg-[#08b8d4]/10 px-3 py-2">

                <span className="hidden text-[9px] font-extrabold uppercase tracking-[0.16em] text-white/50 sm:inline">
                  Connector ID
                </span>

                <span className="text-[11px] font-black tracking-wide text-[#08b8d4] sm:text-xs">
                  {connectorCode}
                </span>

              </div>
            )}

            <button
              type="button"
              onClick={
                handleLogout
              }
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-extrabold text-white transition hover:border-red-300/40 hover:bg-red-500/10 hover:text-red-100 sm:px-5 sm:text-sm"
            >
              Logout
            </button>

          </div>

        </div>

      </header>


      {/* =====================================================
          MAIN CONTENT
          ===================================================== */}

      <section className="mx-auto max-w-[1280px] px-5 py-8 sm:px-6 lg:px-8 lg:py-10">


        {/* ===================================================
            TOP THREE CARDS
            DASHBOARD + WALLET + PROFILE
            =================================================== */}

        <div className="mt-7 grid gap-5 lg:grid-cols-[1.25fr_0.8fr_0.8fr]">


          {/* =================================================
              CONNECTOR DASHBOARD
              ================================================= */}

          <div className="relative overflow-hidden rounded-[28px] bg-[#062536] p-7 text-white shadow-[0_18px_45px_rgba(6,37,54,0.16)] sm:p-8">

            {/* background circles */}

            <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#08b8d4]/10" />

            <div className="absolute -bottom-24 right-1/4 h-48 w-48 rounded-full bg-[#08b8d4]/5 blur-2xl" />


            <div className="relative">

              {/* LIVE PARTNER NETWORK */}

              <div className="flex items-center gap-3">

                {/* BLINKING LIVE DOT */}

                <span className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-[#08b8d4]/15">

                  <span className="absolute h-3 w-3 animate-ping rounded-full bg-[#08b8d4] opacity-70" />

                  <span className="relative h-2.5 w-2.5 rounded-full bg-[#08b8d4] shadow-[0_0_12px_rgba(8,184,212,0.95)]" />

                </span>

                <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-[#08b8d4]">
                  PARTNER NETWORK
                </p>

              </div>


              <h3 className="mt-7 text-2xl font-black tracking-tight sm:text-3xl">
                Connector Dashboard
              </h3>


              <p className="mt-3 max-w-[650px] text-sm leading-6 text-white/65 sm:text-base">
                Manage your loan files, track applications and monitor your partner earnings from one place.
              </p>


              <a
                href="/broker/submit"
                className="mt-7 inline-flex items-center gap-3 rounded-xl bg-[#08b8d4] px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5 hover:bg-[#079eb7]"
              >

                <span>
                  +
                </span>

                SUBMIT NEW FILE

                <span className="text-base">
                  →
                </span>

              </a>

            </div>

          </div>


          {/* =================================================
              MY WALLET
              ================================================= */}

          <div className="group relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_12px_35px_rgba(15,23,42,0.07)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(15,23,42,0.11)] sm:p-7">

            {/* subtle decoration */}

            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-cyan-50 opacity-70 transition-transform duration-500 group-hover:scale-125" />


            <div className="relative">


              {/* WALLET TOP */}

              <div className="flex items-start justify-between gap-3">


                <div className="flex items-center gap-3">


                  {/* WALLET ICON */}

                  <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#062536] text-white shadow-[0_7px_18px_rgba(6,37,54,0.18)]">

                    <svg
                      width="23"
                      height="23"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >

                      <path
                        d="M19 7V5.8C19 4.806 18.194 4 17.2 4H5.8C4.806 4 4 4.806 4 5.8V18.2C4 19.194 4.806 20 5.8 20H18.2C19.194 20 20 19.194 20 18.2V9.5C20 8.672 19.328 8 18.5 8H7.5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      <path
                        d="M16 12H20V16H16.8C15.806 16 15 15.194 15 14C15 12.806 15.806 12 16.8 12H16Z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      <circle
                        cx="17.5"
                        cy="14"
                        r="0.9"
                        fill="currentColor"
                      />

                    </svg>

                  </div>


                  <div>

                    <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
                      MY WALLET
                    </p>

                    <p className="mt-1 text-[15px] font-black text-[#062536]">
                      Partner Earnings
                    </p>

                  </div>

                </div>


                {/* ARROW */}

                <a
                  href="/broker/wallet"
                  aria-label="View wallet"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-100 bg-[#f8fafc] text-lg font-bold text-[#062536] shadow-sm transition-all duration-300 group-hover:border-cyan-100 group-hover:bg-cyan-50 group-hover:text-[#08aeca]"
                >
                  →
                </a>

              </div>


              {/* AVAILABLE COMMISSION */}

              <div className="mt-7">

                <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-400">
                  AVAILABLE COMMISSION
                </p>

                <p className="mt-2 text-[28px] font-black tracking-tight text-[#062536]">
                  {money(
                    totalCommission
                  )}
                </p>

              </div>


              {/* WALLET FOOTER */}

              <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4">


                <div className="flex items-center gap-2">

                  {/* live dot */}

                  <span className="relative flex h-2.5 w-2.5">

                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-70" />

                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />

                  </span>

                  <p className="text-[11px] font-semibold text-slate-400">
                    {disbursedCount}{" "}
                    {disbursedCount === 1
                      ? "disbursed file"
                      : "disbursed files"}
                  </p>

                </div>


                <a
                  href="/broker/wallet"
                  className="text-[10px] font-black text-[#08aeca] transition hover:text-[#062536]"
                >
                  VIEW WALLET →
                </a>

              </div>

            </div>

          </div>


          {/* =================================================
              MY PROFILE
              ================================================= */}

          <div className="group relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_12px_35px_rgba(15,23,42,0.07)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(15,23,42,0.11)] sm:p-7">

            {/* subtle decoration */}

            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-cyan-50 opacity-60 transition-transform duration-500 group-hover:scale-125" />


            <div className="relative">


              {/* PROFILE TOP */}

              <div className="flex items-start justify-between gap-3">


                <div className="flex items-center gap-3">


                  {/* PROFILE AVATAR */}

                  <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#08b8d4] to-[#079bb5] text-lg font-black text-white shadow-[0_7px_18px_rgba(8,184,212,0.22)]">

                    {brokerName
                      ? brokerName
                          .charAt(0)
                          .toUpperCase()
                      : "J"}

                  </div>


                  <div>

                    <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
                      MY PROFILE
                    </p>

                    <p className="mt-1 max-w-[150px] truncate text-[15px] font-black uppercase text-[#062536]">
                      {brokerName}
                    </p>

                  </div>

                </div>


                {/* PROFILE ARROW */}

                <a
                  href="/broker/profile"
                  aria-label="View profile"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-100 bg-[#f8fafc] text-lg font-bold text-[#062536] shadow-sm transition-all duration-300 group-hover:border-cyan-100 group-hover:bg-cyan-50 group-hover:text-[#08aeca]"
                >
                  →
                </a>

              </div>


              {/* CONNECTOR ID */}

              <div className="mt-7">

                <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-400">
                  CONNECTOR ID
                </p>


                <div className="mt-2 flex items-center gap-2">

                  <p className="text-[19px] font-black tracking-tight text-[#062536]">
                    {connectorCode ||
                      "—"}
                  </p>


                  {connectorCode && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-50 text-[10px] font-black text-green-600">
                      ✓
                    </span>
                  )}

                </div>

              </div>


              {/* PROFILE FOOTER */}

              <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4">

                <p className="max-w-[180px] truncate text-[10px] font-semibold text-slate-400">
                  {brokerEmail ||
                    "Email not available"}
                </p>

                <a
                  href="/broker/profile"
                  className="text-[10px] font-black text-[#08aeca] transition hover:text-[#062536]"
                >
                  PROFILE →
                </a>

              </div>

            </div>

          </div>

        </div>


        {/* ===================================================
            LOAN AMOUNT + COMMISSION
            =================================================== */}

        <div className="mt-7 grid gap-5 lg:grid-cols-2">


          {/* LOAN AMOUNT */}

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-7">

            <div className="flex items-start justify-between">

              <div>

                <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-500">
                  LOAN AMOUNT
                </p>

                <p className="mt-3 text-2xl font-black tracking-tight text-[#062536] sm:text-[25px]">
                  {money(
                    totalLoanAmount
                  )}
                </p>

                <p className="mt-4 text-xs font-semibold text-slate-400">
                  Total loan value across your submitted files
                </p>

              </div>


              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-50 text-xl text-[#08b8d4]">

                <svg
                  width="21"
                  height="21"
                  viewBox="0 0 24 24"
                  fill="none"
                >

                  <rect
                    x="5"
                    y="3"
                    width="14"
                    height="18"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />

                  <path
                    d="M8 8H16M8 12H16M8 16H13"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />

                </svg>

              </div>

            </div>

          </div>


          {/* YOUR COMMISSION */}

          <div className="rounded-[28px] border border-green-100 bg-gradient-to-br from-white to-green-50 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-7">

            <div className="flex items-start justify-between">

              <div>

                <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-green-700">
                  YOUR COMMISSION
                </p>

                <p className="mt-3 text-2xl font-black tracking-tight text-green-700 sm:text-[25px]">
                  {money(
                    totalCommission
                  )}
                </p>

                <p className="mt-4 text-xs font-semibold text-slate-400">
                  Commission calculated on disbursed files
                </p>

              </div>


              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-xl font-black text-green-700">
                ₹
              </div>

            </div>

          </div>

        </div>


        {/* ===================================================
            MY LOAN FILES
            =================================================== */}

        <div
          id="my-loan-files"
          className="mt-7 overflow-hidden rounded-[28px] bg-white shadow-xl shadow-slate-200/50 ring-1 ring-slate-200"
        >


          {/* FILE HEADER */}

          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 bg-white px-5 py-6 sm:px-6 md:flex-row md:items-center">


            <div>

              <div className="flex items-center gap-3">

                <h3 className="text-xl font-black tracking-tight text-[#073b4c]">
                  My Loan Files
                </h3>


                {!loading &&
                  files.length >
                    0 && (
                    <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-[10px] font-black text-[#079bb5]">
                      Latest{" "}
                      {Math.min(
                        files.length,
                        5
                      )}
                    </span>
                  )}

              </div>


              <p className="mt-1 text-[11px] font-medium text-slate-500">
                Latest status and updates from LoanKarts.
              </p>

            </div>


            {/* VIEW ALL */}

            <a
              href="/broker/files"
              className="group inline-flex items-center justify-center gap-3 rounded-xl border border-[#08b8d4] px-5 py-3 text-[11px] font-black text-[#079bb5] transition hover:bg-cyan-50"
            >

              VIEW ALL FILES

              <span className="text-base transition-transform group-hover:translate-x-1">
                →
              </span>

            </a>

          </div>


          {/* ERROR */}

          {errorMessage && (
            <div className="mx-5 mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {errorMessage}
            </div>
          )}


          {/* LOADING */}

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


                {/* TABLE HEADER */}

                <thead className="bg-[#f7fafc]">

                  <tr className="text-left text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-500">

                    <th className="px-6 py-4">
                      FILE ID
                    </th>

                    <th className="px-6 py-4">
                      CUSTOMER
                    </th>

                    <th className="px-6 py-4">
                      LOAN
                    </th>

                    <th className="px-6 py-4">
                      STATUS
                    </th>

                    <th className="px-6 py-4">
                      LATEST UPDATE
                    </th>

                    <th className="px-6 py-4">
                      COMMISSION
                    </th>

                    <th className="px-6 py-4">
                      DATE
                    </th>

                    <th className="px-6 py-4">
                      ACTION
                    </th>

                  </tr>

                </thead>


                {/* TABLE BODY */}

                <tbody>

                  {recentFiles.map(
                    (file) => (

                      <tr
                        key={file.id}
                        className="border-t border-slate-100 transition hover:bg-[#f8fcfd]"
                      >

                        {/* FILE ID */}

                        <td className="px-5 py-5">

                          <span className="text-[12px] font-extrabold text-[#073b4c]">
                           {file.file_code || file.id}
                          </span>

                        </td>


                        {/* CUSTOMER */}

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


                        {/* LOAN */}

                        <td className="px-5 py-5">

                          <p className="font-semibold text-slate-700">
                            {file.loan_type}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {money(
                              file.loan_amount
                            )}
                          </p>

                        </td>


                        {/* STATUS */}

                        <td className="px-5 py-5">

                          <span
                            className={`inline-flex min-w-[92px] items-center justify-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-extrabold shadow-sm ${statusClass(
                              file.status
                            )}`}
                          >

                            <span className="relative flex h-2 w-2">

                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-30" />

                              <span className="relative h-1.5 w-1.5 rounded-full bg-current" />

                            </span>

                            {file.status}

                          </span>

                        </td>


                        {/* UPDATE */}

                        <td className="max-w-xs px-6 py-5 text-sm leading-6 text-slate-600">

                          {file.update_text ||
                            "No update available yet."}

                        </td>


                        {/* COMMISSION */}

                        <td className="px-5 py-5">

                          <p className="text-[13px] font-extrabold text-green-600">

                            {file.status ===
                            "Disbursed"
                              ? money(
                                  commissionAmount(
                                    file
                                  )
                                )
                              : "—"}

                          </p>


                          {file.status ===
                            "Disbursed" && (
                            <p className="mt-1 text-xs text-slate-400">

                              {Number(
                                file.commission_rate ||
                                  0
                              ).toFixed(2)}
                              %

                            </p>
                          )}

                        </td>


                        {/* DATE */}

                        <td className="px-6 py-5 text-sm text-slate-500">

                          {new Date(
                            file.created_at
                          ).toLocaleDateString(
                            "en-IN",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            }
                          )}

                        </td>


                        {/* ACTION */}

                        <td className="px-5 py-5">

                          <button
                            type="button"
                            onClick={() =>
                              setSelectedFile(
                                file
                              )
                            }
                            className="whitespace-nowrap rounded-xl bg-[#08b8d4] px-4 py-2.5 text-[11px] font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#079eb7]"
                          >
                            View File
                          </button>

                        </td>

                      </tr>

                    )
                  )}


                  {/* NO FILES */}

                  {files.length ===
                    0 && (
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
                          Submit your first loan file to start tracking it here.
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


          {/* MORE THAN 5 */}

          {!loading &&
            files.length > 5 && (
              <div className="flex items-center justify-between border-t border-slate-100 bg-[#fbfdfe] px-5 py-4">

                <p className="text-xs font-semibold text-slate-400">
                  Showing 5 latest files
                </p>

                <a
                  href="/broker/files"
                  className="group inline-flex items-center gap-2 text-xs font-extrabold text-[#079bb5]"
                >

                  VIEW ALL FILES

                  <span className="transition-transform group-hover:translate-x-1">
                    →
                  </span>

                </a>

              </div>
            )}

        </div>


        {/* ===================================================
            LIVE TRACKING
            =================================================== */}

        <div className="mt-6 rounded-2xl border border-cyan-100 bg-gradient-to-r from-cyan-50 to-white p-5 shadow-sm">

          <p className="font-bold text-[#073b4c]">
            📌 Live File Tracking
          </p>

          <p className="mt-1 text-sm leading-6 text-slate-600">
            When the LoanKarts team changes your application status or adds an update, it will appear here automatically.
          </p>

        </div>


        {/* ===================================================
            FOOTER
            =================================================== */}

        <div className="mt-5 flex flex-col justify-between gap-2 px-1 text-xs text-slate-400 sm:flex-row">

          <p>
            LoanKarts Connector Partner Portal
          </p>

          <p>
            Secure file tracking &amp; commission updates
          </p>

        </div>

      </section>


      {/* =====================================================
          FILE DETAILS POPUP
          ===================================================== */}

      {selectedFile && (

        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#050b20]/80 p-3 backdrop-blur-md sm:p-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="connector-file-title"
          onMouseDown={(e) => {

            if (
              e.target ===
              e.currentTarget
            ) {
              setSelectedFile(null);
            }

          }}
        >


          <div
            className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl ring-1 ring-white/20"
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >


            {/* POPUP HEADER */}

            <div className="flex shrink-0 items-center justify-between bg-[#062536] px-5 py-5 text-white sm:px-7">

              <div className="min-w-0 pr-4">

                <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#08b8d4]">
                  LOANKARTS • LOAN FILE
                </p>

                <h3
                  id="connector-file-title"
                  className="mt-1 truncate text-xl font-black sm:text-2xl"
                >
                  {selectedFile.customer_name}
                </h3>

                <p className="mt-1 truncate text-xs text-white/55 sm:text-sm">
                  File ID:{" "}
                 {selectedFile.file_code}
                </p>

              </div>


              <button
                type="button"
                onClick={() =>
                  setSelectedFile(null)
                }
                aria-label="Close file details"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/5 text-2xl font-light leading-none text-white transition hover:border-white/40 hover:bg-white hover:text-[#062536]"
              >
                ×
              </button>

            </div>


            {/* POPUP BODY */}

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6">


              {/* APPLICATION SUMMARY */}

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

                <div className="grid gap-4 md:grid-cols-3">


                  {/* STATUS */}

                  <div className="rounded-2xl bg-slate-50 p-5">

                    <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
                      Application Status
                    </p>

                    <div className="mt-3">

                      <span
                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-extrabold ${statusClass(
                          selectedFile.status
                        )}`}
                      >

                        <span>
                          {statusIcon(
                            selectedFile.status
                          )}
                        </span>

                        {selectedFile.status}

                      </span>

                    </div>

                  </div>


                  {/* LOAN AMOUNT */}

                  <div className="rounded-2xl bg-slate-50 p-5">

                    <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
                      Loan Amount
                    </p>

                    <p className="mt-3 text-2xl font-black text-[#062536]">
                      {money(
                        selectedFile.loan_amount
                      )}
                    </p>

                  </div>


                  {/* COMMISSION */}

                  <div className="rounded-2xl border border-green-100 bg-green-50 p-5">

                    <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-green-700">
                      Your Commission
                    </p>

                    <p className="mt-3 text-2xl font-black text-green-700">

                      {selectedFile.status ===
                      "Disbursed"
                        ? money(
                            commissionAmount(
                              selectedFile
                            )
                          )
                        : "Pending"}

                    </p>

                    <p className="mt-1 text-xs font-semibold text-slate-400">

                      {selectedFile.status ===
                      "Disbursed"
                        ? `${Number(
                            selectedFile.commission_rate ||
                              0
                          ).toFixed(2)}% commission`
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

                      {selectedFile.status ===
                      "Rejected"
                        ? "Application closed"
                        : selectedFile.status ===
                          "Disbursed"
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
                    ].map(
                      (
                        status,
                        index
                      ) => {

                        const currentIndex =
                          [
                            "Submitted",
                            "Processing",
                            "Approved",
                            "Disbursed",
                          ].indexOf(
                            selectedFile.status
                          );

                        const done =
                          selectedFile.status !==
                            "Rejected" &&
                          currentIndex >=
                            index;

                        const current =
                          selectedFile.status ===
                          status;

                        return (

                          <div
                            key={status}
                            className="flex items-center gap-2"
                          >

                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black ${
                                done
                                  ? "bg-[#08b8d4] text-white"
                                  : "bg-slate-100 text-slate-400"
                              }`}
                            >
                              {done
                                ? "✓"
                                : index +
                                  1}
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
                      }
                    )}

                  </div>


                  {selectedFile.status ===
                    "Rejected" && (

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
                    value={
                      selectedFile.customer_name
                    }
                  />

                  <Info
                    label="Mobile"
                    value={
                      selectedFile.mobile
                    }
                  />

                  <Info
                    label="Email"
                    value={
                      selectedFile.email ||
                      "Not provided"
                    }
                  />

                  <Info
                    label="City"
                    value={
                      selectedFile.city
                    }
                  />

                  <Info
                    label="Employment"
                    value={
                      selectedFile.employment
                    }
                  />

                  <Info
                    label="Monthly Income"
                    value={money(
                      selectedFile.monthly_income
                    )}
                  />

                  <Info
                    label="Loan Type"
                    value={
                      selectedFile.loan_type
                    }
                  />

                  <Info
                    label="Application Date"
                    value={new Date(
                      selectedFile.created_at
                    ).toLocaleDateString(
                      "en-IN",
                      {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      }
                    )}
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

                <div>

                  <h4 className="text-[15px] font-extrabold text-[#073b4c]">
                    Customer Documents
                  </h4>

                  <p className="mt-1 text-[11px] text-slate-500">
                    Open uploaded documents securely.
                  </p>

                </div>


                <div className="mt-4 grid gap-4 sm:grid-cols-2">

                  {Object.entries(
                    documentLabels
                  ).map(
                    ([key, label]) => {

                      const path =
                        selectedFile
                          .document_paths?.[
                          key
                        ] ||
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
                            type="button"
                            disabled={
                              !path ||
                              openingDocument ===
                                key
                            }
                            onClick={() =>
                              openDocument(
                                path,
                                key
                              )
                            }
                            className={`shrink-0 rounded-xl px-4 py-2.5 text-xs font-black text-white ${
                              path
                                ? "bg-[#10b7d3] hover:bg-[#0da8c1]"
                                : "cursor-not-allowed bg-slate-300"
                            }`}
                          >
                            {openingDocument ===
                            key
                              ? "Opening..."
                              : "View"}
                          </button>

                        </div>

                      );
                    }
                  )}

                </div>

              </div>

              {/* ADDITIONAL DOCUMENTS */}

<div className="mt-6">

  <h4 className="text-[15px] font-extrabold text-[#073b4c]">
    Send Additional Document
  </h4>

  <p className="mt-1 text-[11px] leading-5 text-slate-500">
    If any additional document is required after submission,
    you can send it directly to LoanKarts.
  </p>


  <div className="mt-4 grid gap-4 md:grid-cols-2">

    {/* EMAIL */}

    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

      <div className="flex items-start gap-4">

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-lg shadow-sm ring-1 ring-slate-200">
          ✉
        </div>

        <div className="min-w-0 flex-1">

          <h5 className="font-black text-[#073b4c]">
            Send by Email
          </h5>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Send the additional document to LoanKarts by email.
          </p>


          <div className="mt-3 space-y-1">

            <p className="text-xs text-slate-600">
              File ID:{" "}
              <span className="font-black text-[#073b4c]">
               {selectedFile.file_code}
              </span>
            </p>

            <p className="text-xs text-slate-600">
              Connector ID:{" "}
              <span className="font-black text-[#073b4c]">
                {connectorCode || "—"}
              </span>
            </p>

          </div>


          <a
            href={`mailto:backend.loankarts@gmail.com?subject=${encodeURIComponent(
              `Additional Document - File ID ${selectedFile.id}`
            )}&body=${encodeURIComponent(
              `Hello LoanKarts Team,

I am sending an additional document for my loan file.

File ID: ${selectedFile.file_code}
Connector ID: ${connectorCode || "—"}
Customer Name: ${selectedFile.customer_name}

Please find the additional document attached.

Regards`
            )}`}
           className="mt-4 inline-flex items-center justify-center rounded-xl bg-[#073b4c] px-4 py-2.5 text-xs font-black !text-white transition hover:bg-[#062f3e]"
          >
            Email Additional Document →
          </a>

        </div>

      </div>

    </div>


    {/* WHATSAPP */}

    <div className="rounded-2xl border border-green-200 bg-green-50/60 p-5">

      <div className="flex items-start gap-4">

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-black text-green-600 shadow-sm ring-1 ring-green-200">
          WA
        </div>

        <div className="min-w-0 flex-1">

          <h5 className="font-black text-[#073b4c]">
            Send by WhatsApp
          </h5>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Open LoanKarts WhatsApp directly and send the document.
          </p>


          <div className="mt-3 space-y-1">

            <p className="text-xs text-slate-600">
              File ID:{" "}
              <span className="font-black text-[#073b4c]">
                {selectedFile.file_code}
              </span>
            </p>

            <p className="text-xs text-slate-600">
              Connector ID:{" "}
              <span className="font-black text-[#073b4c]">
                {connectorCode || "—"}
              </span>
            </p>

          </div>


          <a
            href={`https://wa.me/919990954351?text=${encodeURIComponent(
              `Hello LoanKarts Team,

I am sending an additional document for my loan file.

File ID: ${selectedFile.file_code}
Connector ID: ${connectorCode || "—"}
Customer Name: ${selectedFile.customer_name}

Please find the additional document attached.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-green-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-green-700"
          >
            WhatsApp Additional Document →
          </a>

        </div>

      </div>

    </div>

  </div>


  <div className="mt-4 rounded-xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-xs leading-5 text-[#07556a]">
    <strong>Important:</strong> Always mention the correct File ID and
    Connector ID when sending additional documents.
  </div>

</div>

              {/* CLOSE */}

              <div className="mt-8 flex justify-end border-t border-slate-100 pt-5">

                <button
                  type="button"
                  onClick={() =>
                    setSelectedFile(null)
                  }
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


/* =========================================================
   INFO COMPONENT
   ========================================================= */

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