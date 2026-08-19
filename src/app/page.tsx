"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";


const banks = [
  ["SBI", "sbi.co.in"],
  ["HDFC Bank", "hdfcbank.com"],
  ["ICICI Bank", "icicibank.com"],
  ["Axis Bank", "axisbank.com"],
  ["IDFC FIRST Bank", "idfcfirstbank.com"],
  ["IndusInd Bank", "indusind.com"],
  ["Bandhan Bank", "bandhanbank.com"],
  ["Kotak Mahindra Bank", "kotak.com"],
  ["Unity Small Finance Bank", "unitybank.com"],
  ["Shriram Finance", "shriramfinance.in"],
  ["Yes Bank", "yesbank.in"],
  ["PNB", "pnbindia.in"],
  ["Bank of Maharashtra", "bankofmaharashtra.in"],
  ["Federal Bank", "federalbank.co.in"],
  ["Union Bank of India", "unionbankofindia.bank.in"],
  ["SVC Bank", "svcbank.com"],
  ["Bank of Baroda", "bankofbaroda.in"],
  ["Central Bank of India", "centralbankofindia.co.in"],
];

type Loan = [
  id: string,
  title: string,
  description: string,
  amount: string,
  subTypes?: string[],
];

const loans: Loan[] = [
  ["01", "Personal Loan", "Funding for personal needs, emergencies and planned expenses.", "₹50K – ₹50L"],
  ["02", "Business Loan", "Funding support for working capital, expansion and business needs.", "₹1L – ₹5Cr"],
  ["03", "Home Loan", "Finance for purchase, construction and balance transfer.", "₹5L – ₹100Cr"],
  ["04", "Loan Against Property", "Unlock property value for business or personal requirements.", "₹5L – ₹100Cr"],
  ["05", "Car Loan", "Financing assistance for new and pre-owned vehicles.", "₹1L – ₹1Cr"],
  ["06", "Education Loan", "Funding assistance for higher education and career-focused studies.", "₹1L – ₹1Cr"],
  ["07", "Working Capital", "DD • CC • OD • MSME • LC • BG • CGTMSE", "₹20L – ₹200Cr", ["DD", "CC", "OD", "MSME", "LC", "BG", "CGTMSE"]],
];

const problems = [
  ["01", "Low CIBIL", "A lower score can make normal bank routes difficult. We help identify suitable options."],
  ["02", "Bank Rejection", "Understand what went wrong and explore a better-structured application."],
  ["03", "Collateral Gap", "Explore secured and unsecured routes based on profile and eligibility."],
  ["04", "Documentation", "Get help understanding the documents needed before submission."],
  ["05", "Delayed Processing", "We help keep the application organised and track the next stage."],
  ["06", "Business Expansion", "Funding support for working capital, machinery and growth requirements."],
  ["07", "GST / ITR Issues", "Understand documentation gaps and prepare the profile for lender review."],
  ["08", "Funding Requirement", "Discuss the requirement and identify suitable lender/product routes."],
];

const advantages = [
  ["01", "Experts for Every Loan Product", "Guidance across personal, business, home, LAP, vehicle and education requirements."],
  ["02", "Customised Funding Structure", "Every profile is different. We organise the requirement around income, banking and lender fit."],
  ["03", "Faster Processing", "Clear documentation and organised submission reduce avoidable back-and-forth."],
  ["04", "Multiple Bank Tie-Ups", "Access multiple financial channels depending on eligibility and product requirements."],
  ["05", "End-to-End Support", "From initial requirement to documentation, processing and application updates."],
  ["06", "Solutions for Different Profiles", "Salaried, self-employed, professionals and businesses can discuss their funding needs."],
];

const steps = [
  ["01", "Tell Us Your Requirement", "Loan amount, loan type & basic details share karein.", "📝"],
  ["02", "Profile Assessment", "Our team reviews your profile, eligibility & requirements.", "🔍"],
  ["03", "Lender Matching", "We identify suitable lender options based on your profile.", "🏦"],
  ["04", "Processing & Disbursement", "Documentation, processing & lender coordination till disbursement.", "⚡"],
];

const testimonials = [
  ["★★★★★", "Business Owner", "The team explained the process clearly and helped us understand which loan route suited our requirement."],
  ["★★★★★", "Salaried Customer", "The application process was simple and the team kept us updated at every stage."],
  ["★★★★★", "Financial Professional", "LoanKarts provides a practical way to manage loan requirements and documentation."],
  ["★★★★★", "Self Employed", "The team understood my requirement and explained the documentation before moving ahead."],
  ["★★★★★", "Business Customer", "Good communication throughout the process and clear guidance on the next steps."],
  ["★★★★★", "Loan Customer", "The process was easy to understand and the team was available when I had questions."],
];



const bankLogoFiles: Record<string, string> = {
  "SBI": "/sbi_co_in.ico",
  "HDFC Bank": "/hdfcbank.png",
  "ICICI Bank": "/icicibank_com.ico",
  "Axis Bank": "/axisbank_com.ico",
  "IDFC FIRST Bank": "/idfcfirstbank_com.ico",
  "IndusInd Bank": "/indusind.jpeg",
  "Bandhan Bank": "/bandhanbank.png",
  "Kotak Mahindra Bank": "/kotak_com.png",
  "Unity Small Finance Bank": "/unitybank.png",
  "Shriram Finance": "/shriramfinance.png",
  "Yes Bank": "/yesbank.jpg",
  "PNB": "/pnbindia_in.ico",
  "Bank of Maharashtra": "/bankofmaharashtra.png",
  "Federal Bank": "/federalbank_co_in.png",
  "Union Bank of India": "/unionbank.jpeg",
  "SVC Bank": "/svc.png",
  "Bank of Baroda": "/bob.png",
  "Central Bank of India": "/centralbankofindia.png",
};

