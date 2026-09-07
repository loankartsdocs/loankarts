import Link from "next/link";

type LoanData = {
  title: string;
  short: string;
  range: string;
  overview: string;
  benefits: string[];
  documents: string[];
  documentGroups?: {
    title: string;
    documents: string[];
  }[];
  eligibility: string[];
};

const LOANS: Record<string, LoanData> = {
  "personal-loan": {
    title: "Personal Loan",
    short:
      "Quick personal finance solutions for planned, emergency and personal requirements.",
    range: "Typical range: ₹50,000 – ₹50 Lakh",
    overview:
      "Personal Loan is generally an unsecured loan for eligible personal financial requirements. Final approval, interest rate, tenure and documentation depend on the lender and applicant profile.",
    benefits: [
      "No property collateral in most cases",
      "Flexible end-use",
      "Simple application process",
      "Fixed monthly EMI repayment",
    ],
    documents: [
      "Applicant KYC — Aadhaar Card, PAN Card and Photograph",
      "Residence latest Electricity Bill",
      "Office I-Card",
      "Last 3 months Salary Slips",
      "Last 6 months Bank Statement",
      "Loan details, if any running loan",
    ],
    eligibility: [
      "Stable income and repayment capacity",
      "Acceptable credit history",
      "Age and employment profile as per lender policy",
      "Complete and satisfactory documentation",
    ],
  },

  "business-loan": {
    title: "Business Loan",
    short:
      "Funding support for working capital, expansion and business requirements.",
    range: "Typical range: ₹1 Lakh – ₹5 Crore+",
    overview:
      "Business financing can support working capital, expansion, equipment, inventory and other approved business requirements. Documentation depends on the business profile and lender policy.",
    benefits: [
      "Working capital support",
      "Business expansion funding",
      "Multiple lender options",
      "Documentation assistance",
    ],
    documents: [
      "Applicant KYC — Aadhaar Card, PAN Card and Photograph",
      "Co-applicant KYC — Aadhaar Card, PAN Card and Photograph",
      "GST Registration Certificate",
      "Residence Electricity Bill",
      "Udyam Certificate",
      "Last 2 years Financials — ITR, Computation, Balance Sheet, Profit & Loss and Audit Report with CA Stamp",
      "Last 1 year Bank Statement of Current Account",
      "Last 1 year GST Returns — GSTR-3B",
      "Loan details, if any running loan",
    ],
    eligibility: [
      "Active business profile",
      "Adequate turnover and banking conduct",
      "Repayment capacity",
      "Acceptable credit profile",
      "Complete business and financial documentation",
    ],
  },

  "home-loan": {
    title: "Home Loan",
    short:
      "Finance for eligible residential property purchase, construction and housing requirements.",
    range: "Typical range: ₹5 Lakh – ₹5 Crore+",
    overview:
      "Home Loan documentation differs depending on whether the applicant is salaried or a business owner/self-employed. Property documents are also subject to legal and technical verification by the lender.",
    benefits: [
      "Residential property funding",
      "Longer tenure options",
      "Property documentation assistance",
      "Application and lender coordination",
    ],
    documents: [],
    documentGroups: [
      {
        title: "Home Loan — Salaried Applicant",
        documents: [
          "Applicant KYC — Aadhaar Card, PAN Card and Photograph",
          "Co-applicant KYC — Aadhaar Card, PAN Card and Photograph",
          "Residence latest Electricity Bill",
          "Office I-Card",
          "Last 3 months Salary Slips",
          "Last 1 year Bank Statement",
          "Last 2 years Form 16",
          "Loan details, if any running loan",
          "Property papers with complete chain",
          "Agreement to Sale",
        ],
      },
      {
        title: "Home Loan — Business Owner / Proprietorship",
        documents: [
          "Applicant KYC — Aadhaar Card, PAN Card and Photograph",
          "Co-applicant KYC — Aadhaar Card, PAN Card and Photograph",
          "Residence Electricity Bill",
          "GST Registration Certificate",
          "Last 2 years Financials — ITR, Computation, Balance Sheet, Profit & Loss and Audit Report with CA Stamp",
          "Last 1 year Bank Statement of Current Account",
          "Last 1 year GST Return — GSTR-3B",
          "Loan details, if any running loan",
          "Udyam Certificate",
          "Property papers with complete chain",
          "Agreement to Sale",
        ],
      },
    ],
    eligibility: [
      "Stable income and repayment capacity",
      "Acceptable credit history",
      "Property must pass lender legal and technical checks",
      "Age and tenure within lender policy",
    ],
  },

  "loan-against-property": {
    title: "Loan Against Property",
    short:
      "Unlock eligible property value for business or approved personal funding requirements.",
    range: "Typical range: ₹10 Lakh – ₹5 Crore+",
    overview:
      "Loan Against Property is a secured facility where an eligible property is offered as security. Requirements vary depending on whether the applicant is salaried or self-employed/business owner.",
    benefits: [
      "Higher-ticket funding potential",
      "Business or approved personal use",
      "Property-backed financing",
      "Longer tenure may be available",
    ],
    documents: [],
    documentGroups: [
      {
        title: "LAP — Salaried Applicant",
        documents: [
          "Applicant KYC — Aadhaar Card, PAN Card and Photograph",
          "Co-applicant KYC — Aadhaar Card, PAN Card and Photograph",
          "Residence latest Electricity Bill",
          "Office I-Card",
          "Last 3 months Salary Slips",
          "Last 1 year Bank Statement",
          "Last 2 years Form 16",
          "Loan details, if any running loan",
          "Property papers with complete chain",
        ],
      },
      {
        title: "LAP — Self Employed / Proprietorship",
        documents: [
          "Applicant KYC — Aadhaar Card, PAN Card and Photograph",
          "Co-applicant KYC — Aadhaar Card, PAN Card and Photograph",
          "Residence Electricity Bill",
          "GST Registration Certificate",
          "Last 2 years Financials — ITR, Computation, Balance Sheet, Profit & Loss and Audit Report with CA Stamp",
          "Last 1 year Bank Statement of Current Account",
          "Last 1 year GST Return — GSTR-3B",
          "Loan details, if any running loan",
          "Udyam Certificate",
          "Property papers with complete chain",
        ],
      },
    ],
    eligibility: [
      "Acceptable property title",
      "Adequate repayment capacity",
      "Legal and technical clearance of property",
      "Acceptable credit profile",
    ],
  },

  "car-loan": {
    title: "Car Loan",
    short:
      "Financing assistance for new and pre-owned vehicles with structured repayment options.",
    range: "Typical range: ₹1 Lakh – ₹50 Lakh",
    overview:
      "Car Loan documentation differs for new and used vehicles. Vehicle and applicant documents are verified according to lender policy.",
    benefits: [
      "New and used vehicle financing",
      "Structured EMI repayment",
      "Dealer/application assistance",
      "Documentation support",
    ],
    documents: [],
    documentGroups: [
      {
        title: "New Car Loan — Required Documents",
        documents: [
          "Applicant KYC — Aadhaar Card, PAN Card and Photograph",
          "Last 3 months Salary Slips",
          "Last 6 months Bank Statement",
          "Residence Electricity Bill",
          "Office I-Card, if available",
          "Vehicle Quotation with Dealer Stamp",
          "Loan details, if any running loan",
        ],
      },
      {
        title: "Used Car Loan — Required Documents",
        documents: [
          "Applicant KYC — Aadhaar Card, PAN Card and Photograph",
          "Last 3 months Salary Slips",
          "Last 6 months Bank Statement",
          "Residence Electricity Bill",
          "Vehicle RC",
          "Vehicle Insurance",
          "Loan details, if any running loan",
        ],
      },
    ],
    eligibility: [
      "Stable income and repayment capacity",
      "Acceptable credit profile",
      "Vehicle meets lender conditions",
      "Age, income and tenure within lender policy",
    ],
  },

  "education-loan": {
    title: "Education Loan",
    short:
      "Financial assistance for eligible higher education, professional courses and approved educational expenses.",
    range: "Amount depends on course, institution and lender policy",
    overview:
      "Education Loan can help cover eligible tuition fees and other approved education expenses. Documentation may be required from both the student and parent/co-applicant.",
    benefits: [
      "Higher education funding",
      "Tuition fee assistance",
      "Course and institution based assessment",
      "Application and documentation support",
    ],
    documents: [
      "Student KYC — Aadhaar Card, PAN Card and Photograph",
      "Parent / Co-applicant KYC — Aadhaar Card, PAN Card and Photograph",
      "Admission Letter / Offer Letter",
      "College / Institution Fee Structure",
      "Academic Records / Mark Sheets",
      "Parent / Co-applicant Income Proof",
      "Parent / Co-applicant Bank Statements",
      "Residence / Address Proof",
      "Course and institution related documents",
      "Collateral / Security Documents, wherever required by lender",
    ],
    eligibility: [
      "Admission to an eligible course and institution",
      "Student and co-applicant profile meets lender policy",
      "Adequate repayment capacity",
      "Acceptable credit and documentation",
    ],
  },

  "working-capital": {
    title: "Working Capital",
    short:
      "Business funding solutions for day-to-day operations, working capital and business growth.",
    range: "Typical range: ₹20 Lakh – ₹200 Crore+",
    overview:
      "Working Capital facilities may include CC, OD, DD, LC, BG, MSME and CGTMSE-related funding. Final documentation depends on facility type and lender requirements.",
    benefits: [
      "Day-to-day working capital support",
      "Business expansion funding",
      "CC / OD and other facility options",
      "MSME and business funding support",
    ],
    documents: [
      "Applicant / Proprietor KYC — Aadhaar Card, PAN Card and Photograph",
      "Co-applicant KYC, wherever applicable",
      "GST Registration Certificate",
      "Residence / Business Address Proof",
      "Udyam Certificate",
      "Last 2 years Financials — ITR, Computation, Balance Sheet, Profit & Loss and Audit Report with CA Stamp",
      "Last 1 year Bank Statement of Current Account",
      "Last 1 year GST Returns — GSTR-3B",
      "Existing Loan / Liability Details",
      "Business registration and supporting documents as applicable",
    ],
    eligibility: [
      "Active and established business profile",
      "Adequate turnover and banking conduct",
      "Repayment capacity",
      "Acceptable credit profile",
      "Facility-specific lender requirements satisfied",
    ],
  },
};

