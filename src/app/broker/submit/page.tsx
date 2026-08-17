"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Documents = {
  aadhaarFront: File | null;
  aadhaarBack: File | null;
  pan: File | null;
  bankStatement: File | null;
  itr: File | null;
  salarySlip: File | null;
  gst: File | null;
  other: File | null;
};

type FormData = {
  customerName: string;
  mobile: string;
  email: string;
  loanType: string;
  loanAmount: string;
  city: string;
  employment: string;
  monthlyIncome: string;
  monthlyTurnover: string;
  monthlyProfit: string;
  remarks: string;
};

const loanOptions = [
  { name: "Personal Loan", rate: 1.6 },
  { name: "Business Loan", rate: 1.2 },
  { name: "Home Loan", rate: 0.45 },
  { name: "LAP", rate: 0.6 },
  { name: "USED Car Loan", rate: 1.5 },
  { name: "New Car Loan", rate: 0.5 },
];

function money(value: number) {
  return `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

export default function SubmitNewFilePage() {
  const [documents, setDocuments] = useState<Documents>({
    aadhaarFront: null,
    aadhaarBack: null,
    pan: null,
    bankStatement: null,
    itr: null,
    salarySlip: null,
    gst: null,
    other: null,
  });

  const [form, setForm] = useState<FormData>({
    customerName: "",
    mobile: "",
    email: "",
    loanType: "Personal Loan",
    loanAmount: "",
    city: "",
    employment: "Salaried",
    monthlyIncome: "",
    monthlyTurnover: "",
    monthlyProfit: "",
    remarks: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const selectedLoan = useMemo(
    () =>
      loanOptions.find((loan) => loan.name === form.loanType) ||
      loanOptions[0],
    [form.loanType]
  );

  const estimatedCommission =
    Number(form.loanAmount || 0) * (selectedLoan.rate / 100);

  function handleInputChange(
    e: ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setSuccessMessage("");
    setErrorMessage("");
  }

  function handleFileChange(
    e: ChangeEvent<HTMLInputElement>,
    documentName: keyof Documents
  ) {
    const file = e.target.files?.[0] || null;

    if (!file) return;

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert("Only PDF, JPG, JPEG or PNG files are allowed.");
      e.target.value = "";
      return;
    }

    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {
      alert("Maximum file size is 10 MB.");
      e.target.value = "";
      return;
    }

    setDocuments((previous) => ({
      ...previous,
      [documentName]: file,
    }));

    setErrorMessage("");
  }

  function removeFile(documentName: keyof Documents) {
    setDocuments((previous) => ({
      ...previous,
      [documentName]: null,
    }));
  }

  async function uploadDocument(
    file: File,
    fileType: string,
    fileId: string,
    userId: string
  ) {
    const extension =
      file.name.split(".").pop()?.toLowerCase() || "file";

    const safeCustomerName =
      form.customerName
        .trim()
        .replace(/[^a-zA-Z0-9]/g, "-")
        .replace(/-+/g, "-")
        .toLowerCase() || "customer";

    const filePath =
      `${userId}/${fileId}/${safeCustomerName}/${fileType}.${extension}`;

    const { error } = await supabase.storage
      .from("loan-documents")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      throw new Error(`${fileType} upload failed: ${error.message}`);
    }

    return filePath;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (submitting) return;

    setSubmitting(true);
    setSuccessMessage("");
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

      const customerName = form.customerName.trim();
      const city = form.city.trim();
      const email = form.email.trim();
      const loanAmount = Number(form.loanAmount);
      const monthlyIncome =
        form.monthlyIncome ? Number(form.monthlyIncome) : null;

      const monthlyTurnover =
        form.monthlyTurnover ? Number(form.monthlyTurnover) : null;

      const monthlyProfit =
        form.monthlyProfit ? Number(form.monthlyProfit) : null;

      if (!customerName) {
        throw new Error("Customer name is required.");
      }

      if (!/^[0-9]{10}$/.test(form.mobile)) {
        throw new Error("Please enter a valid 10 digit mobile number.");
      }

      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Please enter a valid customer email.");
      }

      if (!city) {
        throw new Error("City is required.");
      }

      if (!Number.isFinite(loanAmount) || loanAmount <= 0) {
        throw new Error("Please enter a valid loan amount.");
      }

      if (form.employment === "Salaried") {
        if (
          monthlyIncome === null ||
          !Number.isFinite(monthlyIncome) ||
          monthlyIncome < 0
        ) {
          throw new Error("Please enter a valid monthly salary / income.");
        }
      }

      if (form.employment === "Business Owner") {
        if (
          monthlyTurnover === null ||
          !Number.isFinite(monthlyTurnover) ||
          monthlyTurnover < 0
        ) {
          throw new Error("Please enter a valid monthly business turnover.");
        }

        if (
          monthlyProfit === null ||
          !Number.isFinite(monthlyProfit) ||
          monthlyProfit < 0
        ) {
          throw new Error("Please enter a valid monthly net profit / income.");
        }
      }

      if (
        form.employment === "Self Employed" ||
        form.employment === "Professional"
      ) {
        if (
          monthlyIncome === null ||
          !Number.isFinite(monthlyIncome) ||
          monthlyIncome < 0
        ) {
          throw new Error("Please enter a valid average monthly income.");
        }
      }

      if (!documents.aadhaarFront) {
        throw new Error("Aadhaar Front is required.");
      }

      if (!documents.aadhaarBack) {
        throw new Error("Aadhaar Back is required.");
      }

      if (!documents.pan) {
        throw new Error("PAN Card is required.");
      }

      if (!documents.bankStatement) {
        throw new Error("Bank Statement is required.");
      }

      const fileId = `LK-${Date.now()}`;

      const documentPaths: {
        aadhaarFront?: string;
        aadhaarBack?: string;
        pan?: string;
        bankStatement?: string;
        itr?: string;
        salarySlip?: string;
        gst?: string;
        other?: string;
      } = {};

      if (documents.aadhaarFront) {
        documentPaths.aadhaarFront = await uploadDocument(
          documents.aadhaarFront,
          "aadhaar-front",
          fileId,
          user.id
        );
      }

      if (documents.aadhaarBack) {
        documentPaths.aadhaarBack = await uploadDocument(
          documents.aadhaarBack,
          "aadhaar-back",
          fileId,
          user.id
        );
      }

      if (documents.pan) {
        documentPaths.pan = await uploadDocument(
          documents.pan,
          "pan",
          fileId,
          user.id
        );
      }

      if (documents.bankStatement) {
        documentPaths.bankStatement = await uploadDocument(
          documents.bankStatement,
          "bank-statement",
          fileId,
          user.id
        );
      }

      if (documents.itr) {
        documentPaths.itr = await uploadDocument(
          documents.itr,
          "itr",
          fileId,
          user.id
        );
      }

      if (documents.salarySlip) {
        documentPaths.salarySlip = await uploadDocument(
          documents.salarySlip,
          "salary-slip",
          fileId,
          user.id
        );
      }

      if (documents.gst) {
        documentPaths.gst = await uploadDocument(
          documents.gst,
          "gst",
          fileId,
          user.id
        );
      }

      if (documents.other) {
        documentPaths.other = await uploadDocument(
          documents.other,
          "other",
          fileId,
          user.id
        );
      }

      const { error: databaseError } = await supabase
        .from("loan_files")
        .insert({
          customer_name: customerName,
          mobile: form.mobile,
          email: email || null,
          loan_type: form.loanType,
          loan_amount: loanAmount,
          city,
          employment: form.employment,
          monthly_income: monthlyIncome,
          monthly_turnover: monthlyTurnover,
          monthly_profit: monthlyProfit,
          remarks: form.remarks.trim() || null,
          status: "Submitted",
          update_text: "New loan file submitted successfully.",
          broker_name:
            String(user.user_metadata?.full_name || user.email || "Connector Partner").trim(),
          broker_id: user.id,
          document_paths: documentPaths,
        });

      if (databaseError) {
        throw new Error(`Database error: ${databaseError.message}`);
      }

      setSuccessMessage(
        `Loan file ${fileId} submitted successfully.`
      );

      setForm({
        customerName: "",
        mobile: "",
        email: "",
        loanType: "Personal Loan",
        loanAmount: "",
        city: "",
        employment: "Salaried",
        monthlyIncome: "",
        monthlyTurnover: "",
        monthlyProfit: "",
        remarks: "",
      });

      setDocuments({
        aadhaarFront: null,
        aadhaarBack: null,
        pan: null,
        bankStatement: null,
        itr: null,
        salarySlip: null,
        gst: null,
        other: null,
      });

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      console.error(error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while submitting the file."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function DocumentUpload({
    title,
    documentName,
    required = false,
  }: {
    title: string;
    documentName: keyof Documents;
    required?: boolean;
  }) {
    const file = documents[documentName];

    return (
      <div className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_25px_rgba(15,53,68,0.05)] transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-[0_12px_30px_rgba(15,53,68,0.08)]">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-black text-[#0b3b53]">
              {title}{" "}
              {required && (
                <span className="text-red-500">*</span>
              )}
            </h3>

            <p className="mt-1 text-[11px] leading-4 text-slate-500">
              PDF, JPG, JPEG or PNG • Max 10 MB
            </p>
          </div>

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-xs font-black text-[#08a9c6]">DOC</div>
        </div>

        {file ? (
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-700">
                  {file.name}
                </p>

                <p className="mt-1 text-[11px] leading-4 text-slate-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>

              <button
                type="button"
                onClick={() => removeFile(documentName)}
                className="shrink-0 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-6 text-center transition hover:border-[#10b7d3] hover:bg-cyan-50">
            <div>
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sm font-black text-[#08a9c6] shadow-sm ring-1 ring-slate-200">↑</div>

              <p className="mt-2 text-sm font-black text-[#0b3b53]">
                Choose Document
              </p>

              <p className="mt-1 text-[11px] leading-4 text-slate-500">
                Click to select file
              </p>
            </div>

            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(e) =>
                handleFileChange(e, documentName)
              }
            />
          </label>
        )}
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f8fb] text-slate-800">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#071f2a]/95 text-white shadow-[0_10px_30px_rgba(3,25,35,0.18)] backdrop-blur-md">
        <div className="mx-auto flex min-h-[68px] max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center">
            <div className="flex h-10 w-[155px] shrink-0 items-center sm:h-11 sm:w-[180px]">
              <img
                src="/loankarts-logo-white.png"
                alt="LoanKarts"
                style={{
                  width: "180px",
                  height: "44px",
                  maxWidth: "180px",
                  objectFit: "contain",
                  objectPosition: "left center",
                  display: "block",
                }}
              />
            </div>
            <div className="ml-3 hidden border-l border-white/15 pl-3 sm:block">
              <p className="text-[9px] font-black uppercase tracking-[0.24em] text-[#10b7d3]">Partner Portal</p>
              <p className="mt-0.5 text-xs font-semibold text-white/75">Loan File Submission</p>
            </div>
          </div>

          <a
            href="/broker"
            className="rounded-lg border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-bold text-white transition hover:border-[#10b7d3] hover:bg-[#10b7d3] sm:px-4 sm:py-2.5"
          >
            ← Back to Dashboard
          </a>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 pb-4 pt-7 sm:px-6 sm:pt-8">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#08a9c6]">
          New Loan File
        </p>

        <h2 className="mt-1.5 text-2xl font-black tracking-tight text-[#073b4c] sm:text-3xl">
          Submit New File
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
          Enter customer details and upload the required
          documents to submit a new loan application to LoanKarts.
        </p>
      </section>

      {successMessage && (
        <div className="mx-auto mb-6 max-w-7xl px-4 sm:px-6">
          <div className="rounded-2xl border border-emerald-200 bg-white p-5 text-emerald-800 shadow-sm">
            <p className="font-bold">✅ {successMessage}</p>
            <p className="mt-1 text-sm">
              The application has been saved and submitted for review.
            </p>

            <a
              href="/broker"
              className="mt-4 inline-block rounded-xl bg-green-600 px-5 py-2.5 text-sm font-bold text-white"
            >
              View My Files
            </a>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="mx-auto mb-6 max-w-7xl px-4 sm:px-6">
          <div className="rounded-2xl border border-red-200 bg-white p-5 text-red-800 shadow-sm">
            <p className="font-bold">❌ Submission failed</p>
            <p className="mt-1 text-sm">{errorMessage}</p>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-7xl space-y-5 px-4 pb-16 sm:space-y-6 sm:px-6"
      >
        {/* CUSTOMER */}
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(15,53,68,0.055)] sm:p-7">
          <div className="mb-4 border-b border-slate-100 pb-3">
            <div className="mb-2 h-1 w-10 rounded-full bg-[#10b7d3]" />
            <h3 className="text-base font-black tracking-tight text-[#073b4c] sm:text-lg">
              1. Customer Details
            </h3>
            <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
              Enter the basic information of the customer.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Customer Name *"
              name="customerName"
              value={form.customerName}
              onChange={handleInputChange}
              placeholder="Enter customer full name"
              required
            />

            <Field
              label="Mobile Number *"
              name="mobile"
              value={form.mobile}
              onChange={handleInputChange}
              placeholder="10 digit mobile number"
              required
              maxLength={10}
              inputMode="numeric"
            />

            <Field
              label="Email"
              name="email"
              value={form.email}
              onChange={handleInputChange}
              placeholder="customer@email.com"
              type="email"
            />

            <Field
              label="City *"
              name="city"
              value={form.city}
              onChange={handleInputChange}
              placeholder="Enter city"
              required
            />
          </div>
        </section>

        {/* LOAN */}
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(15,53,68,0.055)] sm:p-7">
          <div className="mb-4 border-b border-slate-100 pb-3">
            <div className="mb-2 h-1 w-10 rounded-full bg-[#10b7d3]" />
            <h3 className="text-base font-black tracking-tight text-[#073b4c] sm:text-lg">
              2. Loan Details
            </h3>
            <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
              Select the loan type, employment type and enter the requested amount.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">
                Loan Type *
              </label>

              <select
                required
                name="loanType"
                value={form.loanType}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#10b7d3] focus:bg-white focus:ring-4 focus:ring-cyan-50"
              >
                {loanOptions.map((loan) => (
                  <option key={loan.name} value={loan.name}>
                    {loan.name} — {loan.rate}%
                  </option>
                ))}
              </select>
            </div>

            <Field
              label="Required Loan Amount *"
              name="loanAmount"
              value={form.loanAmount}
              onChange={handleInputChange}
              placeholder="Enter amount"
              type="number"
              min="1"
              required
              inputMode="numeric"
            />

            <div className="md:col-span-2">
              <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">
                Employment Type *
              </label>

              <select
                required
                name="employment"
                value={form.employment}
                onChange={(e) => {
                  handleInputChange(e);

                  setForm((previous) => ({
                    ...previous,
                    monthlyIncome: "",
                    monthlyTurnover: "",
                    monthlyProfit: "",
                  }));
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#10b7d3] focus:bg-white focus:ring-4 focus:ring-cyan-50"
              >
                <option value="Salaried">Salaried</option>
                <option value="Business Owner">Business Owner</option>
                <option value="Self Employed">Self Employed</option>
                <option value="Professional">Professional</option>
              </select>
            </div>

            {form.employment === "Salaried" && (
              <Field
                label="Monthly Salary / Income *"
                name="monthlyIncome"
                value={form.monthlyIncome}
                onChange={handleInputChange}
                placeholder="₹ Enter monthly salary"
                type="number"
                min="0"
                required
                inputMode="numeric"
              />
            )}

            {form.employment === "Business Owner" && (
              <>
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">
                    Average Monthly Business Turnover *
                  </label>

                  <input
                    required
                    type="number"
                    min="0"
                    name="monthlyTurnover"
                    value={form.monthlyTurnover}
                    onChange={handleInputChange}
                    placeholder="₹ Example: 500000"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#10b7d3] focus:bg-white focus:ring-4 focus:ring-cyan-50"
                  />

                  <p className="mt-1 text-[11px] leading-4 text-slate-500">
                    Approximate average monthly sales / turnover.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">
                    Approx. Monthly Net Profit / Income *
                  </label>

                  <input
                    required
                    type="number"
                    min="0"
                    name="monthlyProfit"
                    value={form.monthlyProfit}
                    onChange={handleInputChange}
                    placeholder="₹ Example: 80000"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#10b7d3] focus:bg-white focus:ring-4 focus:ring-cyan-50"
                  />

                  <p className="mt-1 text-[11px] leading-4 text-slate-500">
                    Approximate income/profit after regular business expenses.
                  </p>
                </div>
              </>
            )}

            {(form.employment === "Self Employed" ||
              form.employment === "Professional") && (
              <Field
                label="Average Monthly Income *"
                name="monthlyIncome"
                value={form.monthlyIncome}
                onChange={handleInputChange}
                placeholder="₹ Enter average monthly income"
                type="number"
                min="0"
                required
                inputMode="numeric"
              />
            )}
          </div>

          <div className="mt-5 rounded-2xl border border-cyan-100 bg-gradient-to-r from-cyan-50 to-slate-50 p-5">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-bold text-[#073b4c]">
                  Connector Commission Rate
                </p>
                <p className="mt-1 text-2xl font-black text-[#073b4c]">
                  {selectedLoan.rate}%
                </p>
              </div>

              <div className="sm:text-right">
                <p className="text-sm font-bold text-slate-600">
                  Estimated Commission
                </p>
                <p className="mt-1 text-xl font-black text-emerald-600">
                  {money(estimatedCommission)}
                </p>
                <p className="mt-1 text-[11px] leading-4 text-slate-500">
                  Commission is payable when the loan is Disbursed.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* DOCUMENTS */}
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(15,53,68,0.055)] sm:p-7">
          <div className="mb-4 border-b border-slate-100 pb-3">
            <div className="mb-2 h-1 w-10 rounded-full bg-[#10b7d3]" />
            <h3 className="text-base font-black tracking-tight text-[#073b4c] sm:text-lg">
              3. Customer Documents
            </h3>

            <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
              Upload clear copies of the customer's documents.
            </p>

            <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-800">
              🔒 Documents should only be uploaded with the customer's
              authorization.
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <DocumentUpload
              title="Aadhaar Card - Front"
              documentName="aadhaarFront"
              required
            />

            <DocumentUpload
              title="Aadhaar Card - Back"
              documentName="aadhaarBack"
              required
            />

            <DocumentUpload
              title="PAN Card"
              documentName="pan"
              required
            />

            <DocumentUpload
              title="Bank Statement"
              documentName="bankStatement"
              required
            />

            <DocumentUpload
              title="ITR"
              documentName="itr"
            />

            <DocumentUpload
              title="Salary Slip"
              documentName="salarySlip"
            />

            <DocumentUpload
              title="GST Certificate"
              documentName="gst"
            />

            <DocumentUpload
              title="Other Document"
              documentName="other"
            />
          </div>
        </section>

        {/* REMARKS */}
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(15,53,68,0.055)] sm:p-7">
          <div className="mb-5">
            <div className="mb-2 h-1 w-10 rounded-full bg-[#10b7d3]" />
            <h3 className="text-base font-black tracking-tight text-[#073b4c] sm:text-lg">
              4. Additional Information
            </h3>

            <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
              Add any important information about this customer or file.
            </p>
          </div>

          <textarea
            name="remarks"
            value={form.remarks}
            onChange={handleInputChange}
            rows={5}
            placeholder="Write remarks, existing loan details, special requirements, etc."
            className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#10b7d3] focus:ring-2 focus:ring-cyan-100"
          />
        </section>

        {/* SUBMIT */}
        <section className="flex flex-col items-stretch justify-between gap-4 rounded-2xl bg-[#062f3e] p-5 text-white shadow-[0_16px_35px_rgba(4,42,57,0.16)] sm:p-6 md:flex-row md:items-center">
          <div>
            <h3 className="text-xl font-black">
              Ready to submit this file?
            </h3>

            <p className="mt-1 text-sm leading-6 text-slate-300">
              Please check all customer details and documents before submitting.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full shrink-0 rounded-xl bg-[#10b7d3] px-7 py-3.5 text-sm font-black text-white shadow-[0_10px_25px_rgba(16,183,211,0.25)] transition hover:-translate-y-0.5 hover:bg-[#0da8c1] disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
          >
            {submitting ? "SUBMITTING..." : "SUBMIT LOAN FILE →"}
          </button>
        </section>
      </form>
    </main>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  maxLength,
  min,
  inputMode,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
  placeholder: string;
  type?: string;
  required?: boolean;
  maxLength?: number;
  min?: string;
  inputMode?: "text" | "numeric" | "decimal" | "tel" | "email";
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">
        {label}
      </label>

      <input
        required={required}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxLength}
        min={min}
        inputMode={inputMode}
        className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#10b7d3] focus:ring-2 focus:ring-cyan-100"
      />
    </div>
  );
}