export default function Home() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("All");

  const [brokerModal, setBrokerModal] = useState(false);

  const [applicationName, setApplicationName] = useState("");
  const [applicationMobile, setApplicationMobile] = useState("");
  const [applicationEmail, setApplicationEmail] = useState("");
  const [applicationLoanType, setApplicationLoanType] = useState("");
  const [applicationAmount, setApplicationAmount] = useState("");
  const [applicationEmployment, setApplicationEmployment] = useState("");
  const [applicationDetails, setApplicationDetails] = useState("");
  const [applicationSending, setApplicationSending] = useState(false);

  // ================= EMI CALCULATOR STATE =================
  const [emiPrincipal, setEmiPrincipal] = useState(2500000);
  const [emiRate, setEmiRate] = useState(10);
  const [emiTenure, setEmiTenure] = useState(5);

  const submitLoanApplication = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const mobile = applicationMobile.replace(/\D/g, "");

    if (
      !applicationName.trim() ||
      mobile.length !== 10 ||
      !applicationLoanType ||
      !applicationAmount.trim() ||
      !applicationEmployment
    ) {
      alert("Please fill all required details and enter a valid 10-digit mobile number.");
      return;
    }

    setApplicationSending(true);

    const message = [
      "🏦 *NEW LOAN APPLICATION - LOANKARTS*",
      "",
      `👤 *Name:* ${applicationName.trim()}`,
      `📱 *Mobile:* ${mobile}`,
      `📧 *Email:* ${applicationEmail.trim() || "Not provided"}`,
      `🏦 *Loan Type:* ${applicationLoanType}`,
      `💰 *Loan Amount:* ${applicationAmount.trim()}`,
      `💼 *Employment Type:* ${applicationEmployment}`,
      `📝 *Additional Details:* ${applicationDetails.trim() || "Not provided"}`,
      "",
      "Please contact this customer regarding the loan requirement.",
    ].join("\n");

    const whatsappUrl =
      `https://wa.me/919990954351?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    setApplicationSending(false);
  };

  const calculateEMI = () => {
    // Values are controlled by React state, so the calculator updates instantly.
    return true;
  };

  const months = emiTenure * 12;
  const monthlyRate = emiRate / 12 / 100;
  const emi =
    monthlyRate === 0
      ? emiPrincipal / months
      : (emiPrincipal *
          monthlyRate *
          Math.pow(1 + monthlyRate, months)) /
        (Math.pow(1 + monthlyRate, months) - 1);

  const totalPayment = emi * months;
  const totalInterest = Math.max(0, totalPayment - emiPrincipal);
  const principalShare = totalPayment > 0 ? (emiPrincipal / totalPayment) * 100 : 0;
  const interestShare = totalPayment > 0 ? (totalInterest / totalPayment) * 100 : 0;

  const formatCurrency = (value: number) =>
    `₹${Math.round(value).toLocaleString("en-IN")}`;

  const formatLakhCrore = (value: number) => {
    if (value >= 10000000) {
      return `₹${(value / 10000000).toFixed(2)} Cr`;
    }
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(2)} L`;
    }
    return formatCurrency(value);
  };

  return (
   <main className="min-h-screen overflow-x-clip bg-white text-[#082f42]">

      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }

        body {
          overflow-x: hidden;
        }
  .lk-header-apply {
    color: #ffffff !important;
    -webkit-text-fill-color: #ffffff !important;
  }
        header img {
          max-width: none;
        }

        .lk-about-trigger {
          font-family: inherit !important;
          -webkit-font-smoothing: inherit;
        }

        .lk-about-trigger span {
          font-family: inherit;
        }

        /* PROFESSIONAL LOGO SIZE */
        header a[aria-label="LoanKarts"] {
          width: 160px !important;
          height: 40px !important;
          overflow: visible !important;
          display: flex !important;
          align-items: center !important;
        }

        header a[aria-label="LoanKarts"] img {
          width: 160px !important;
          max-width: 160px !important;
          height: auto !important;
        }

        @keyframes lkReveal {
          from {
            opacity: 0;
            transform: translateY(20px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes lkScale {
          from {
            opacity: 0;
            transform: scale(.97);
          }

          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes lkMarquee {
          from {
            transform: translateX(0);
          }

          to {
            transform: translateX(-50%);
          }
        }

        .lk-reveal {
          animation: lkReveal .8s ease both;
        }

        .lk-scale {
          animation: lkScale .9s .15s ease both;
        }

        .lk-marquee {
          width: max-content;
          animation: lkMarquee 38s linear infinite;
          will-change: transform;
        }

        .lk-marquee:hover,
        .lk-marquee:focus-within {
          animation-play-state: paused;
        }

        @media (prefers-reduced-motion: reduce) {
          .lk-marquee {
            animation: none;
          }
        }

        .lk-no-scrollbar::-webkit-scrollbar {
          display: none;
        }

        .lk-no-scrollbar {
          scrollbar-width: none;
        }

        /* PREMIUM EMI RANGE SLIDERS */
        .lk-emi-range {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 7px;
          border-radius: 999px;
          outline: none;
          cursor: pointer;
        }

        .lk-emi-range::-webkit-slider-runnable-track {
          height: 7px;
          border-radius: 999px;
          background: transparent;
        }

        .lk-emi-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 21px;
          height: 21px;
          margin-top: -7px;
          border-radius: 999px;
          border: 4px solid #ffffff;
          background: #08b8d4;
          box-shadow: 0 4px 14px rgba(8,184,212,.35), 0 0 0 1px rgba(8,47,66,.10);
          transition: transform .18s ease, box-shadow .18s ease;
        }

        .lk-emi-range:hover::-webkit-slider-thumb {
          transform: scale(1.08);
          box-shadow: 0 5px 18px rgba(8,184,212,.42), 0 0 0 1px rgba(8,47,66,.12);
        }

        .lk-emi-range:focus-visible::-webkit-slider-thumb {
          box-shadow: 0 0 0 5px rgba(8,184,212,.16), 0 4px 14px rgba(8,184,212,.35);
        }

        .lk-emi-range::-moz-range-track {
          height: 8px;
          border-radius: 999px;
          background: transparent;
        }

        .lk-emi-range::-moz-range-progress {
          height: 8px;
          border-radius: 999px;
          background: #08b8d4;
        }

        .lk-emi-range::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 999px;
          border: 4px solid #ffffff;
          background: #08b8d4;
          box-shadow: 0 4px 14px rgba(8,184,212,.35);
        }
      `}</style>


      {/* ================= TOP BAR ================= */}

      <div className="bg-[#062536] text-white">

        <div className="mx-auto flex max-w-[1180px] items-center justify-between px-5 py-2 text-[10px] sm:px-6">

          <span className="hidden sm:block text-white/70">
            LoanKarts — Your trusted loan assistance partner
          </span>

          <div className="ml-auto flex items-center gap-5">

           <a
  href="tel:+919315743939"
  className="font-bold hover:text-[#12bdd6]"
>
  +91 93157 43939
</a>

            <a
              href="mailto:docs@loankarts.com"
              className="hidden sm:block font-bold hover:text-[#12bdd6]"
            >
              docs@loankarts.com
            </a>

          </div>

        </div>

      </div>


      {/* ================= NAVIGATION ================= */}

      <header className="sticky top-0 z-[9999] w-full border-b border-slate-200 bg-white/95 backdrop-blur">

        <div className="mx-auto flex h-[64px] max-w-[1180px] items-center justify-between px-5 sm:px-6">

          {/* LOGO */}

          <a
            href="#home"
            aria-label="LoanKarts"
            className="flex h-[48px] w-[190px] shrink-0 items-center"
          >
            <img
              src="/loankarts-logo-transparent.png"
              alt="LoanKarts"
              width="190"
              height="48"
              loading="eager"
              decoding="async"
              className="block h-[48px] w-[190px] object-contain object-left"
            />
          </a>


          {/* DESKTOP NAV */}

          <nav className="hidden items-center gap-2 lg:flex">

            <a
              href="/"
              className="rounded-lg px-3 py-2 text-[13px] font-semibold text-[#183f55] transition-all duration-200 hover:bg-[#e9f8fb] hover:text-[#08aeca] hover:shadow-sm"
            >
              Home
            </a>

            <a
              href="/#loans"
              className="rounded-lg px-3 py-2 text-[13px] font-semibold text-[#183f55] transition-all duration-200 hover:bg-[#e9f8fb] hover:text-[#08aeca] hover:shadow-sm"
            >
              Loans
            </a>

            <a
              href="/#emi-calculator"
              className="rounded-lg px-3 py-2 text-[13px] font-semibold text-[#183f55] transition-all duration-200 hover:bg-[#e9f8fb] hover:text-[#08aeca] hover:shadow-sm"
            >
              EMI Calculator
            </a>

            {/* ABOUT DROPDOWN */}
            <div
              className="relative"
              onMouseEnter={() => setAboutOpen(true)}
              onMouseLeave={() => setAboutOpen(false)}
            >
              <button
                type="button"
                onClick={() => setAboutOpen((prev) => !prev)}
                className="lk-about-trigger flex items-center gap-1 rounded-lg px-3 py-2 text-[13px] font-semibold leading-normal text-[#183f55] transition-all duration-200 hover:bg-[#e9f8fb] hover:text-[#08aeca] hover:shadow-sm"
                style={{
                  fontFamily: "inherit",
                  fontSize: "13px",
                  fontWeight: 600,
                  lineHeight: "1.5",
                }}
              >
                <span>About</span>
                <span
                  aria-hidden="true"
                  className={`text-[10px] leading-none transition-transform duration-200 ${
                    aboutOpen ? "rotate-180" : ""
                  }`}
                >
                  ▾
                </span>
              </button>

              {aboutOpen && (
                <div
                  className="absolute left-0 top-full z-[10000] w-[210px] overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-xl"
                  onMouseEnter={() => setAboutOpen(true)}
                  onMouseLeave={() => setAboutOpen(false)}
                >
                  <a
                    href="/about"
                    onClick={() => setAboutOpen(false)}
                    className="block rounded-lg px-4 py-3 text-[13px] font-semibold leading-normal text-[#183f55] transition hover:bg-[#e9f8fb] hover:text-[#08aeca]"
                  >
                    About Us
                  </a>

                  <a
                    href="/about/team"
                    onClick={() => setAboutOpen(false)}
                    className="block rounded-lg px-4 py-3 text-[13px] font-semibold leading-normal text-[#183f55] transition hover:bg-[#e9f8fb] hover:text-[#08aeca]"
                  >
                    Our Team
                  </a>

                  <a
                    href="/about/faq"
                    onClick={() => setAboutOpen(false)}
                    className="block rounded-lg px-4 py-3 text-[13px] font-semibold leading-normal text-[#183f55] transition hover:bg-[#e9f8fb] hover:text-[#08aeca]"
                  >
                    FAQ
                  </a>
                </div>
              )}
            </div>

            {/* CONTACT */}
            <a
              href="/contact"
              className="rounded-lg px-3 py-2 text-[13px] font-semibold text-[#183f55] transition-all duration-200 hover:bg-[#e9f8fb] hover:text-[#08aeca] hover:shadow-sm"
            >
              Contact
            </a>

            {/* HEADER BUTTONS — SAME STYLE AS HERO BUTTONS */}
           <button
  onClick={() => setBrokerModal(true)}
  className="ml-2 flex h-[48px] items-center justify-center rounded-lg border border-slate-300 bg-white px-6 !text-[12px] !font-extrabold text-[#082f42] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#08b8d4] hover:bg-[#f7fdfe] hover:shadow-md"
>
  CONNECTOR LOGIN →
</button>

<a
  href="#apply"
  className="lk-header-apply flex h-[48px] items-center justify-center rounded-lg bg-[#08b8d4] px-6 text-[12px] font-extrabold shadow-lg shadow-cyan-500/15 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#079eb7]"
>
  APPLY NOW →
</a>
          </nav>


          {/* MOBILE MENU BUTTON */}

          <button
            onClick={() => setMobileMenu(!mobileMenu)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-lg lg:hidden"
          >
            {mobileMenu ? "×" : "☰"}
          </button>

        </div>


        {/* MOBILE MENU */}

        {mobileMenu && (

          <div className="border-t border-slate-200 bg-white px-5 py-4 shadow-lg lg:hidden">

            <div className="space-y-1">

              <a
                href="/"
                onClick={() => setMobileMenu(false)}
                className="block rounded-lg px-3 py-2.5 text-[15px] font-semibold transition-all hover:bg-[#e9f8fb] hover:text-[#08aeca]"
              >
                Home
              </a>

              <a
                href="/#loans"
                onClick={() => setMobileMenu(false)}
                className="block rounded-lg px-3 py-2.5 text-[15px] font-semibold transition-all hover:bg-[#e9f8fb] hover:text-[#08aeca]"
              >
                Loans
              </a>

              <a
                href="/#emi-calculator"
                onClick={() => setMobileMenu(false)}
                className="block rounded-lg px-3 py-2.5 text-[15px] font-semibold transition-all hover:bg-[#e9f8fb] hover:text-[#08aeca]"
              >
                EMI Calculator
              </a>

              {/* MOBILE ABOUT */}
              <button
                type="button"
                onClick={() => setAboutOpen(!aboutOpen)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-[15px] font-semibold transition-all hover:bg-[#e9f8fb] hover:text-[#08aeca]"
              >
                <span>About</span>
                <span
                  className={`transition-transform ${
                    aboutOpen ? "rotate-180" : ""
                  }`}
                >
                  ▾
                </span>
              </button>

              {aboutOpen && (
                <div className="ml-3 border-l-2 border-[#08b8d4] pl-2">
                  <a
                    href="/about"
                    onClick={() => {
                      setMobileMenu(false);
                      setAboutOpen(false);
                    }}
                    className="block rounded-lg px-3 py-2.5 text-[14px] font-semibold transition-all hover:bg-[#e9f8fb] hover:text-[#08aeca]"
                  >
                    About Us
                  </a>

                  <a
                    href="/about/team"
                    onClick={() => {
                      setMobileMenu(false);
                      setAboutOpen(false);
                    }}
                    className="block rounded-lg px-3 py-2.5 text-[14px] font-semibold transition-all hover:bg-[#e9f8fb] hover:text-[#08aeca]"
                  >
                    Our Team
                  </a>

                  <a
                    href="/about/faq"
                    onClick={() => {
                      setMobileMenu(false);
                      setAboutOpen(false);
                    }}
                    className="block rounded-lg px-3 py-2.5 text-[14px] font-semibold transition-all hover:bg-[#e9f8fb] hover:text-[#08aeca]"
                  >
                    FAQ
                  </a>
                </div>
              )}

              {/* CONTACT */}
              <a
                href="/contact"
                onClick={() => setMobileMenu(false)}
                className="block rounded-lg px-3 py-2.5 text-[15px] font-semibold transition-all hover:bg-[#e9f8fb] hover:text-[#08aeca]"
              >
                Contact
              </a>


              <button
                onClick={() => setBrokerModal(true)}
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white py-3 text-[10px] font-extrabold text-[#082f42] transition-all hover:border-[#08b8d4] hover:bg-[#f7fdfe]"
              >
                CONNECTOR LOGIN →
              </button>


              <a
                href="#apply"
                onClick={() => setMobileMenu(false)}
                className="mt-2 block rounded-lg bg-[#08b8d4] py-3 text-center text-[10px] font-extrabold text-white transition-all hover:bg-[#079eb7]"
              >
                APPLY NOW →
              </a>

            </div>

          </div>

        )}

      </header>


      {/* ================= HERO ================= */}

      <section
        id="home"
        className="relative overflow-hidden bg-gradient-to-br from-[#f7fafc] via-[#f5f9fb] to-[#eef9fb]"
      >

        {/* BACKGROUND GLOW */}

        <div className="absolute right-[-160px] top-[-100px] h-[520px] w-[520px] rounded-full bg-[#08b8d4]/10 blur-[100px]" />

        <div className="absolute bottom-[-180px] left-[-100px] h-[400px] w-[400px] rounded-full bg-[#08b8d4]/5 blur-[90px]" />


        <div className="mx-auto grid max-w-[1240px] items-center gap-4 px-5 py-10 sm:px-6 md:py-14 lg:grid-cols-[1fr_.9fr] lg:py-[58px]">


          {/* LEFT */}

          <div className="lk-reveal relative z-10">

            <span className="inline-flex rounded-full border border-[#b8e8ee] bg-white/90 px-3 py-1.5 text-[9px] font-extrabold text-[#0a4963] shadow-sm">
              ● LOAN ASSISTANCE · PAN INDIA
            </span>


            <h1 className="mt-5 max-w-[650px] text-[42px] font-black leading-[.98] tracking-[-1.8px] text-[#082f42] sm:text-[54px] lg:text-[62px]">

              Loan problems?

              <span className="block text-[#08aeca]">
                We find the right route.
              </span>

            </h1>


            <p className="mt-5 max-w-[560px] text-[15px] leading-7 text-slate-500 sm:text-[16px]">

              Professional assistance for personal, business, home, vehicle and other loan requirements — from profile understanding to documentation and lender processing.

            </p>


            <div className="mt-7 flex flex-wrap gap-2.5">

              <a
                href="#apply"
                className="flex h-[52px] min-w-[235px] items-center justify-center rounded-lg bg-[#08b8d4] px-8 text-[13px] font-extrabold text-white shadow-lg shadow-cyan-500/15 transition hover:-translate-y-0.5 hover:bg-[#079eb7]"
              >
                APPLY FOR A LOAN →
              </a>


            </div>


            <div className="mt-6 flex flex-wrap gap-4 text-[12px] font-semibold text-slate-500">

              <span>✓ Multiple loan categories</span>

              <span>✓ Document assistance</span>

              <span>✓ Human support</span>

            </div>

          </div>


          {/* ================= PROFESSIONAL PHOTO ================= */}

          <div className="lk-scale relative mx-auto flex h-[500px] w-full max-w-[500px] items-end justify-center lg:h-[570px] lg:ml-auto">


            {/* SOFT GLOW */}

            <div className="absolute bottom-[-80px] right-[-50px] h-[430px] w-[430px] rounded-full bg-[#08b8d4]/10 blur-[90px]" />


            {/* SOFT BACKGROUND SHAPE */}

            <div className="absolute bottom-0 right-[4%] h-[440px] w-[380px] rounded-[50%] bg-gradient-to-t from-[#dceff3] via-[#edf7f9] to-transparent opacity-90" />


            {/* PHOTO */}

            <div className="relative z-10 flex h-full w-full items-end justify-center">

             <img
  src="/loan-consultant.png"
  alt="LoanKarts loan consultant"
  className="relative top-[48px] z-10 h-[92%] w-auto max-w-none object-contain object-bottom drop-shadow-[0_25px_35px_rgba(8,47,66,.18)] lg:top-[55px]"
  style={{
    WebkitMaskImage:
      "linear-gradient(to bottom, black 0%, black 92%, transparent 100%)",
    maskImage:
      "linear-gradient(to bottom, black 0%, black 92%, transparent 100%)",
  }}
/>

            </div>


            {/* PHOTO TEXT */}

            <div className="absolute bottom-[38px] left-[50%] z-20 w-max -translate-x-[25%]">

              <p className="text-[8px] font-extrabold uppercase tracking-[.25em] text-[#08aeca]">
                LOANKARTS · LOAN ASSISTANCE
              </p>

              <h3 className="mt-1 text-[20px] font-black tracking-[-.4px] text-[#082f42]">
                Your loan. Our guidance.
              </h3>

            </div>

          </div>

        </div>

      </section>


      {/* ================= TRUST FEATURES ================= */}

      <section className="relative z-30 -mt-[62px] mb-[62px]">
        <div className="mx-auto max-w-[1180px] px-5 sm:px-6">
          <div className="mx-auto grid min-h-[100px] max-w-[980px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_42px_rgba(8,47,66,.18)] md:grid-cols-3 md:max-w-[980px]">

            <div className="flex min-h-[150px] flex-col justify-center border-b border-slate-200 px-6 py-5 md:border-b-0 md:border-r md:px-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#e9f8fb] text-[20px]">
                🛡️
              </div>
              <h3 className="text-[15px] font-extrabold text-[#082f42]">
                Trusted Loan Solutions
              </h3>
              <p className="mt-1.5 text-[12px] leading-5 text-slate-500">
                Transparent assistance and customer-focused loan support.
              </p>
            </div>

            <div className="flex min-h-[150px] flex-col justify-center border-b border-slate-200 px-6 py-5 md:border-b-0 md:border-r md:px-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#fff7e8] text-[20px]">
                🧑‍💼
              </div>
              <h3 className="text-[15px] font-extrabold text-[#082f42]">
                Expert Assistance
              </h3>
              <p className="mt-1.5 text-[12px] leading-5 text-slate-500">
                Professional help with documentation and applications.
              </p>
            </div>

            <div className="flex min-h-[150px] flex-col justify-center px-6 py-5 md:px-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#fff4e8] text-[20px]">
                ⚡
              </div>
              <h3 className="text-[15px] font-extrabold text-[#082f42]">
                Simple Process
              </h3>
              <p className="mt-1.5 text-[12px] leading-5 text-slate-500">
                Apply online and track your application with our team.
              </p>
            </div>

          </div>
        </div>
      </section>


      {/* ================= STATS ================= */}

      <section className="bg-white py-8">

        <div className="mx-auto grid w-full max-w-[1500px] grid-cols-2 md:grid-cols-5 px-4 sm:px-8 lg:px-12">

          <Stat value="8+" label="Years of Experience" />

          <Stat
            value="6,000+"
            label="Customers Assisted"
            border
          />

          <Stat
            value="80+"
            label="Bank & NBFC Partners"
            border
          />

          <Stat
            value="24/7"
            label="Customer Support"
            border
          />

          <Stat
            value="98%"
            label="Customer Satisfaction"
            border
          />

        </div>

      </section>




      {/* ================= EMI CALCULATOR ================= */}
      <section
        id="emi-calculator"
        className="bg-[#f5f8fb] py-10 sm:py-12"
      >
        <div className="mx-auto max-w-[1180px] px-5 sm:px-6">

          <SectionHeading
            eyebrow="EMI CALCULATOR"
            title="Plan Your Monthly EMI"
            text="Adjust the loan amount, interest rate and tenure to instantly estimate your repayment."
          />

          <div className="mt-7 grid gap-5 lg:grid-cols-[1fr_1.12fr]">

            {/* ================= PREMIUM INPUT PANEL ================= */}
            <div className="relative overflow-hidden rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_16px_38px_rgba(8,47,66,.09)] sm:p-6">
              <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[#08b8d4]/10 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-[#08b8d4]/5 blur-3xl" />

              <div className="relative">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-extrabold uppercase tracking-[.22em] text-[#08aeca]">
                      LOAN PLANNER
                    </p>
                    <h3 className="mt-1.5 text-[24px] font-black tracking-[-.5px] text-[#082f42] sm:text-[26px]">
                      Set your loan details
                    </h3>
                  </div>

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#cceff4] bg-[#eefbfd] text-[20px] font-black text-[#08aeca] shadow-sm">
                    ₹
                  </div>
                </div>

                {/* LOAN AMOUNT */}
                <div className="mt-5">
                  <div className="flex items-end justify-between gap-4">
                    <label className="text-[14px] font-extrabold text-[#082f42] sm:text-[15px]">
                      Loan Amount
                    </label>
                    <div className="rounded-xl border border-[#dceef2] bg-[#f5fafb] px-3.5 py-1.5 text-[17px] font-black text-[#082f42] shadow-sm sm:text-[19px]">
                      {formatCurrency(emiPrincipal)}
                    </div>
                  </div>

                  <input
                    aria-label="Loan Amount"
                    type="range"
                    min={100000}
                    max={10000000}
                    step={50000}
                    value={emiPrincipal}
                    onChange={(e) => setEmiPrincipal(Number(e.target.value))}
                    className="lk-emi-range mt-4"
                    style={{
                      background: `linear-gradient(to right, #08b8d4 0%, #08b8d4 ${((emiPrincipal - 100000) / (10000000 - 100000)) * 100}%, #dbe5e8 ${((emiPrincipal - 100000) / (10000000 - 100000)) * 100}%, #dbe5e8 100%)`,
                    }}
                  />

                  <div className="mt-1.5 flex justify-between text-[10px] font-semibold text-slate-400">
                    <span>₹1 Lakh</span>
                    <span>₹1 Crore</span>
                  </div>
                </div>

                {/* INTEREST RATE */}
                <div className="mt-5">
                  <div className="flex items-end justify-between gap-4">
                    <label className="text-[14px] font-extrabold text-[#082f42] sm:text-[15px]">
                      Interest Rate
                    </label>
                    <div className="rounded-xl border border-[#dceef2] bg-[#f5fafb] px-3.5 py-1.5 text-[17px] font-black text-[#082f42] shadow-sm sm:text-[19px]">
                      {emiRate.toFixed(1)}%
                      <span className="ml-1 text-[11px] font-bold text-slate-400">p.a.</span>
                    </div>
                  </div>

                  <input
                    aria-label="Annual Interest Rate"
                    type="range"
                    min={5}
                    max={20}
                    step={0.1}
                    value={emiRate}
                    onChange={(e) => setEmiRate(Number(e.target.value))}
                    className="lk-emi-range mt-4"
                    style={{
                      background: `linear-gradient(to right, #08b8d4 0%, #08b8d4 ${((emiRate - 5) / 15) * 100}%, #dbe5e8 ${((emiRate - 5) / 15) * 100}%, #dbe5e8 100%)`,
                    }}
                  />

                  <div className="mt-1.5 flex justify-between text-[10px] font-semibold text-slate-400">
                    <span>5%</span>
                    <span>20%</span>
                  </div>
                </div>

                {/* TENURE */}
                <div className="mt-5">
                  <div className="flex items-end justify-between gap-4">
                    <label className="text-[14px] font-extrabold text-[#082f42] sm:text-[15px]">
                      Loan Tenure
                    </label>
                    <div className="rounded-xl border border-[#dceef2] bg-[#f5fafb] px-3.5 py-1.5 text-[17px] font-black text-[#082f42] shadow-sm sm:text-[19px]">
                      {emiTenure}
                      <span className="ml-1 text-[11px] font-bold text-slate-400">years</span>
                    </div>
                  </div>

                  <input
                    aria-label="Loan Tenure"
                    type="range"
                    min={1}
                    max={30}
                    step={1}
                    value={emiTenure}
                    onChange={(e) => setEmiTenure(Number(e.target.value))}
                    className="lk-emi-range mt-4"
                    style={{
                      background: `linear-gradient(to right, #08b8d4 0%, #08b8d4 ${((emiTenure - 1) / 29) * 100}%, #dbe5e8 ${((emiTenure - 1) / 29) * 100}%, #dbe5e8 100%)`,
                    }}
                  />

                  <div className="mt-1.5 flex justify-between text-[10px] font-semibold text-slate-400">
                    <span>1 year</span>
                    <span>30 years</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={calculateEMI}
                  className="mt-5 flex h-11 w-full items-center justify-center rounded-xl bg-[#082f42] text-[13px] font-extrabold tracking-wide text-white shadow-[0_10px_24px_rgba(8,47,66,.18)] transition hover:-translate-y-0.5 hover:bg-[#063247] hover:shadow-[0_14px_28px_rgba(8,47,66,.22)]"
                >
                  CALCULATE EMI <span className="ml-2 text-[16px]">→</span>
                </button>

                <p className="mt-2.5 text-center text-[10px] font-medium text-slate-400">
                  Drag the sliders to compare your repayment instantly.
                </p>
              </div>
            </div>

            {/* ================= PREMIUM RESULT PANEL ================= */}
            <div className="relative overflow-hidden rounded-[22px] bg-[#082f42] p-5 text-white shadow-[0_18px_42px_rgba(8,47,66,.20)] sm:p-6">
              <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#08b8d4]/15 blur-3xl" />
              <div className="absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-[#08b8d4]/10 blur-3xl" />

              <div className="relative flex h-full flex-col">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[9px] font-extrabold uppercase tracking-[.22em] text-[#16c6dc]">
                      ESTIMATED REPAYMENT
                    </p>
                    <h3 className="mt-1.5 text-[22px] font-black sm:text-[25px]">
                      Your EMI summary
                    </h3>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[9px] font-bold text-white/60">
                    {emiTenure} YEAR PLAN
                  </div>
                </div>

                <div className="mt-5 grid items-center gap-4 sm:grid-cols-[1fr_140px]">
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[.18em] text-white/45">
                      Monthly EMI
                    </p>
                    <div className="mt-1.5 text-[34px] font-black tracking-tight text-[#16c6dc] sm:text-[39px]">
                      {formatCurrency(emi)}
                    </div>
                    <p className="mt-1 text-[10px] text-white/40">
                      Approx. monthly repayment
                    </p>
                  </div>

                  {/* DONUT CHART */}
                  <div
                    className="mx-auto flex h-[132px] w-[132px] items-center justify-center rounded-full shadow-[0_10px_30px_rgba(0,0,0,.16)]"
                    style={{
                      background: `conic-gradient(#16c6dc 0% ${principalShare}%, #35d2c5 ${principalShare}% ${principalShare + interestShare}%, rgba(255,255,255,.08) ${principalShare + interestShare}% 100%)`,
                    }}
                  >
                    <div className="flex h-[94px] w-[94px] flex-col items-center justify-center rounded-full bg-[#082f42] text-center shadow-inner">
                      <span className="text-[8px] uppercase tracking-[.16em] text-white/40">
                        Interest
                      </span>
                      <span className="mt-1 text-lg font-black text-white">
                        {interestShare.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-white/10 bg-white/[.06] p-3.5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[9px] uppercase tracking-[.15em] text-white/40">
                        Principal
                      </p>
                      <p className="mt-1 text-[16px] font-black text-white">
                        {formatLakhCrore(emiPrincipal)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-[.15em] text-white/40">
                        Total Interest
                      </p>
                      <p className="mt-1 text-[16px] font-black text-[#35d2c5]">
                        {formatLakhCrore(totalInterest)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 border-t border-white/10 pt-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[9px] uppercase tracking-[.15em] text-white/40">
                        Total Repayment
                      </span>
                      <span className="text-[18px] font-black text-white">
                        {formatLakhCrore(totalPayment)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-4">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[9px] text-white/45">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#16c6dc]" />
                      Principal {principalShare.toFixed(1)}%
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#35d2c5]" />
                      Interest {interestShare.toFixed(1)}%
                    </span>
                  </div>
                  <p className="mt-2 text-[9px] leading-4 text-white/35">
                    Indicative calculation only. Actual EMI, rate, fees and approval depend on lender terms and eligibility.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>


      {/* ================= LOANS ================= */}

      <section
        id="loans"
        className="bg-[#f5f8fb] py-16 sm:py-20"
      >

        <div className="mx-auto max-w-[1420px] px-8 sm:px-10 lg:px-12">

          <SectionHeading
            eyebrow="FUNDING SOLUTIONS"
            title="Comprehensive Loan Options"
            text="Choose a category and explore the type of assistance you need."
          />


          <div className="mt-7 grid gap-3 md:grid-cols-2 lg:grid-cols-3">

            {loans.map(([n, title, text, amount, subTypes]) => (

              <Link
                key={`${n}-${title}`}
                href={`/loans/${title.toLowerCase().replace(/\s+/g, "-")}`}
                className="group block min-h-[168px] rounded-[18px] border border-slate-200/90 bg-white p-[18px] shadow-[0_8px_24px_rgba(8,47,66,.045)] transition-all duration-200 hover:-translate-y-1 hover:border-[#b9eaf1] hover:shadow-[0_14px_32px_rgba(8,47,66,.10)]"
              >

                <div className="flex items-start justify-between">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e9f8fb] text-[#08aeca]">
                    {n === "01" && (
                      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
                        <path d="M12 3.5l7 3v5.3c0 4.2-2.8 7.7-7 9.2-4.2-1.5-7-5-7-9.2V6.5l7-3Z" stroke="currentColor" strokeWidth="1.8"/>
                        <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                    {n === "02" && (
                      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
                        <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/>
                        <path d="M8 9h8M8 13h5M8 16h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                      </svg>
                    )}
                    {n === "03" && (
                      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
                        <path d="M4 18h16M6 18V9h12v9M8 9V6h8v3M9 13h2M13 13h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                    {n === "04" && (
                      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
                        <path d="M5 19h14M7 19V10h10v9M9 10V7h6v3M9 14h2M13 14h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                    {n === "05" && (
                      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
                        <path d="M5 15.5h14l-1.2-4.2A2 2 0 0 0 15.9 10H8.1a2 2 0 0 0-1.9 1.3L5 15.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                        <circle cx="8" cy="16.5" r="1.2" stroke="currentColor" strokeWidth="1.5"/>
                        <circle cx="16" cy="16.5" r="1.2" stroke="currentColor" strokeWidth="1.5"/>
                      </svg>
                    )}
                    {n === "06" && (
                      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
                        <path d="M5 4h10l4 4v12H5V4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                        <path d="M15 4v5h4M8 13h8M8 16h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                      </svg>
                    )}
                    {n === "07" && (
                      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
                        <rect x="3.5" y="5" width="17" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/>
                        <path d="M3.5 9h17M7 13h4M7 16h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                      </svg>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[8px] font-extrabold text-slate-400">
                      {amount}
                    </span>


                  </div>

                </div>


                <h3 className="mt-3.5 text-[15px] font-black tracking-[-.15px] text-[#082f42]">
                  {title}
                </h3>


                <p className="mt-1.5 text-[9px] leading-4.5 text-slate-500">
                  {subTypes && subTypes.length > 0
                    ? subTypes.join(" • ")
                    : text}
                </p>


                <span className="mt-3 inline-block text-[8px] font-extrabold text-[#08aeca]">
                  Explore option →
                </span>

              </Link>

            ))}

          </div>

        </div>

      </section>


      {/* ================= APPLY ================= */}

      <section
        id="apply"
        className="bg-white pt-10 pb-8 sm:pt-12 sm:pb-10"
      >

        <div className="mx-auto grid max-w-[1240px] gap-7 px-5 sm:px-6 lg:grid-cols-[.82fr_1.18fr] lg:items-start">

          <div className="pt-2">

            <SectionEyebrow>
              GET STARTED
            </SectionEyebrow>

            <h2 className="mt-3 max-w-[560px] text-[38px] font-black leading-[1.02] tracking-[-1.5px] text-[#082f42] sm:text-[50px]">
              Apply in a few
              <span className="block text-[#08aeca]">minutes.</span>
            </h2>

            <p className="mt-5 max-w-[500px] text-[15px] leading-7 text-slate-500">
              Share your basic requirement. Our team can contact you to understand the profile and next steps.
            </p>

            <div className="mt-6 space-y-3 text-[13px] font-semibold text-slate-500">
              <div>✓ No commitment for an initial discussion</div>
              <div>✓ Free basic eligibility discussion</div>
              <div>✓ Multiple financial channels</div>
              <div>✓ Human assistance</div>
            </div>

          </div>

          <form
            onSubmit={submitLoanApplication}
            className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_18px_50px_rgba(8,47,66,.10)] sm:p-5"
          >

            <div className="rounded-[18px] bg-[#082f42] px-6 py-5 text-white shadow-[0_10px_25px_rgba(8,47,66,.12)]">
              <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#16c6dc]">
                QUICK APPLICATION
              </p>
              <h3 className="mt-1.5 text-[25px] font-black tracking-[-.4px]">
                Tell us what you need
              </h3>
              <p className="mt-1.5 text-[12px] text-white/65">
                Basic details are enough to get started.
              </p>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input
                required
                value={applicationName}
                onChange={(e) => setApplicationName(e.target.value)}
                placeholder="Full Name *"
                className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-[14px] text-[#082f42] outline-none transition placeholder:text-slate-400 focus:border-[#08b8d4] focus:ring-4 focus:ring-cyan-50"
              />

              <input
                required
                value={applicationMobile}
                onChange={(e) =>
                  setApplicationMobile(e.target.value.replace(/\D/g, "").slice(0, 10))
                }
                placeholder="Mobile Number *"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-[14px] text-[#082f42] outline-none transition placeholder:text-slate-400 focus:border-[#08b8d4] focus:ring-4 focus:ring-cyan-50"
              />

              <input
                value={applicationEmail}
                onChange={(e) => setApplicationEmail(e.target.value)}
                placeholder="Email Address"
                type="email"
                className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-[14px] text-[#082f42] outline-none transition placeholder:text-slate-400 focus:border-[#08b8d4] focus:ring-4 focus:ring-cyan-50"
              />

              <select
                required
                value={applicationLoanType}
                onChange={(e) => setApplicationLoanType(e.target.value)}
                className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-[14px] text-[#082f42] outline-none transition focus:border-[#08b8d4] focus:ring-4 focus:ring-cyan-50"
              >
                <option value="">Select Loan Type *</option>
                {loans.map(([, title]) => (
                  <option key={title} value={title}>
                    {title}
                  </option>
                ))}
              </select>

              <input
                required
                value={applicationAmount}
                onChange={(e) => setApplicationAmount(e.target.value)}
                placeholder="Loan Amount Required *"
                className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-[14px] text-[#082f42] outline-none transition placeholder:text-slate-400 focus:border-[#08b8d4] focus:ring-4 focus:ring-cyan-50"
              />

              <select
                required
                value={applicationEmployment}
                onChange={(e) => setApplicationEmployment(e.target.value)}
                className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-[14px] text-[#082f42] outline-none transition focus:border-[#08b8d4] focus:ring-4 focus:ring-cyan-50"
              >
                <option value="">Employment Type *</option>
                <option value="Salaried">Salaried</option>
                <option value="Self Employed">Self Employed</option>
                <option value="Business Owner">Business Owner</option>
                <option value="Professional">Professional</option>
              </select>
            </div>

            <textarea
              value={applicationDetails}
              onChange={(e) => setApplicationDetails(e.target.value)}
              placeholder="Additional details (optional)"
              rows={3}
              className="mt-3 min-h-[92px] w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[14px] text-[#082f42] outline-none transition placeholder:text-slate-400 focus:border-[#08b8d4] focus:ring-4 focus:ring-cyan-50"
            />

            <button
              type="submit"
              disabled={applicationSending}
              className="mt-3 h-12 w-full rounded-xl bg-[#08b8d4] px-5 text-[14px] font-extrabold text-white shadow-[0_10px_24px_rgba(8,184,212,.18)] transition hover:-translate-y-0.5 hover:bg-[#079eb7] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {applicationSending ? "OPENING WHATSAPP..." : "SUBMIT APPLICATION →"}
            </button>

            <p className="mt-2.5 px-2 text-center text-[10px] leading-4 text-slate-400">
              Your application details will be sent to the LoanKarts team on WhatsApp.
              Loan approval is subject to lender eligibility and documentation.
            </p>

          </form>

        </div>

      </section>


      {/* ================= ABOUT ================= */}
      <section
        id="about"
        className="bg-white pt-8 pb-14 sm:pt-10 sm:pb-16"
      >
        <div className="mx-auto max-w-[1180px] px-5 sm:px-6">

          <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">

            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#08aeca]">
                ABOUT LOANKARTS
              </p>

              <h2 className="mt-3 max-w-[500px] text-[32px] font-black leading-[1.08] tracking-[-1px] text-[#082f42] sm:text-[40px]">
                Simple guidance.
                <span className="block text-[#08aeca]">
                  Better loan decisions.
                </span>
              </h2>

              <p className="mt-5 max-w-[500px] text-[13px] leading-6 text-slate-500 sm:text-[14px] sm:leading-7">
                We help customers understand their loan requirements, organise documentation and connect with suitable financial channels through a simple, structured process.
              </p>

              <div className="mt-6 flex items-center gap-8">
                <div>
                  <div className="text-[27px] font-black text-[#08aeca]">6K+</div>
                  <div className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    Customers
                  </div>
                </div>

                <div className="h-10 w-px bg-slate-200" />

                <div>
                  <div className="text-[27px] font-black text-[#08aeca]">100+</div>
                  <div className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    Channels
                  </div>
                </div>
              </div>

              <button
                onClick={() => setBrokerModal(true)}
                className="group mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-[#082f42] px-6 text-[11px] font-extrabold text-white shadow-[0_8px_20px_rgba(8,47,66,.12)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#08aeca]"
              >
                WORK WITH US
                <span className="ml-2 text-[15px] transition-transform duration-200 group-hover:translate-x-1">
                  →
                </span>
              </button>
            </div>

            <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
              {advantages.map(([n, title, text]) => (
                <div
                  key={n}
                  className="group flex items-start gap-4 px-5 py-4 transition-colors duration-200 hover:bg-[#f8fdfe] sm:px-6 sm:py-5"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#effbfd] text-[10px] font-black text-[#08aeca] ring-1 ring-[#d5eef2] transition-all duration-200 group-hover:bg-[#08b8d4] group-hover:text-white">
                    {n}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-[13px] font-black leading-5 text-[#082f42] sm:text-[14px]">
                      {title}
                    </h3>

                    <p className="mt-1 text-[10px] leading-5 text-slate-500 sm:text-[11px]">
                      {text}
                    </p>
                  </div>

                  <span className="mt-1 hidden text-[#08aeca] opacity-0 transition-all duration-200 group-hover:block group-hover:translate-x-1 group-hover:opacity-100">
                    →
                  </span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>


      {/* ================= PROCESS ================= */}

      <section
        id="process"
        className="bg-[#082f42] py-16 text-white sm:py-20"
      >

        <div className="mx-auto max-w-[1240px] px-5 sm:px-6">

          <SectionHeading
            dark
            eyebrow="HOW IT WORKS"
            title="Application to Disbursement"
            text="A simple four-stage process designed to keep the requirement organised."
          />


          <div className="mt-9 grid gap-6 md:grid-cols-4 md:gap-0">

            {steps.map(([n, title, text, icon], index) => (

              <div key={n} className="relative md:px-2.5">

                <div
                  className={`relative h-[250px] rounded-xl border p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
                    index === 0
                      ? "border-[#08b8d4] bg-[#e8f8fb] text-[#082f42]"
                      : "border-white/10 bg-white/5 text-white"
                  }`}
                >

                  <div className="flex items-start justify-between">
                    <div className="text-3xl font-black">
                      {n}
                    </div>

                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${
                        index === 0
                          ? "bg-white/70"
                          : "bg-white/10"
                      }`}
                    >
                      {icon}
                    </div>
                  </div>

                  <h3 className="mt-5 text-[15px] font-black leading-5">
                    {title}
                  </h3>

                  <p
                    className={`mt-2 text-[12px] leading-6 ${
                      index === 0
                        ? "text-slate-600"
                        : "text-white/55"
                    }`}
                  >
                    {text}
                  </p>

                </div>


              </div>

            ))}

          </div>

        </div>

      </section>


      {/* ================= GOOGLE REVIEWS ================= */}

      <section className="bg-[#f5f8fb] py-16 sm:py-20">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-6">

          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-[700px]">
              <div className="text-[9px] font-extrabold uppercase tracking-[.22em] text-[#08aeca]">
                GOOGLE REVIEWS
              </div>

              <h2 className="mt-2 text-4xl font-black tracking-tight text-[#082f42] sm:text-5xl">
                What our customers say.
              </h2>

              <p className="mt-4 max-w-[650px] text-[13px] leading-6 text-slate-500">
                See genuine customer feedback directly on Google. Read existing
                reviews or share your own experience with LoanKarts.
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <a
                href="https://share.google/WByQDt6vKQiTZCYbh"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-[10px] font-extrabold text-[#082f42] shadow-sm transition hover:-translate-y-0.5 hover:border-[#08b8d4] hover:shadow-md"
              >
                VIEW GOOGLE REVIEWS ↗
              </a>

              <a
                href="https://share.google/WByQDt6vKQiTZCYbh"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-[#08b8d4] px-5 text-[10px] font-extrabold text-white shadow-lg shadow-cyan-500/15 transition hover:-translate-y-0.5 hover:bg-[#079eb7]"
              >
                WRITE A REVIEW ★
              </a>
            </div>
          </div>

          <div className="mt-9 grid gap-4 md:grid-cols-3">

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(8,47,66,.06)]">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-extrabold uppercase tracking-[.18em] text-slate-400">
                  Google
                </span>
                <span className="rounded-full bg-[#e9f8fb] px-3 py-1 text-[9px] font-extrabold text-[#08aeca]">
                  VERIFIED PLATFORM
                </span>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <div className="text-3xl font-black text-[#082f42]">★★★★★</div>
              </div>

              <h3 className="mt-4 text-lg font-black text-[#082f42]">
                Real customer feedback
              </h3>

              <p className="mt-2 text-[11px] leading-5 text-slate-500">
                Reviews are kept on Google so customers can see the original
                source and share their own genuine experience.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(8,47,66,.06)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e9f8fb] text-lg">
                ★
              </div>

              <h3 className="mt-5 text-lg font-black text-[#082f42]">
                Read existing reviews
              </h3>

              <p className="mt-2 text-[11px] leading-5 text-slate-500">
                Open our Google listing and read customer experiences directly
                from the source.
              </p>

              <a
                href="https://share.google/WByQDt6vKQiTZCYbh"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex text-[9px] font-extrabold text-[#08aeca] hover:text-[#079eb7]"
              >
                OPEN GOOGLE ↗
              </a>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(8,47,66,.06)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff7e8] text-lg">
                ✍
              </div>

              <h3 className="mt-5 text-lg font-black text-[#082f42]">
                Share your experience
              </h3>

              <p className="mt-2 text-[11px] leading-5 text-slate-500">
                Already worked with LoanKarts? You can leave an honest review
                on Google in just a few clicks.
              </p>

              <a
                href="https://share.google/WByQDt6vKQiTZCYbh"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex text-[9px] font-extrabold text-[#08aeca] hover:text-[#079eb7]"
              >
                WRITE ON GOOGLE ★
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* ================= BANKING PARTNERS ================= */}

      <section className="border-t border-slate-200 bg-white py-8 sm:py-10">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-10">
          <div className="mb-5 text-center">
            <div className="text-[9px] font-extrabold uppercase tracking-[.22em] text-[#08aeca]">
              OUR BANKING & FINANCIAL PARTNERS
            </div>
            <h2 className="mt-1.5 text-xl font-black text-[#082f42] sm:text-2xl">
              Trusted Financial Network
            </h2>
          </div>

          <div className="relative overflow-hidden">
            <div
              className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white to-transparent"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white to-transparent"
              aria-hidden="true"
            />

            <div className="lk-no-scrollbar overflow-hidden">
              <div className="lk-marquee flex gap-3 py-2">
                {[...banks, ...banks].map(([name, domain], index) => (
                  <div
                    key={`${name}-${index}`}
                    className="flex h-[54px] shrink-0 items-center gap-2.5 px-4 transition hover:-translate-y-0.5"
                  >
                    <div className="flex h-8 w-8 items-center justify-center">
                      <img
                        src={bankLogoFiles[name] || "/sbi_co_in.ico"}
                        alt={`${name} logo`}
                        className="h-6 w-6 rounded object-contain"
                        loading="lazy"
                      />
                    </div>
                    <span className="whitespace-nowrap text-[11px] font-bold text-[#183f55]">
                      {name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="bg-[#050b20] text-white">
        <div className="mx-auto max-w-[1180px] px-5 py-8 sm:px-6">

          <div className="grid items-stretch gap-6 lg:grid-cols-[0.9fr_1.1fr]">

            {/* LEFT SIDE — NO CARD */}
            <div className="flex flex-col justify-center py-2">

              <img
                src="/logo-white.png"
                alt="LoanKarts"
                className="h-auto w-[190px] object-contain"
              />

              <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                Get in <span className="text-[#08b8d4]">Touch</span>
              </h2>

              <p className="mt-2 max-w-[430px] text-[12px] leading-5 text-white/55">
                We’re here to help you with your loan needs. Reach out to us anytime.
              </p>

              <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                <a
                  href="mailto:docs@loankarts.com"
                  className="flex items-center gap-3 text-[12px] font-semibold text-white/80 hover:text-[#08b8d4]"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#08b8d4]/10 text-[17px] text-[#08b8d4]">
                    ✉
                  </span>
                  <span>
                    <span className="block text-[8px] font-extrabold uppercase tracking-[.18em] text-[#08b8d4]">
                      EMAIL
                    </span>
                    docs@loankarts.com
                  </span>
                </a>

                <a
                  href="tel:+919315743939"
                  className="flex items-center gap-3 text-[12px] font-semibold text-white/80 hover:text-[#08b8d4]"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#08b8d4]/10 text-[17px] text-[#08b8d4]">
                    ☎
                  </span>
                  <span>
                    <span className="block text-[8px] font-extrabold uppercase tracking-[.18em] text-[#08b8d4]">
                      CALL
                    </span>
                    +91 93157 43939
                  </span>
                </a>
              </div>

              <div className="mt-4 flex items-center gap-2.5">
                <span className="mr-1 text-[9px] font-extrabold uppercase tracking-[.18em] text-white/45">
                  Follow Us
                </span>

                <a
                  href="#"
                  aria-label="Facebook"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 transition hover:border-[#08b8d4] hover:bg-[#08b8d4]"
                >
                  <img src="/facebook.png" alt="Facebook" className="h-5 w-5 object-contain" />
                </a>

                <a
                  href="#"
                  aria-label="Instagram"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 transition hover:border-[#08b8d4] hover:bg-[#08b8d4]"
                >
                  <img src="/instagram.png" alt="Instagram" className="h-5 w-5 object-contain" />
                </a>

                <a
                  href="#"
                  aria-label="YouTube"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 transition hover:border-[#08b8d4] hover:bg-[#08b8d4]"
                >
                  <img src="/youtube.png" alt="YouTube" className="h-5 w-5 object-contain" />
                </a>

                <a
                  href="https://wa.me/919315743939"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="WhatsApp"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 transition hover:border-[#08b8d4] hover:bg-[#08b8d4]"
                >
                  <img src="/whatspp.png" alt="WhatsApp" className="h-5 w-5 object-contain" />
                </a>
              </div>
            </div>

            {/* RIGHT SIDE — EXACTLY 2 CARDS */}
            <div className="grid gap-5 sm:grid-cols-2">

              {/* EMAIL CARD */}
              <a
                href="mailto:docs@loankarts.com"
                className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#0b1428] p-6 text-center transition duration-200 hover:-translate-y-1 hover:border-[#08b8d4]/60"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#08b8d4]/10 text-3xl text-[#08b8d4]">
                  ✉
                </div>

                <p className="mt-4 text-[10px] font-extrabold uppercase tracking-[.22em] text-[#08b8d4]">
                  EMAIL US
                </p>

                <h3 className="mt-3 text-[16px] font-black text-white">
                  docs@loankarts.com
                </h3>

                <div className="mt-4 h-[2px] w-10 bg-[#08b8d4]" />

                <p className="mt-3 text-[10px] leading-5 text-white/50">
                  Have a question or need assistance?
                  <br />
                  Drop us an email and our team will
                  <br />
                  get back to you shortly.
                </p>
              </a>

              {/* BROKER JOIN CARD */}
              <button
                type="button"
                onClick={() => setBrokerModal(true)}
                className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-[#08b8d4]/30 bg-gradient-to-br from-[#082f42] via-[#0a5268] to-[#087d93] p-6 text-center transition duration-200 hover:-translate-y-1 hover:border-[#08b8d4]/70"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-3xl">
                  🤝
                </div>

                <p className="mt-4 text-[10px] font-extrabold uppercase tracking-[.22em] text-[#16c6dc]">
                  JOIN AS A CONNECTOR
                </p>

                <h3 className="mt-3 text-[20px] font-black leading-tight text-white">
                  Become a LoanKarts
                  <br />
                  Partner
                </h3>

                <div className="mt-4 h-[2px] w-10 bg-[#16c6dc]" />

                <p className="mt-3 text-[10px] leading-5 text-white/70">
                  Are you a loan connector, DSA, agent,
                  <br />
                  financial professional or business
                  <br />
                  partner? Join our network.
                </p>

                <span className="mt-4 rounded-lg bg-white px-5 py-2.5 text-[10px] font-extrabold text-[#082f42]">
                  JOIN AS CONNECTOR →
                </span>
              </button>

            </div>
          </div>

          {/* COPYRIGHT */}
          <div className="mt-6 border-t border-white/10 pt-3 text-center text-[9px] text-white/40">
            © {new Date().getFullYear()} LoanKarts. All rights reserved.
            <span className="mx-2 text-white/20">|</span>
            Your trusted loan assistance partner
          </div>

        </div>
      </footer>

      {/* ================= WHATSAPP ================= */}

      <a
        href="https://wa.me/919315743939"
        target="_blank"
        rel="noreferrer"
        aria-label="Chat with LoanKarts on WhatsApp"
        className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-xl transition hover:-translate-y-1 hover:scale-105"
      >
        <img
          src="/whatspp.png"
          alt="WhatsApp"
          className="h-9 w-9 object-contain"
        />
      </a>

      <BrokerAuthModal
        open={brokerModal}
        onClose={() => setBrokerModal(false)}
      />

    </main>
  );
}



/* ================= BROKER AUTH MODAL ================= */

function BrokerAuthModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [forgotMode, setForgotMode] = useState(false);

  if (!open) return null;

  const changeMode = (newMode: "login" | "register") => {
    setMode(newMode);
    setForgotMode(false);
    setErrorMessage("");
    setSuccessMessage("");
  };

  async function handleForgotPassword() {
    const resetEmail = email.trim().toLowerCase();
    if (!resetEmail) { setErrorMessage("Please enter your email address first."); return; }
    setLoading(true); setErrorMessage(""); setSuccessMessage("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/connector/reset-password`,
      });
      if (error) { setErrorMessage(error.message); return; }
      setSuccessMessage("Password reset link sent. Please check your email and follow the secure link.");
      setForgotMode(false);
    } catch { setErrorMessage("Unable to send the reset link. Please try again."); }
    finally { setLoading(false); }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          setErrorMessage(error.message);
          setLoading(false);
          return;
        }

        window.location.href = "/broker";
        return;
      }

      if (!name.trim()) {
        setErrorMessage("Please enter your full name.");
        setLoading(false);
        return;
      }

      if (!mobile.trim()) {
        setErrorMessage("Please enter your mobile number.");
        setLoading(false);
        return;
      }

      if (password.length < 6) {
        setErrorMessage("Password must be at least 6 characters.");
        setLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setErrorMessage("Passwords do not match.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: name.trim(),
            mobile: mobile.trim(),
            role: "broker",
          },
        },
      });

      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }

      if (data.session) {
        window.location.href = "/broker";
        return;
      }

      setSuccessMessage(
        "Account created successfully. Please check your email to verify your account."
      );
      setLoading(false);
    } catch (error) {
      console.error(error);
      setErrorMessage("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-[#020817]/75 px-4 py-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative flex max-h-[92vh] w-full max-w-[820px] overflow-hidden rounded-[26px] border border-white/10 bg-white shadow-2xl">

        {/* CLOSE */}

        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xl font-semibold text-white transition hover:bg-white/20"
          aria-label="Close"
        >
          ×
        </button>

        {/* ================= LEFT BRAND PANEL ================= */}

        <div className="hidden w-[36%] shrink-0 flex-col justify-between bg-[#062536] p-7 text-white md:flex">

          <div>
            <img
              src="/logo-white.png"
              alt="LoanKarts"
              className="h-auto w-[145px] object-contain"
            />

            <div className="mt-14">
              <p className="text-[9px] font-extrabold uppercase tracking-[0.24em] text-[#08b8d4]">
                LOANKARTS PARTNER
              </p>

              <h2 className="mt-3 text-[25px] font-black leading-[1.12]">
                Grow your business
                <span className="mt-1 block text-[#08b8d4]">
                  with LoanKarts.
                </span>
              </h2>

              <p className="mt-4 text-[12px] leading-5 text-white/55">
                Join our partner network and grow your loan business with
                professional support.
              </p>
            </div>

            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#08b8d4]/10 text-sm text-[#08b8d4]">
                  ✓
                </div>
                <p className="text-[12px] font-bold text-white/90">
                  Easy Partner Access
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#08b8d4]/10 text-sm text-[#08b8d4]">
                  ✓
                </div>
                <p className="text-[12px] font-bold text-white/90">
                  Professional Support
                </p>
              </div>
            </div>
          </div>

          <p className="text-[9px] text-white/30">
            Your trusted loan assistance partner
          </p>
        </div>

        {/* ================= RIGHT FORM ================= */}

        <div className="min-w-0 flex-1 overflow-y-auto bg-white">

          {/* MOBILE BRAND */}

          <div className="bg-[#062536] px-6 pb-5 pt-6 text-white md:hidden">

            <img
              src="/logo-white.png"
              alt="LoanKarts"
              className="h-auto w-[145px] object-contain"
            />

            <p className="mt-4 text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#08b8d4]">
              LOANKARTS PARTNER
            </p>

          </div>

          <div className="p-6 sm:p-8">

            {/* TITLE */}

            {mode === "login" && (
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.10)]" />
                Secure Access
              </div>
            )}

            <div className="pr-8">

              <h2 className="text-[25px] font-black leading-tight text-[#082f42] sm:text-[28px]">
                {mode === "login"
                  ? "Connector Login"
                  : "Become a Connector Partner"}
              </h2>

              <p className="mt-2 max-w-[430px] text-[13px] leading-5 text-slate-500">
                {mode === "login"
                  ? "Sign in to access your LoanKarts partner dashboard."
                  : "Create your connector account and join the LoanKarts partner network."}
              </p>

            </div>

            {/* TABS */}

            <div className="mt-5 flex rounded-xl bg-[#f1f7f9] p-1">

              <button
                type="button"
                onClick={() => changeMode("login")}
                className={`flex-1 rounded-lg py-2.5 text-[13px] font-extrabold transition ${
                  mode === "login"
                    ? "bg-white text-[#073b4c] shadow-sm"
                    : "text-slate-500 hover:text-[#073b4c]"
                }`}
              >
                Login
              </button>

              <button
                type="button"
                onClick={() => changeMode("register")}
                className={`flex-1 rounded-lg py-2.5 text-[13px] font-extrabold transition ${
                  mode === "register"
                    ? "bg-white text-[#073b4c] shadow-sm"
                    : "text-slate-500 hover:text-[#073b4c]"
                }`}
              >
                Create Account
              </button>

            </div>

            {/* FORM */}

            <form onSubmit={handleSubmit} className="mt-5">

              {errorMessage && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-[12px] leading-5 text-red-700">
                  <p className="font-bold">Please check your details</p>
                  <p>{errorMessage}</p>
                </div>
              )}

              {successMessage && (
                <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-[12px] leading-5 text-green-700">
                  <p className="font-bold">✓ Account Created</p>
                  <p>{successMessage}</p>
                </div>
              )}

              {/* REGISTER FIELDS */}

              {mode === "register" && (
                <>
                  <label className="block text-[13px] font-bold text-[#082f42]">
                    Full Name

                    <input
                      required
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      autoComplete="name"
                      className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 px-3.5 text-[13px] font-normal outline-none transition placeholder:text-slate-400 focus:border-[#08b8d4] focus:ring-4 focus:ring-cyan-50"
                    />
                  </label>

                  <label className="mt-3.5 block text-[13px] font-bold text-[#082f42]">
                    Mobile Number

                    <input
                      required
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="+91 Enter mobile number"
                      autoComplete="tel"
                      className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 px-3.5 text-[13px] font-normal outline-none transition placeholder:text-slate-400 focus:border-[#08b8d4] focus:ring-4 focus:ring-cyan-50"
                    />
                  </label>
                </>
              )}

              {/* EMAIL */}

              <label
                className={`block text-[13px] font-bold text-[#082f42] ${
                  mode === "login" ? "" : "mt-3.5"
                }`}
              >
                Email Address

                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  autoComplete="email"
                  className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 px-3.5 text-[13px] font-normal outline-none transition placeholder:text-slate-400 focus:border-[#08b8d4] focus:ring-4 focus:ring-cyan-50"
                />
              </label>

              {/* PASSWORD */}

              <label className="mt-3.5 block text-[13px] font-bold text-[#082f42]">
                <div className="flex items-center justify-between">
                  <span>Password</span>
                  {mode === "login" && (
                    <button type="button" onClick={() => { setForgotMode((v) => !v); setErrorMessage(""); setSuccessMessage(""); }} className="text-[12px] font-extrabold text-[#08aeca] hover:underline">
                      {forgotMode ? "Back to Login" : "Forgot Password?"}
                    </button>
                  )}
                </div>
                {!forgotMode && (
                  <input required type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 6 characters" autoComplete={mode === "login" ? "current-password" : "new-password"} className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 px-3.5 text-[13px] font-normal outline-none transition placeholder:text-slate-400 focus:border-[#08b8d4] focus:ring-4 focus:ring-cyan-50" />
                )}
              </label>

              {forgotMode && mode === "login" && (
                <div className="mt-4 rounded-2xl border border-cyan-100 bg-[#f4fbfd] p-4">
                  <p className="text-[12px] font-extrabold text-[#082f42]">Reset your connector password</p>
                  <p className="mt-1 text-[11px] leading-5 text-slate-500">Enter your registered email above. We’ll send you a secure password reset link.</p>
                  <button type="button" onClick={handleForgotPassword} disabled={loading} className="mt-3 flex h-11 w-full items-center justify-center rounded-xl bg-[#073b4c] px-4 text-[12px] font-extrabold text-white transition hover:bg-[#0b5269] disabled:cursor-not-allowed disabled:opacity-60">
                    {loading ? "Sending Reset Link..." : "SEND RESET LINK →"}
                  </button>
                </div>
              )}

              {/* CONFIRM PASSWORD */}

              {mode === "register" && (
                <label className="mt-3.5 block text-[13px] font-bold text-[#082f42]">
                  Confirm Password

                  <input
                    required
                    type="password"
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 px-3.5 text-[13px] font-normal outline-none transition placeholder:text-slate-400 focus:border-[#08b8d4] focus:ring-4 focus:ring-cyan-50"
                  />
                </label>
              )}

              {/* BUTTON */}

              {!forgotMode && (
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-5 flex h-12 w-full items-center justify-center rounded-xl bg-[#08b8d4] px-5 text-[13px] font-extrabold text-white shadow-lg shadow-cyan-500/15 transition hover:bg-[#079eb7] disabled:cursor-not-allowed disabled:opacity-60"
              >
                  {loading
                    ? mode === "login"
                      ? "Signing in..."
                      : "Creating Account..."
                    : mode === "login"
                    ? "LOGIN TO CONNECTOR PANEL →"
                    : "CREATE CONNECTOR ACCOUNT →"}
                </button>
              )}

              {/* SWITCH */}

              {!forgotMode && (
                <p className="mt-4 text-center text-[13px] text-slate-500">

                  {mode === "login" ? (
                  <>
                    Don't have a connector account?{" "}

                    <button
                      type="button"
                      onClick={() => changeMode("register")}
                      className="font-extrabold text-[#08aeca] hover:underline"
                    >
                      Create Account
                    </button>
                  </>
                ) : (
                  <>
                    Already have a connector account?{" "}

                    <button
                      type="button"
                      onClick={() => changeMode("login")}
                      className="font-extrabold text-[#08aeca] hover:underline"
                    >
                      Login
                    </button>
                  </>
                )}

                </p>
              )}

            </form>

          </div>

        </div>

      </div>
    </div>
  );
}

/* ================= SECTION HEADING ================= */

function SectionHeading({
  eyebrow,
  title,
  text,
  dark = false,
}: {
  eyebrow: string;
  title: string;
  text: string;
  dark?: boolean;
}) {

  return (

    <div className="mx-auto max-w-[760px] text-center">

      <div
        className={`text-[9px] font-extrabold tracking-[.22em] ${
          dark
            ? "text-[#16c6dc]"
            : "text-[#08aeca]"
        }`}
      >
        {eyebrow}
      </div>


      <h2
        className={`mt-2 text-3xl font-black leading-tight sm:text-4xl ${
          dark
            ? "text-white"
            : "text-[#082f42]"
        }`}
      >
        {title}
      </h2>


      <p
        className={`mx-auto mt-3 max-w-[650px] text-[10px] leading-5 ${
          dark
            ? "text-white/55"
            : "text-slate-500"
        }`}
      >
        {text}
      </p>

    </div>

  );
}


/* ================= EYEBROW ================= */

function SectionEyebrow({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <div className="text-[9px] font-extrabold tracking-[.22em] text-[#08aeca]">
      {children}
    </div>
  );

}


/* ================= STAT ================= */

function Stat({
  value,
  label,
  border = false,
}: {
  value: string;
  label: string;
  border?: boolean;
}) {

  return (

    <div
      className={`min-h-[150px] p-5 text-center sm:p-7 ${
        border
          ? "border-t border-slate-200 md:border-t-0 md:border-l"
          : ""
      }`}
    >

      <div className="text-4xl font-black tracking-tight text-[#082f42] sm:text-5xl">
        {value}
      </div>

      <div className="mt-2 text-[11px] font-semibold text-slate-500">
        {label}
      </div>

    </div>

  );

}


/* ================= FOOTER COLUMN ================= */

function FooterColumn({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {

  const getLink = (item: string) => {

    if (item === "About Us") return "#about";
    if (item === "Contact Us") return "#contact";
    if (item === "EMI Calculator") return "#emi-calculator";
    if (item === "How It Works") return "#process";
    if (item === "FAQs") return "#faq";

    return "#loans";
  };


  return (

    <div>

      <h3 className="text-[10px] font-bold uppercase tracking-wider">
        {title}
      </h3>


      <div className="mt-4 space-y-2 text-[9px] text-white/45">

        {items.map((item) => (

          <a
            key={item}
            href={getLink(item)}
            className="block hover:text-[#16c6dc]"
          >
            {item}
          </a>

        ))}

      </div>

    </div>

  );

}