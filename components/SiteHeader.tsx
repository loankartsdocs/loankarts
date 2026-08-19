"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import BrokerAuthModal from "./BrokerAuthModal";

export default function SiteHeader() {
  const pathname = usePathname();

  const [mobileMenu, setMobileMenu] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  const [brokerModal, setBrokerModal] = useState(false);
  const [brokerMode, setBrokerMode] = useState<"login" | "register">(
    "login"
  );

  // =====================================================
  // LOGO DESTINATION
  // =====================================================

  const logoHref =
    pathname === "/admin" || pathname.startsWith("/admin/")
      ? "/admin"
      : pathname === "/broker" || pathname.startsWith("/broker/")
      ? "/broker"
      : pathname === "/loans" || pathname.startsWith("/loans/")
      ? "/#loans"
      : "/";

  // Listen for JOIN AS BROKER clicks from the footer.
  useEffect(() => {
    const handleBrokerAuth = (event: Event) => {
      const customEvent = event as CustomEvent<{
        mode?: "login" | "register";
      }>;

      setBrokerMode(customEvent.detail?.mode || "register");
      setBrokerModal(true);
      setMobileMenu(false);
      setAboutOpen(false);
    };

    window.addEventListener("open-broker-auth", handleBrokerAuth);

    return () => {
      window.removeEventListener("open-broker-auth", handleBrokerAuth);
    };
  }, []);

  const openBrokerLogin = () => {
    setBrokerMode("login");
    setBrokerModal(true);
    setMobileMenu(false);
  };

  const closeMenu = () => {
    setMobileMenu(false);
    setAboutOpen(false);
  };

  return (
    <>
      <style jsx global>{`
        .lk-header-apply {
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
        }

        .lk-about-trigger {
          font-family: inherit !important;
          -webkit-font-smoothing: inherit;
        }

        .lk-about-trigger span {
          font-family: inherit;
        }

        header a[aria-label="LoanKarts"] {
          width: 160px !important;
          height: 40px !important;
          min-width: 160px !important;
          max-width: 160px !important;
          overflow: hidden !important;
          display: flex !important;
          align-items: center !important;
          flex-shrink: 0 !important;
        }

        header a[aria-label="LoanKarts"] img {
          width: 160px !important;
          min-width: 160px !important;
          max-width: 160px !important;
          height: 40px !important;
          min-height: 40px !important;
          max-height: 40px !important;
          display: block !important;
          object-fit: contain !important;
          flex-shrink: 0 !important;
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

      {/* ================= HEADER ================= */}

      <header className="sticky top-0 z-[9999] w-full border-b border-slate-200 bg-white/95 backdrop-blur">

        <div className="mx-auto flex h-[64px] max-w-[1180px] items-center justify-between px-5 sm:px-6">

          {/* LOGO */}

          <a
            href={logoHref}
            aria-label="LoanKarts"
            className="flex h-[40px] w-[160px] shrink-0 items-center overflow-hidden"
            style={{ width: "160px", height: "40px" }}
          >
            <img
              src="/loankarts-logo-transparent.png"
              alt="LoanKarts"
              width={160}
              height={40}
              className="block h-[40px] w-[160px] object-contain"
              style={{
                width: "160px",
                height: "40px",
                maxWidth: "160px",
              }}
            />
          </a>

          {/* ================= DESKTOP NAV ================= */}

          <nav className="hidden items-center gap-2 lg:flex">

            {/* HOME */}

            <a
              href="/"
              className="rounded-lg px-3 py-2 text-[13px] font-semibold text-[#183f55] transition-all duration-200 hover:bg-[#e9f8fb] hover:text-[#08aeca] hover:shadow-sm"
            >
              Home
            </a>

            {/* LOANS */}

            <a
              href="/#loans"
              className="rounded-lg px-3 py-2 text-[13px] font-semibold text-[#183f55] transition-all duration-200 hover:bg-[#e9f8fb] hover:text-[#08aeca] hover:shadow-sm"
            >
              Loans
            </a>

            {/* EMI CALCULATOR */}

            <a
              href="/#emi-calculator"
              className="rounded-lg px-3 py-2 text-[13px] font-semibold text-[#183f55] transition-all duration-200 hover:bg-[#e9f8fb] hover:text-[#08aeca] hover:shadow-sm"
            >
              EMI Calculator
            </a>

            {/* ABOUT */}

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

            {/* ================= BROKER LOGIN ================= */}

            <button
              type="button"
              onClick={openBrokerLogin}
              className="ml-2 flex h-[48px] items-center justify-center rounded-lg border border-slate-300 bg-white px-6 !text-[12px] !font-extrabold text-[#082f42] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#08b8d4] hover:bg-[#f7fdfe] hover:shadow-md"
            >
              CONNECTOR LOGIN →
            </button>

            {/* ================= APPLY NOW ================= */}

            <a
              href="/#apply"
              className="lk-header-apply flex h-[48px] items-center justify-center rounded-lg bg-[#08b8d4] px-6 text-[12px] font-extrabold shadow-lg shadow-cyan-500/15 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#079eb7]"
            >
              APPLY NOW →
            </a>

          </nav>

          {/* ================= MOBILE BUTTON ================= */}

          <button
            type="button"
            onClick={() => setMobileMenu(!mobileMenu)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-lg lg:hidden"
            aria-label="Open menu"
          >
            {mobileMenu ? "×" : "☰"}
          </button>

        </div>

        {/* ================= MOBILE MENU ================= */}

        {mobileMenu && (
          <div className="border-t border-slate-200 bg-white px-5 py-4 shadow-lg lg:hidden">

            <div className="space-y-1">

              <a
                href="/"
                onClick={closeMenu}
                className="block rounded-lg px-3 py-2.5 text-[15px] font-semibold transition-all hover:bg-[#e9f8fb] hover:text-[#08aeca]"
              >
                Home
              </a>

              <a
                href="/#loans"
                onClick={closeMenu}
                className="block rounded-lg px-3 py-2.5 text-[15px] font-semibold transition-all hover:bg-[#e9f8fb] hover:text-[#08aeca]"
              >
                Loans
              </a>

              <a
                href="/#emi-calculator"
                onClick={closeMenu}
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
                    onClick={closeMenu}
                    className="block rounded-lg px-3 py-2.5 text-[14px] font-semibold transition-all hover:bg-[#e9f8fb] hover:text-[#08aeca]"
                  >
                    About Us
                  </a>

                  <a
                    href="/about/team"
                    onClick={closeMenu}
                    className="block rounded-lg px-3 py-2.5 text-[14px] font-semibold transition-all hover:bg-[#e9f8fb] hover:text-[#08aeca]"
                  >
                    Our Team
                  </a>

                  <a
                    href="/about/faq"
                    onClick={closeMenu}
                    className="block rounded-lg px-3 py-2.5 text-[14px] font-semibold transition-all hover:bg-[#e9f8fb] hover:text-[#08aeca]"
                  >
                    FAQ
                  </a>

                </div>
              )}

              {/* CONTACT */}

              <a
                href="/contact"
                onClick={closeMenu}
                className="block rounded-lg px-3 py-2.5 text-[15px] font-semibold transition-all hover:bg-[#e9f8fb] hover:text-[#08aeca]"
              >
                Contact
              </a>

              {/* MOBILE BROKER LOGIN */}

              <button
                type="button"
                onClick={openBrokerLogin}
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white py-3 text-[10px] font-extrabold text-[#082f42] transition-all hover:border-[#08b8d4] hover:bg-[#f7fdfe]"
              >
                CONNECTOR LOGIN →
              </button>

              {/* MOBILE APPLY */}

              <a
                href="/#apply"
                onClick={closeMenu}
                className="mt-2 block rounded-lg bg-[#08b8d4] py-3 text-center text-[10px] font-extrabold text-white transition-all hover:bg-[#079eb7]"
              >
                APPLY NOW →
              </a>

            </div>
          </div>
        )}

      </header>

      {/* ================= BROKER AUTH POPUP ================= */}

      <BrokerAuthModal
        open={brokerModal}
        onClose={() => setBrokerModal(false)}
        defaultMode={brokerMode}
      />
    </>
  );
}