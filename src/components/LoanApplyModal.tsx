"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type LoanApplyModalProps = {
  loanTitle: string;
  open: boolean;
  onClose: () => void;
};

export default function LoanApplyModal({
  loanTitle,
  open,
  onClose,
}: LoanApplyModalProps) {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [employment, setEmployment] = useState("");
  const [details, setDetails] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !sending) onClose();
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose, sending]);

  useEffect(() => {
    if (!open) {
      setMessage("");
      setSuccess(false);
    }
  }, [open]);

  if (!open) return null;

  async function submitApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSuccess(false);

    const cleanMobile = mobile.replace(/\D/g, "");

    if (!name.trim() || cleanMobile.length !== 10 || !amount.trim() || !employment) {
      setMessage("Please fill all required fields and enter a valid 10-digit mobile number.");
      return;
    }

    const amountNumber = Number(amount.replace(/[^0-9.]/g, ""));

    if (!amountNumber || amountNumber <= 0) {
      setMessage("Please enter a valid loan amount.");
      return;
    }

    setSending(true);

    const { error } = await supabase.from("customer_applications").insert({
      customer_name: name.trim(),
      mobile: cleanMobile,
      email: email.trim() || null,
      loan_type: loanTitle,
      loan_amount: amountNumber,
      employment,
      remarks: details.trim() || null,
      status: "New",
    });

    if (error) {
      console.error("Loan application error:", error);
      setMessage("Unable to submit your application right now. Please try again.");
      setSending(false);
      return;
    }

    setName("");
    setMobile("");
    setEmail("");
    setAmount("");
    setEmployment("");
    setDetails("");
    setSuccess(true);
    setSending(false);
  }

  const inputClass =
    "h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-[13px] font-medium text-[#073b4c] outline-none transition placeholder:text-slate-400 focus:border-[#08b8d4] focus:ring-4 focus:ring-[#08b8d4]/10";

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#031a25]/70 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !sending) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="loan-apply-title"
        className="relative max-h-[92vh] w-full max-w-[760px] overflow-y-auto rounded-[28px] border border-white/60 bg-white shadow-[0_30px_90px_rgba(3,26,37,.30)]"
      >
        {/* HEADER */}
        <div className="relative overflow-hidden bg-[#082f42] px-6 py-6 text-white sm:px-8 sm:py-7">
          <div className="absolute -right-20 -top-24 h-60 w-60 rounded-full bg-[#08c4dc]/15 blur-3xl" />
          <div className="absolute -bottom-28 left-1/3 h-52 w-52 rounded-full bg-[#08c4dc]/10 blur-3xl" />

          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            aria-label="Close application form"
            className="absolute right-5 top-5 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-lg font-light text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ×
          </button>

          <div className="relative z-10 pr-12">
            <p className="text-[9px] font-black uppercase tracking-[.22em] text-[#16c6dc]">
              QUICK APPLICATION
            </p>

            <h2
              id="loan-apply-title"
              className="mt-2 text-[27px] font-black leading-tight sm:text-[34px]"
            >
              Tell us what you need
            </h2>

            <p className="mt-2 text-[12px] leading-5 text-white/65 sm:text-[13px]">
              Apply for <span className="font-black text-white">{loanTitle}</span>. Basic details are enough to get started.
            </p>
          </div>
        </div>

        {/* FORM */}
        <form onSubmit={submitApplication} className="p-5 sm:p-7">
          {success ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center sm:p-8">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl font-black text-emerald-600">
                ✓
              </div>
              <p className="mt-4 text-[9px] font-black uppercase tracking-[.22em] text-emerald-600">
                APPLICATION SUBMITTED
              </p>
              <h3 className="mt-2 text-2xl font-black text-[#073b4c]">
                Thank you!
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Your {loanTitle} enquiry has been securely submitted to LoanKarts. Our team will contact you shortly.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-6 rounded-xl bg-[#073b4c] px-6 py-3 text-sm font-black text-white transition hover:bg-[#0b5269]"
              >
                DONE
              </button>
            </div>
          ) : (
            <>
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[.22em] text-[#08aeca]">
                    YOUR DETAILS
                  </p>
                  <h3 className="mt-1 text-xl font-black text-[#073b4c]">
                    Loan Application
                  </h3>
                </div>
                <div className="hidden rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1.5 text-[9px] font-black text-[#078fa8] sm:block">
                  {loanTitle}
                </div>
              </div>

              {message && (
                <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold leading-5 text-rose-600">
                  {message}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-[10px] font-black uppercase tracking-wide text-[#073b4c]">
                  Full Name *
                  <input
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Enter your full name"
                    className={`mt-2 ${inputClass}`}
                  />
                </label>

                <label className="text-[10px] font-black uppercase tracking-wide text-[#073b4c]">
                  Mobile Number *
                  <input
                    required
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                    maxLength={10}
                    value={mobile}
                    onChange={(event) =>
                      setMobile(event.target.value.replace(/\D/g, "").slice(0, 10))
                    }
                    placeholder="10-digit mobile number"
                    className={`mt-2 ${inputClass}`}
                  />
                </label>

                <label className="text-[10px] font-black uppercase tracking-wide text-[#073b4c]">
                  Email Address
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className={`mt-2 ${inputClass}`}
                  />
                </label>

                <label className="text-[10px] font-black uppercase tracking-wide text-[#073b4c]">
                  Loan Amount Required *
                  <input
                    required
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    placeholder="e.g. ₹25,00,000"
                    className={`mt-2 ${inputClass}`}
                  />
                </label>

                <label className="text-[10px] font-black uppercase tracking-wide text-[#073b4c]">
                  Employment / Business Type *
                  <select
                    required
                    value={employment}
                    onChange={(event) => setEmployment(event.target.value)}
                    className={`mt-2 ${inputClass} cursor-pointer`}
                  >
                    <option value="">Select type</option>
                    <option value="Salaried">Salaried</option>
                    <option value="Self Employed">Self Employed</option>
                    <option value="Business Owner">Business Owner</option>
                    <option value="Professional">Professional</option>
                    <option value="Other">Other</option>
                  </select>
                </label>

                <div className="hidden sm:block" />
              </div>

              <label className="mt-4 block text-[10px] font-black uppercase tracking-wide text-[#073b4c]">
                Additional Details
                <textarea
                  rows={4}
                  value={details}
                  onChange={(event) => setDetails(event.target.value)}
                  placeholder="Purpose of loan, business turnover, property details, vehicle type, or any other useful information..."
                  className="mt-2 w-full resize-none rounded-lg border border-slate-300 px-4 py-3 text-[13px] font-medium text-[#073b4c] outline-none transition placeholder:text-slate-400 focus:border-[#08b8d4] focus:ring-4 focus:ring-[#08b8d4]/10"
                />
              </label>

              <div className="mt-5 flex items-start gap-3 rounded-xl border border-[#bcecf2] bg-[#effbfd] p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#08b8d4]/10 text-sm font-black text-[#08aeca]">
                  ✓
                </div>
                <div>
                  <p className="text-[10px] font-black text-[#07566a]">
                    Secure Application
                  </p>
                  <p className="mt-1 text-[10px] leading-5 text-[#4b7180]">
                    Your application will be securely saved in the LoanKarts admin dashboard. Our team will review it and contact you.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={sending}
                className="mt-5 flex h-13 w-full items-center justify-center rounded-xl bg-[#08b8d4] px-5 py-4 text-[12px] font-black tracking-wide text-white shadow-lg shadow-cyan-500/15 transition hover:-translate-y-0.5 hover:bg-[#079fb8] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {sending ? "SUBMITTING APPLICATION..." : "SUBMIT APPLICATION →"}
              </button>

              <p className="mt-3 text-center text-[9px] leading-5 text-slate-400">
                Loan approval, interest rate, fees and documentation are subject to the respective lender&apos;s eligibility criteria.
              </p>
            </>
          )}
        </form>
      </div>
    </div>
  );
}