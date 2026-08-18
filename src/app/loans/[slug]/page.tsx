"use client";

import Link from "next/link";
import { use, useState } from "react";
import LoanApplyModal from "@/components/LoanApplyModal";

const LOANS: Record<string, {
  title: string;
  short: string;
  range: string;
  overview: string;
  benefits: string[];
  documents: string[];
  eligibility: string[];
  subProducts?: string[];
}> = {
  "personal-loan": {
    title: "Personal Loan",
    short: "Quick personal finance solutions for planned or urgent requirements.",
    range: "Typical range: ₹50,000 – ₹50 Lakh",
    overview: "Personal Loan is generally an unsecured loan for eligible personal financial requirements. Final approval, pricing and tenure depend on the lender and applicant profile.",
    benefits: ["No property collateral in most cases", "Flexible end-use", "Simple application process", "Fixed monthly EMI repayment"],
    documents: ["PAN Card", "Aadhaar / address proof", "Latest 3–6 months bank statements", "Salary slips / income proof", "ITR / financial documents where applicable", "Photograph if required"],
    eligibility: ["Stable income and repayment capacity", "Acceptable credit history", "Age and employment/business profile as per lender", "Documents satisfactory to lender"]
  },
  "business-loan": {
    title: "Business Loan",
    short: "Funding support for working capital, expansion and business needs.",
    range: "Typical range: ₹1 Lakh – ₹5 Crore+",
    overview: "Business financing can support working capital, expansion, equipment, inventory and other approved business requirements.",
    benefits: ["Working capital support", "Business expansion funding", "Secured and unsecured options", "Documentation assistance"],
    documents: ["PAN and Aadhaar / KYC", "Business registration documents", "6–12 months bank statements", "ITR and financial statements", "GST returns where applicable", "Business/address proof"],
    eligibility: ["Business profile as required by lender", "Adequate turnover and banking conduct", "Repayment capacity", "Acceptable credit and documents"]
  },
  "home-loan": {
    title: "Home Loan",
    short: "Finance for eligible property purchase, construction and housing requirements.",
    range: "Typical range: ₹5 Lakh – ₹100 Crore",
    overview: "Home finance can be used for eligible residential property purchase or construction, subject to lender income, property, legal and technical assessment.",
    benefits: ["Longer tenure options", "Residential property funding", "Property documentation assistance", "Application support"],
    documents: ["PAN and Aadhaar / KYC", "Income proof and bank statements", "Salary slips / ITR as applicable", "Sale/agreement documents", "Title and property documents", "Property approval/tax documents where applicable"],
    eligibility: ["Stable income", "Acceptable credit history", "Property passes lender checks", "Age and tenure within lender policy"]
  },
  "loan-against-property": {
    title: "Loan Against Property",
    short: "Unlock eligible property value for business or approved personal funding.",
    range: "Typical range: ₹5 Lakh – ₹100 Crore",
    overview: "Loan Against Property is a secured facility where an eligible property is offered as security, subject to lender valuation and legal/technical checks.",
    benefits: ["Higher-ticket funding potential", "Business or approved personal use", "Longer tenure may be available", "Property-backed financing"],
    documents: ["PAN and Aadhaar / KYC", "Bank statements", "ITR / salary slips / financials", "Property title documents", "Approved plan/tax receipts where applicable", "Existing liability details"],
    eligibility: ["Acceptable property title", "Adequate repayment capacity", "Legal and technical clearance", "Acceptable credit profile"]
  },
  "car-loan": {
    title: "Car Loan",
    short: "Financing assistance for new and pre-owned vehicles.",
    range: "Typical range: ₹1 Lakh – ₹1 Crore",
    overview: "Car finance can help eligible customers purchase a new or pre-owned vehicle. Loan amount and terms depend on lender and vehicle profile.",
    benefits: ["New and used vehicle options", "Structured EMI repayment", "Fast document-based processing", "Dealer/application assistance"],
    documents: ["PAN and Aadhaar / KYC", "Bank statements", "Salary slips / ITR as applicable", "Vehicle quotation", "RC and valuation for used vehicle", "Existing loan details if applicable"],
    eligibility: ["Stable income", "Acceptable credit profile", "Vehicle meets lender conditions", "Age, tenure and income within policy"]
  },
  "education-loan": {
    title: "Education Loan",
    short: "Financial assistance for eligible higher-education expenses.",
    range: "Amount depends on course, institution and lender policy",
    overview: "Education finance may cover eligible tuition and approved education expenses. Requirements vary by course, institution, student and lender.",
    benefits: ["Higher-education funding", "Course/institution based assessment", "Flexible repayment structure as per lender", "Application assistance"],
    documents: ["Student KYC", "Parent/co-applicant KYC", "Admission/offer letter", "Institution fee structure", "Academic records", "Co-applicant income proof and bank statements", "Security documents where required"],
    eligibility: ["Eligible course/institution admission", "Student/co-applicant profile meets lender policy", "Repayment capacity", "Credit and documentation requirements satisfied"]
  },

  "working-capital": {
    title: "Working Capital",
    short: "Business funding solutions for day-to-day liquidity, trade and operating requirements.",
    range: "Typical range: ₹20 Lakh – ₹200 Crore",
    overview: "Working Capital finance helps businesses manage day-to-day cash-flow requirements, purchase inventory, meet operating expenses and support trade transactions. The exact facility, limit, pricing, security and approval depend on the lender and business profile.",
    benefits: [
      "Supports day-to-day business liquidity",
      "Multiple facility options for different business needs",
      "Can support inventory and operating-cycle requirements",
      "Trade and guarantee facilities may be available",
      "Structured limits based on business banking and financial profile"
    ],
    subProducts: ["DD", "CC", "OD", "MSME", "LC", "BG", "CGTMSE"],
    documents: [
      "PAN and Aadhaar / KYC of applicant and authorised persons",
      "Business registration / constitution documents",
      "Latest 6–12 months bank statements",
      "Latest ITRs and financial statements",
      "GST returns and GST registration where applicable",
      "Business address / ownership or rental proof",
      "Existing loan and banking facility details",
      "Stock / receivable statements where required",
      "Property or security documents where applicable"
    ],
    eligibility: [
      "Established business activity and acceptable banking conduct",
      "Adequate turnover and cash-flow profile",
      "Repayment capacity as assessed by the lender",
      "Acceptable credit history of business / promoters",
      "Financial and GST / ITR documents satisfactory to lender",
      "Security and collateral requirements, where applicable"
    ]
  }
};