export default async function LoanDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const loan = LOANS[slug];

  if (!loan) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f4f8fb] p-6">
        <div className="text-center">
          <h1 className="text-3xl font-black text-[#073b4c]">
            Loan product not found
          </h1>

          <Link
            href="/"
            className="mt-5 inline-block rounded-xl bg-[#08b8d4] px-6 py-3 font-bold text-white"
          >
            Back to LoanKarts
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f8fb] text-[#073b4c]">
     {/* HEADER */}
<header
  className="loan-detail-header sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur"
>
  <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-6">

    {/* LOGO */}
    <Link
      href="/"
      className="flex h-[48px] w-[180px] shrink-0 items-center overflow-hidden"
      aria-label="LoanKarts"
    >
      <img
        src="/loankarts-logo.png"
        alt="LoanKarts"
        width={160}
        height={42}
        className="block h-[42px] w-[160px] max-w-[160px] object-contain"
      />
    </Link>

    {/* ACTIONS */}
    <div className="flex items-center gap-3">

      <Link
        href="/#loans"
        className="hidden rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-[#073b4c] transition hover:border-[#08b8d4] hover:text-[#08b8d4] sm:block"
      >
        All Loans
      </Link>

      <Link
        href="/#apply"
        className="rounded-xl bg-[#08b8d4] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#079db7]"
      >
        Apply Now →
      </Link>

    </div>
  </div>

  {/* Protect this header from Home page global CSS */}

</header>

      {/* HERO */}
      <section className="bg-[#073b4c] text-white">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 sm:py-16">
          <Link
            href="/#loans"
            className="text-sm font-bold text-[#72e6f5]"
          >
            ← Back to Loan Products
          </Link>

          <p className="mt-7 text-xs font-black uppercase tracking-[.25em] text-[#10bfd9]">
            LoanKarts Finance Solution
          </p>

          <h1 className="mt-3 text-4xl font-black sm:text-5xl">
            {loan.title}
          </h1>

          <p className="mt-4 max-w-3xl text-lg leading-8 text-white/75">
            {loan.short}
          </p>

          <span className="mt-6 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold">
            {loan.range}
          </span>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 sm:py-14">
        <div className="grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
          {/* OVERVIEW */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-xs font-black uppercase tracking-[.22em] text-[#08aeca]">
              Overview
            </p>

            <h2 className="mt-2 text-2xl font-black sm:text-3xl">
              About {loan.title}
            </h2>

            <p className="mt-5 leading-8 text-slate-600">
              {loan.overview}
            </p>

            <h3 className="mt-8 text-lg font-black">
              Key Benefits
            </h3>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {loan.benefits.map((benefit) => (
                <div
                  key={benefit}
                  className="rounded-2xl border border-slate-200 bg-[#f8fbfd] p-4 text-sm font-semibold"
                >
                  <span className="mr-2 text-[#08b8d4]">✓</span>
                  {benefit}
                </div>
              ))}
            </div>
          </div>

          {/* APPLY BOX */}
          <div className="rounded-3xl bg-[#082f42] p-6 text-white shadow-xl sm:p-8">
            <p className="text-xs font-black uppercase tracking-[.22em] text-[#16c6dc]">
              Need Assistance?
            </p>

            <h2 className="mt-3 text-2xl font-black">
              Check your loan requirement
            </h2>

            <p className="mt-4 text-sm leading-7 text-white/70">
              Share your requirement with LoanKarts and our team can guide you
              through the application and document process.
            </p>

            <Link
              href="/#apply"
              className="mt-7 block rounded-xl bg-[#08b8d4] px-5 py-3.5 text-center font-black"
            >
              APPLY NOW →
            </Link>

            <a
              href="tel:+919315743939"
              className="mt-3 block rounded-xl border border-white/20 px-5 py-3.5 text-center font-bold"
            >
              Talk to LoanKarts
            </a>
          </div>
        </div>

        {/* DOCUMENTS + ELIGIBILITY */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* DOCUMENTS */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-xs font-black uppercase tracking-[.22em] text-[#08aeca]">
              Required Documents
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Documents you may need
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Please keep these documents ready before submitting your
              application. Final requirements can vary by lender, profile and
              loan amount.
            </p>

            {/* NORMAL DOCUMENT LIST */}
            {loan.documents.length > 0 && (
              <div className="mt-6 space-y-3">
                {loan.documents.map((document, index) => (
                  <div
                    key={document}
                    className="flex gap-3 rounded-2xl bg-slate-50 p-4"
                  >
                    <b className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#e7f8fb] text-xs text-[#08aeca]">
                      {index + 1}
                    </b>

                    <span className="text-sm font-semibold leading-6 text-slate-700">
                      {document}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* GROUPED DOCUMENT LIST */}
            {loan.documentGroups && (
              <div className="mt-6 space-y-6">
                {loan.documentGroups.map((group) => (
                  <div
                    key={group.title}
                    className="rounded-2xl border border-slate-200 overflow-hidden"
                  >
                    <div className="bg-[#082f42] px-5 py-4">
                      <h3 className="text-sm font-black text-white">
                        {group.title}
                      </h3>
                    </div>

                    <div className="space-y-2 p-4">
                      {group.documents.map((document, index) => (
                        <div
                          key={document}
                          className="flex gap-3 rounded-xl bg-slate-50 p-3.5"
                        >
                          <b className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#e7f8fb] text-xs text-[#08aeca]">
                            {index + 1}
                          </b>

                          <span className="text-sm font-semibold leading-6 text-slate-700">
                            {document}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ELIGIBILITY */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-xs font-black uppercase tracking-[.22em] text-[#08aeca]">
              Eligibility
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Basic eligibility factors
            </h2>

            <div className="mt-6 space-y-3">
              {loan.eligibility.map((item) => (
                <div
                  key={item}
                  className="flex gap-3 rounded-2xl border border-slate-100 p-4"
                >
                  <span className="font-bold text-[#08aeca]">✓</span>

                  <span className="text-sm font-semibold leading-6 text-slate-700">
                    {item}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-800">
              Final approval, interest rate, fees, tenure and document
              requirements are determined by the respective lender.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}