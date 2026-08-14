import SiteHeader from "../../../components/SiteHeader";
import SiteFooter from "../../../components/SiteFooter";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white text-[#082f42]">
      <SiteHeader />

      {/* HERO */}
      <section className="bg-[#062536]">
        <div className="mx-auto max-w-[1180px] px-5 py-20 sm:px-6">
          <div className="max-w-[850px]">
            <p className="mb-5 text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#08b8d4]">
              ABOUT LOANKARTS
            </p>

            <h1 className="text-4xl font-black leading-tight text-white sm:text-6xl">
              Your Trusted{" "}
              <span className="text-[#08b8d4]">Loan Assistance</span> Partner
            </h1>

            <p className="mt-6 max-w-[800px] text-lg leading-8 text-white/65">
              LoanKarts provides professional loan assistance for personal,
              business, home, vehicle and other financial requirements across
              India.
            </p>
          </div>
        </div>
      </section>

      {/* ABOUT CONTENT */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1180px] px-5 py-16 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#08aeca]">
                WHO WE ARE
              </p>

              <h2 className="mt-3 text-3xl font-black leading-tight text-[#082f42] sm:text-5xl">
                Making the loan process simpler.
              </h2>

              <p className="mt-6 text-lg leading-8 text-slate-500">
                At LoanKarts, we understand that finding the right loan can be
                confusing. Our team helps customers understand their
                requirements and available lending options.
              </p>

              <p className="mt-4 text-lg leading-8 text-slate-500">
                We assist throughout the journey, from requirement assessment
                and documentation to lender coordination and processing.
              </p>
            </div>

            <div className="rounded-3xl border border-[#d9eef3] bg-[#f5fcfd] p-7">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="rounded-2xl bg-white p-6 shadow-sm">
                  <p className="text-3xl font-black text-[#08aeca]">PAN</p>
                  <p className="mt-2 font-semibold text-[#082f42]">
                    India Service
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-sm">
                  <p className="text-3xl font-black text-[#08aeca]">30+</p>
                  <p className="mt-2 font-semibold text-[#082f42]">
                    Financial Channels
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-sm">
                  <p className="text-3xl font-black text-[#08aeca]">8+</p>
                  <p className="mt-2 font-semibold text-[#082f42]">
                    Years Experience
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-sm">
                  <p className="text-3xl font-black text-[#08aeca]">5K+</p>
                  <p className="mt-2 font-semibold text-[#082f42]">
                    Customers Assisted
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* OUR APPROACH */}
      <section className="bg-[#f7fbfc]">
        <div className="mx-auto max-w-[1180px] px-5 py-16 sm:px-6">
          <div className="text-center">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#08aeca]">
              OUR APPROACH
            </p>

            <h2 className="mt-3 text-3xl font-black text-[#082f42] sm:text-5xl">
              How LoanKarts Helps
            </h2>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e8f9fc] text-xl">
                01
              </div>

              <h3 className="mt-5 text-xl font-extrabold text-[#082f42]">
                Understand
              </h3>

              <p className="mt-3 leading-7 text-slate-500">
                We understand your loan requirement and basic profile.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e8f9fc] text-xl">
                02
              </div>

              <h3 className="mt-5 text-xl font-extrabold text-[#082f42]">
                Match
              </h3>

              <p className="mt-3 leading-7 text-slate-500">
                We identify suitable lending options based on your profile.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e8f9fc] text-xl">
                03
              </div>

              <h3 className="mt-5 text-xl font-extrabold text-[#082f42]">
                Support
              </h3>

              <p className="mt-3 leading-7 text-slate-500">
                We assist with documentation, processing and lender
                coordination.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#062536]">
        <div className="mx-auto max-w-[1180px] px-5 py-14 text-center sm:px-6">
          <h2 className="text-3xl font-black text-white sm:text-4xl">
            Need help with a loan?
          </h2>

          <p className="mx-auto mt-4 max-w-[650px] text-white/60">
            Share your requirement with our team and let us help you with the
            next steps.
          </p>

          <a
            href="/contact"
            className="mt-7 inline-flex rounded-lg bg-[#08b8d4] px-7 py-3 font-extrabold text-white transition hover:bg-[#079eb7]"
          >
            CONTACT US →
          </a>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}