export default function LoanDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const loan = LOANS[slug];

  const [applyOpen, setApplyOpen] = useState(false);

  if (!loan) return (
    <main className="min-h-screen bg-[#f4f8fb] grid place-items-center p-6">
      <div className="text-center"><h1 className="text-3xl font-black text-[#073b4c]">Loan product not found</h1><Link href="/" className="mt-5 inline-block rounded-xl bg-[#08b8d4] px-6 py-3 font-bold text-white">Back to LoanKarts</Link></div>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#f4f8fb] text-[#073b4c]">
<header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md">
  <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-4 sm:px-6">

    {/* LoanKarts Logo */}
    <Link
      href="/"
      className="flex shrink-0 items-center"
      aria-label="LoanKarts Home"
    >
      <img
        src="/loankarts-logo.png"
        alt="LoanKarts"
        className="h-auto w-[145px] object-contain sm:w-[165px]"
      />
    </Link>

    {/* Header Actions */}
    <div className="flex items-center gap-2 sm:gap-3">

      <button
        type="button"
        onClick={() => setApplyOpen(true)}
        className="rounded-xl bg-[#08b8d4] px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-[#079fb8] hover:shadow-md sm:px-5"
      >
        Apply Now →
      </button>

    </div>
  </div>
</header>

      <section className="bg-[#073b4c] text-white">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 sm:py-16">
          <Link href="/#loans" className="text-sm font-bold text-[#72e6f5]">← Back to Loan Products</Link>
          <p className="mt-7 text-xs font-black uppercase tracking-[.25em] text-[#10bfd9]">LoanKarts Finance Solution</p>
          <h1 className="mt-3 text-4xl font-black sm:text-5xl">{loan.title}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-white/75">{loan.short}</p>
          <span className="mt-6 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold">{loan.range}</span>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 sm:py-14">
        <div className="grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-xs font-black uppercase tracking-[.22em] text-[#08aeca]">Overview</p>
            <h2 className="mt-2 text-2xl font-black sm:text-3xl">About {loan.title}</h2>
            <p className="mt-5 leading-8 text-slate-600">{loan.overview}</p>
            <h3 className="mt-8 text-lg font-black">Key Benefits</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">{loan.benefits.map(x => <div key={x} className="rounded-2xl border bg-[#f8fbfd] p-4 text-sm font-semibold"><span className="mr-2 text-[#08b8d4]">✓</span>{x}</div>)}</div>
            {loan.subProducts && (
              <div className="mt-8">
                <h3 className="text-lg font-black">Working Capital Facilities</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {loan.subProducts.map((item) => (
                    <span
                      key={item}
                      className="rounded-xl border border-[#b9eaf1] bg-[#e9f8fb] px-4 py-2 text-sm font-black text-[#078fa8]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-500">
                  DD, CC, OD, MSME, LC, BG and CGTMSE-related facilities are subject to the
                  relevant lender, business profile and applicable scheme or facility conditions.
                </p>
              </div>
            )}
          </div>
          <div className="rounded-3xl bg-[#082f42] p-6 text-white shadow-xl sm:p-8">
            <p className="text-xs font-black uppercase tracking-[.22em] text-[#16c6dc]">Need Assistance?</p>
            <h2 className="mt-3 text-2xl font-black">Check your loan requirement</h2>
            <p className="mt-4 text-sm leading-7 text-white/70">Share your requirement with LoanKarts and our team can guide you through the application and document process.</p>
            <button
              type="button"
              onClick={() => setApplyOpen(true)}
              className="mt-7 block w-full rounded-xl bg-[#08b8d4] px-5 py-3.5 text-center font-black transition hover:bg-[#079fb8]"
            >
              APPLY NOW →
            </button>
            <a href="tel:+919990954351" className="mt-3 block rounded-xl border border-white/20 px-5 py-3.5 text-center font-bold">Talk to LoanKarts</a>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-black uppercase tracking-[.22em] text-[#08aeca]">Process</p>
          <h2 className="mt-2 text-2xl font-black">How the loan process works</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-4">
            {[
              ["01", "Share Requirement", "Tell us your loan type, amount and basic profile."],
              ["02", "Profile Review", "We review eligibility, documents and funding requirement."],
              ["03", "Lender Matching", "Suitable lender or facility options are identified."],
              ["04", "Processing", "Documentation and lender coordination continue towards approval and disbursement."]
            ].map(([no, title, text]) => (
              <div key={no} className="rounded-2xl border border-slate-100 bg-[#f8fbfd] p-4">
                <div className="text-sm font-black text-[#08aeca]">{no}</div>
                <h3 className="mt-2 text-sm font-black text-[#073b4c]">{title}</h3>
                <p className="mt-2 text-xs leading-5 text-slate-500">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-xs font-black uppercase tracking-[.22em] text-[#08aeca]">Documents</p>
            <h2 className="mt-2 text-2xl font-black">Documents you may need</h2>
            <p className="mt-2 text-sm text-slate-500">Typical checklist. Final requirements can vary by lender, profile and loan amount.</p>
            <div className="mt-6 space-y-3">{loan.documents.map((x,i) => <div key={x} className="flex gap-3 rounded-2xl bg-slate-50 p-4"><b className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#e7f8fb] text-xs text-[#08aeca]">{i+1}</b><span className="text-sm font-semibold text-slate-700">{x}</span></div>)}</div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-xs font-black uppercase tracking-[.22em] text-[#08aeca]">Eligibility</p>
            <h2 className="mt-2 text-2xl font-black">Basic eligibility factors</h2>
            <div className="mt-6 space-y-3">{loan.eligibility.map(x => <div key={x} className="flex gap-3 rounded-2xl border border-slate-100 p-4"><span className="text-[#08aeca]">✓</span><span className="text-sm font-semibold leading-6 text-slate-700">{x}</span></div>)}</div>
            <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-800">Final approval, interest rate, fees, tenure and document requirements are determined by the respective lender.</div>
          </div>
        </div>
      </section>

      <LoanApplyModal
        loanTitle={loan.title}
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
      />
    </main>
  );
}