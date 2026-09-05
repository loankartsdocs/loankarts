"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type FileStatus =
  | "Submitted"
  | "Processing"
  | "Approved"
  | "Disbursed"
  | "Rejected";

type LoanFile = {
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
  created_at: string;
};

export default function BrokerFilesPage() {
  const [files, setFiles] =
    useState<LoanFile[]>([]);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<"All" | FileStatus>("All");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [selectedFile, setSelectedFile] =
    useState<LoanFile | null>(null);

  const [brokerName, setBrokerName] =
    useState("Connector Partner");

  const [connectorCode, setConnectorCode] =
    useState("");

  async function loadFiles() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw new Error(
          userError.message
        );
      }

      if (!user) {
        window.location.href =
          "/broker/login";
        return;
      }

      /* -----------------------------------------
         PROFILE
         ----------------------------------------- */

      const {
        data: profile,
      } = await supabase
        .from("connector_profiles")
        .select(
          "connector_code, full_name"
        )
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        setBrokerName(
          profile.full_name ||
            "Connector Partner"
        );

        setConnectorCode(
          profile.connector_code ||
            ""
        );
      } else {
        setBrokerName(
          typeof user.user_metadata
            ?.full_name === "string"
            ? user.user_metadata.full_name
            : user.email
            ? user.email.split("@")[0]
            : "Connector Partner"
        );
      }

      /* -----------------------------------------
         ALL FILES
         ----------------------------------------- */

      const {
        data,
        error: filesError,
      } = await supabase
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
          created_at
        `
        )
        .eq(
          "broker_id",
          user.id
        )
        .order("created_at", {
          ascending: false,
        });

      if (filesError) {
        throw new Error(
          filesError.message
        );
      }

      setFiles(
        (data || []) as LoanFile[]
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load files."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFiles();

    const channel = supabase
      .channel("all-broker-files")
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
      supabase.removeChannel(
        channel
      );
    };
  }, []);

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

    return (
      (Number(
        file.loan_amount || 0
      ) *
        Number(
          file.commission_rate || 0
        )) /
      100
    );
  }

  function statusClass(
    status: FileStatus
  ) {
    switch (status) {
      case "Disbursed":
        return "border-green-200 bg-green-50 text-green-700";

      case "Approved":
        return "border-blue-200 bg-blue-50 text-blue-700";

      case "Processing":
        return "border-amber-200 bg-amber-50 text-amber-700";

      case "Rejected":
        return "border-red-200 bg-red-50 text-red-700";

      default:
        return "border-slate-300 bg-slate-50 text-slate-700";
    }
  }

  /* =======================================================
     SEARCH + FILTER
     ======================================================= */

  const filteredFiles =
    useMemo(() => {

      const query =
        search
          .trim()
          .toLowerCase();

      return files.filter(
        (file) => {

          const matchesStatus =
            statusFilter ===
              "All" ||
            file.status ===
              statusFilter;

          if (!matchesStatus) {
            return false;
          }

          if (!query) {
            return true;
          }

          return (
            (file.file_code || file.id).toLowerCase()
              .includes(query) ||
            file.customer_name
              .toLowerCase()
              .includes(query) ||
            file.mobile
              .toLowerCase()
              .includes(query) ||
            file.loan_type
              .toLowerCase()
              .includes(query) ||
            file.city
              .toLowerCase()
              .includes(query) ||
            file.status
              .toLowerCase()
              .includes(query)
          );
        }
      );

    }, [
      files,
      search,
      statusFilter,
    ]);

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <main className="min-h-screen bg-[#f4f8fb]">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <header className="sticky top-0 z-40 bg-[#050b20] text-white shadow-xl">

        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-5 py-4 sm:px-6 lg:px-8">

          <a
            href="/broker"
            className="flex items-center gap-4"
          >

            <img
              src="/logo-white.png"
              alt="LoanKarts"
              className="h-[42px] w-[150px] object-contain"
            />

            <div className="hidden border-l border-white/15 pl-4 sm:block">

              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#08b8d4]">
                Partner Portal
              </p>

              <p className="mt-1 text-xs text-white/50">
                LoanKarts Connector Dashboard
              </p>

            </div>

          </a>


          <div className="flex items-center gap-3">

            {connectorCode && (
              <div className="hidden rounded-xl border border-[#08b8d4]/40 bg-[#08b8d4]/10 px-4 py-2 sm:block">

                <span className="mr-2 text-[9px] font-bold uppercase tracking-widest text-white/40">
                  Connector ID
                </span>

                <span className="text-xs font-black text-[#08b8d4]">
                  {connectorCode}
                </span>

              </div>
            )}

            <button
              onClick={logout}
              className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-xs font-black transition hover:bg-red-500/10"
            >
              Logout
            </button>

          </div>

        </div>

      </header>


      {/* =====================================================
          PAGE
          ===================================================== */}

      <section className="mx-auto max-w-[1280px] px-5 py-8 sm:px-6 lg:px-8">

        <a
          href="/broker"
          className="text-sm font-bold text-slate-500 transition hover:text-[#08aeca]"
        >
          ← Back to Dashboard
        </a>


        {/* TITLE */}

        <div className="mt-7">

          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#08b8d4]">
            FILE MANAGEMENT
          </p>

          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">

            <div>

              <h1 className="mt-2 text-3xl font-black tracking-tight text-[#062536]">
                All Loan Files
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Search and track all your submitted loan applications.
              </p>

            </div>


            <a
              href="/broker/submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#08b8d4] px-5 py-3 text-xs font-black text-white shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5 hover:bg-[#079eb7]"
            >
              + Submit New File
            </a>

          </div>

        </div>


        {/* ERROR */}

        {error && (
          <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}


        {/* ===================================================
            SEARCH AREA
            =================================================== */}

        <div className="mt-7 rounded-[25px] border border-slate-200 bg-white p-5 shadow-lg">

          <div className="flex flex-col gap-4 lg:flex-row">

            {/* SEARCH */}

            <div className="relative flex-1">

              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-400">
                ⌕
              </span>

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search by customer, file ID, mobile, loan type or city..."
                className="w-full rounded-xl border border-slate-200 bg-[#f8fafc] py-3.5 pl-11 pr-4 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#08b8d4] focus:bg-white focus:ring-4 focus:ring-cyan-50"
              />

            </div>


            {/* STATUS FILTER */}

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target
                    .value as
                    | "All"
                    | FileStatus
                )
              }
              className="rounded-xl border border-slate-200 bg-[#f8fafc] px-4 py-3.5 text-sm font-bold text-slate-600 outline-none focus:border-[#08b8d4] focus:ring-4 focus:ring-cyan-50"
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


          {/* RESULTS */}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">

            <p className="text-xs font-semibold text-slate-400">

              Showing{" "}
              <span className="font-black text-slate-600">
                {filteredFiles.length}
              </span>{" "}
              of{" "}
              <span className="font-black text-slate-600">
                {files.length}
              </span>{" "}
              files

            </p>


            {(search ||
              statusFilter !==
                "All") && (

              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter(
                    "All"
                  );
                }}
                className="text-xs font-black text-[#08aeca] hover:text-[#062536]"
              >
                Clear Filters
              </button>

            )}

          </div>

        </div>


        {/* ===================================================
            FILE TABLE
            =================================================== */}

        <div className="mt-6 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-lg">

          {loading ? (

            <div className="p-16 text-center">

              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#08b8d4]" />

              <p className="mt-4 text-sm font-semibold text-slate-500">
                Loading all your files...
              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1200px]">

                <thead className="bg-[#f7fafc]">

                  <tr className="text-left text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">

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


                <tbody>

                  {filteredFiles.map(
                    (file) => (

                      <tr
                        key={file.id}
                        className="border-t border-slate-100 transition hover:bg-[#f8fcfd]"
                      >

                        {/* FILE ID */}

                        <td className="px-6 py-5">

                          <span className="text-xs font-black text-[#073b4c]">
                           {file.file_code || file.id}
                          </span>

                        </td>


                        {/* CUSTOMER */}

                        <td className="px-6 py-5">

                          <p className="font-bold text-slate-800">
                            {file.customer_name}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {file.mobile}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {file.city}
                          </p>

                        </td>


                        {/* LOAN */}

                        <td className="px-6 py-5">

                          <p className="font-semibold text-slate-700">
                            {file.loan_type}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {money(
                              file.loan_amount
                            )}
                          </p>

                        </td>


                        {/* STATUS */}

                        <td className="px-6 py-5">

                          <span
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-black ${statusClass(
                              file.status
                            )}`}
                          >

                            <span className="h-1.5 w-1.5 rounded-full bg-current" />

                            {file.status}

                          </span>

                        </td>


                        {/* UPDATE */}

                        <td className="max-w-[280px] px-6 py-5">

                          <p className="line-clamp-2 text-sm leading-5 text-slate-600">
                            {file.update_text ||
                              "No update available yet."}
                          </p>

                        </td>


                        {/* COMMISSION */}

                        <td className="px-6 py-5">

                          {file.status ===
                          "Disbursed" ? (

                            <>

                              <p className="font-black text-green-600">
                                {money(
                                  commissionAmount(
                                    file
                                  )
                                )}
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                {Number(
                                  file.commission_rate ||
                                    0
                                ).toFixed(2)}
                                %
                              </p>

                            </>

                          ) : (

                            <span className="text-slate-400">
                              —
                            </span>

                          )}

                        </td>


                        {/* DATE */}

                        <td className="px-6 py-5 text-xs font-medium text-slate-500">

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

                        <td className="px-6 py-5">

                          <button
                            onClick={() =>
                              setSelectedFile(
                                file
                              )
                            }
                            className="whitespace-nowrap rounded-xl bg-[#08b8d4] px-4 py-2.5 text-[11px] font-black text-white transition hover:bg-[#079eb7]"
                          >
                            View File
                          </button>

                        </td>

                      </tr>

                    )
                  )}


                  {/* NO RESULTS */}

                  {filteredFiles.length ===
                    0 && (

                    <tr>

                      <td
                        colSpan={8}
                        className="px-6 py-16 text-center"
                      >

                        <div className="text-4xl">
                          🔎
                        </div>

                        <p className="mt-3 font-bold text-slate-700">
                          No files found
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Try changing your search or status filter.
                        </p>

                      </td>

                    </tr>

                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </section>


      {/* =====================================================
          FILE DETAILS MODAL
          ===================================================== */}

      {selectedFile && (

        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#050b20]/80 p-3 backdrop-blur-md sm:p-5"
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
            className="max-h-[94vh] w-full max-w-4xl overflow-hidden rounded-[28px] bg-white shadow-2xl"
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between bg-[#062536] px-6 py-5 text-white">

              <div>

                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#08b8d4]">
                  LOAN FILE DETAILS
                </p>

                <h2 className="mt-1 text-xl font-black">
                  {selectedFile.customer_name}
                </h2>

                <p className="mt-1 text-xs text-white/50">
  File ID:{" "}
  {selectedFile.file_code || selectedFile.id}
</p>

              </div>


              <button
                onClick={() =>
                  setSelectedFile(null)
                }
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-2xl transition hover:bg-white hover:text-[#062536]"
              >
                ×
              </button>

            </div>


            {/* MODAL BODY */}

            <div className="max-h-[calc(94vh-90px)] overflow-y-auto p-6">


              {/* STATUS + AMOUNT */}

              <div className="grid gap-4 md:grid-cols-3">

                <div className="rounded-2xl bg-slate-50 p-5">

                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    STATUS
                  </p>

                  <span
                    className={`mt-3 inline-flex rounded-full border px-4 py-2 text-xs font-black ${statusClass(
                      selectedFile.status
                    )}`}
                  >
                    {selectedFile.status}
                  </span>

                </div>


                <div className="rounded-2xl bg-slate-50 p-5">

                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    LOAN AMOUNT
                  </p>

                  <p className="mt-3 text-2xl font-black text-[#062536]">
                    {money(
                      selectedFile.loan_amount
                    )}
                  </p>

                </div>


                <div className="rounded-2xl border border-green-100 bg-green-50 p-5">

                  <p className="text-[10px] font-black uppercase tracking-widest text-green-600">
                    COMMISSION
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

                </div>

              </div>


              {/* DETAILS */}

              <div className="mt-6">

                <h3 className="text-base font-black text-[#062536]">
                  Customer Information
                </h3>

                <div className="mt-3 grid gap-4 md:grid-cols-2">

                  <Detail
                    label="Customer Name"
                    value={
                      selectedFile.customer_name
                    }
                  />

                  <Detail
                    label="Mobile"
                    value={
                      selectedFile.mobile
                    }
                  />

                  <Detail
                    label="Email"
                    value={
                      selectedFile.email ||
                      "Not provided"
                    }
                  />

                  <Detail
                    label="City"
                    value={
                      selectedFile.city
                    }
                  />

                  <Detail
                    label="Loan Type"
                    value={
                      selectedFile.loan_type
                    }
                  />

                  <Detail
                    label="Employment"
                    value={
                      selectedFile.employment
                    }
                  />

                  <Detail
                    label="Monthly Income"
                    value={money(
                      selectedFile.monthly_income
                    )}
                  />

                  <Detail
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


              {/* UPDATE */}

              <div className="mt-6">

                <h3 className="text-base font-black text-[#062536]">
                  Latest Update
                </h3>

                <div className="mt-3 rounded-2xl border border-cyan-100 bg-cyan-50 p-5">

                  <p className="text-sm leading-6 text-slate-600">
                    {selectedFile.update_text ||
                      "No update available yet."}
                  </p>

                </div>

              </div>


              {/* REMARKS */}

              <div className="mt-6">

                <h3 className="text-base font-black text-[#062536]">
                  Remarks
                </h3>

                <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">

                  {selectedFile.remarks ||
                    "No remarks provided."}

                </div>

              </div>

              {/* ADDITIONAL DOCUMENTS */}
<div className="mt-6">
  <h3 className="text-base font-black text-[#062536]">
    Send Additional Document
  </h3>

  <p className="mt-1 text-sm leading-6 text-slate-500">
    If any additional document is required, send it to LoanKarts anytime.
    Your File ID and Connector ID will be included automatically.
  </p>

  <div className="mt-4 grid gap-4 md:grid-cols-2">

    {/* EMAIL */}
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-start gap-4">

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm ring-1 ring-slate-200">
          ✉
        </div>

        <div className="min-w-0 flex-1">

          <h4 className="text-base font-black text-[#073b4c]">
            Send by Email
          </h4>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            Attach your additional document and send it directly to LoanKarts.
          </p>

          <div className="mt-4 space-y-1">
            <p className="text-xs font-semibold text-slate-600">
              File ID:{" "}
              <span className="font-black text-[#073b4c]">
                {selectedFile.file_code || selectedFile.id}
              </span>
            </p>

            <p className="text-xs font-semibold text-slate-600">
              Connector ID:{" "}
              <span className="font-black text-[#073b4c]">
                {connectorCode || "Available"}
              </span>
            </p>
          </div>

          <a
            href={`mailto:backend.loankarts@gmail.com?subject=${encodeURIComponent(
              `Additional Document - ${selectedFile.file_code || selectedFile.id}`
            )}&body=${encodeURIComponent(
              `Hello LoanKarts Team,

I am sending an additional document for my loan file.

File ID: ${selectedFile.file_code || selectedFile.id}

Connector ID: ${connectorCode || "Available"}

Customer Name: ${selectedFile.customer_name}

Please find the additional document attached.

Regards`
            )}`}
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-[#073b4c] px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#062f3e]"
          >
            Email Additional Document →
          </a>

        </div>
      </div>
    </div>


    {/* WHATSAPP */}
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
      <div className="flex items-start gap-4">

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-black text-green-600 shadow-sm ring-1 ring-emerald-200">
          WA
        </div>

        <div className="min-w-0 flex-1">

          <h4 className="text-base font-black text-[#073b4c]">
            Send by WhatsApp
          </h4>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            Send the additional document directly to LoanKarts WhatsApp.
          </p>

          <div className="mt-4 space-y-1">
            <p className="text-xs font-semibold text-slate-600">
              File ID:{" "}
              <span className="font-black text-[#073b4c]">
                {selectedFile.file_code || selectedFile.id}
              </span>
            </p>

            <p className="text-xs font-semibold text-slate-600">
              Connector ID:{" "}
              <span className="font-black text-[#073b4c]">
                {connectorCode || "Available"}
              </span>
            </p>
          </div>

          <a
            href={`https://wa.me/9990954351?text=${encodeURIComponent(
              `Hello LoanKarts Team,

I am sending an additional document for my loan file.

File ID: ${selectedFile.file_code || selectedFile.id}

Connector ID: ${connectorCode || "Available"}

Customer Name: ${selectedFile.customer_name}

Please find the additional document attached.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-[#16a34a] px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#15803d]"
          >
            WhatsApp Additional Document →
          </a>

        </div>
      </div>
    </div>

  </div>

  <div className="mt-4 rounded-xl border border-cyan-100 bg-cyan-50 p-4 text-xs leading-5 text-[#07556a]">
    <strong>Important:</strong> Always attach the document and make sure the
    File ID and Connector ID are correct before sending.
  </div>
</div>

              {/* CLOSE */}

              <div className="mt-7 flex justify-end border-t border-slate-100 pt-5">

                <button
                  onClick={() =>
                    setSelectedFile(null)
                  }
                  className="rounded-xl bg-[#062536] px-6 py-3 text-sm font-black text-white hover:bg-[#0b5269]"
                >
                  Close
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
   DETAIL COMPONENT
   ========================================================= */

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (

    <div className="rounded-2xl border border-slate-200 bg-white p-4">

      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
        {label}
      </p>

      <p className="mt-2 break-words font-bold text-[#062536]">
        {value}
      </p>

    </div>

  );
}