"use client";


export default function SiteFooter() {
  const goBroker = () => {
    window.dispatchEvent(
      new CustomEvent("open-broker-auth", {
        detail: {
          mode: "register",
        },
      })
    );
  };

  return (
    <footer className="bg-[#050b20] text-white">
      <div className="mx-auto max-w-[1180px] px-5 py-8 sm:px-6">

        <div className="grid items-stretch gap-6 lg:grid-cols-[0.9fr_1.1fr]">

          {/* LEFT SIDE */}
          <div className="flex flex-col justify-center py-2">

            <img
              src="/logo-white.png"
              alt="LoanKarts"
              className="h-auto w-[190px] object-contain"
            />

            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
              Get in{" "}
              <span className="text-[#08b8d4]">Touch</span>
            </h2>

            <p className="mt-2 max-w-[430px] text-[12px] leading-5 text-white/55">
              We’re here to help you with your loan needs. Reach out to us
              anytime.
            </p>

            {/* CONTACT */}
            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">

              <a
                href="mailto:docs@loankarts.com"
                className="flex items-center gap-3 text-[12px] font-semibold text-white/80 transition hover:text-[#08b8d4]"
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
                className="flex items-center gap-3 text-[12px] font-semibold text-white/80 transition hover:text-[#08b8d4]"
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

            {/* SOCIAL */}
            <div className="mt-4 flex items-center gap-2.5">

              <span className="mr-1 text-[9px] font-extrabold uppercase tracking-[.18em] text-white/45">
                Follow Us
              </span>

              <a
                href="#"
                aria-label="Facebook"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 transition hover:border-[#08b8d4] hover:bg-[#08b8d4]"
              >
                <img
                  src="/facebook.png"
                  alt="Facebook"
                  className="h-5 w-5 object-contain"
                />
              </a>

              <a
                href="#"
                aria-label="Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 transition hover:border-[#08b8d4] hover:bg-[#08b8d4]"
              >
                <img
                  src="/instagram.png"
                  alt="Instagram"
                  className="h-5 w-5 object-contain"
                />
              </a>

              <a
                href="#"
                aria-label="YouTube"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 transition hover:border-[#08b8d4] hover:bg-[#08b8d4]"
              >
                <img
                  src="/youtube.png"
                  alt="YouTube"
                  className="h-5 w-5 object-contain"
                />
              </a>

              <a
                href="https://wa.me/919315743939"
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 transition hover:border-[#08b8d4] hover:bg-[#08b8d4]"
              >
                <img
                  src="/whatspp.png"
                  alt="WhatsApp"
                  className="h-5 w-5 object-contain"
                />
              </a>

            </div>
          </div>

          {/* RIGHT SIDE */}
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
              onClick={goBroker}
              className="flex min-h-[220px] w-full flex-col items-center justify-center rounded-2xl border border-[#08b8d4]/30 bg-gradient-to-br from-[#082f42] via-[#0a5268] to-[#087d93] p-6 text-center transition duration-200 hover:-translate-y-1 hover:border-[#08b8d4]/70"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-3xl">
                🤝
              </div>

              <p className="mt-4 text-[10px] font-extrabold uppercase tracking-[.22em] text-[#16c6dc]">
                JOIN AS A BROKER
              </p>

              <h3 className="mt-3 text-[20px] font-black leading-tight text-white">
                Become a LoanKarts
                <br />
                Partner
              </h3>

              <div className="mt-4 h-[2px] w-10 bg-[#16c6dc]" />

              <p className="mt-3 text-[10px] leading-5 text-white/70">
                Are you a loan broker, DSA, agent,
                <br />
                financial professional or business
                <br />
                partner? Join our network.
              </p>

              <span className="mt-4 rounded-lg bg-white px-5 py-2.5 text-[10px] font-extrabold text-[#082f42]">
                JOIN AS BROKER →
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
  );
}