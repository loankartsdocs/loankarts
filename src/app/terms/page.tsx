import SiteHeader from "../../../components/SiteHeader";
import SiteFooter from "../../../components/SiteFooter";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white text-[#082f42]">
      <SiteHeader />

      <section className="mx-auto max-w-[1000px] px-5 py-20 sm:px-6">
        <p className="text-[12px] font-extrabold uppercase tracking-[.22em] text-[#08aeca]">
          LEGAL
        </p>

        <h1 className="mt-4 text-5xl font-black">
          Terms & Conditions
        </h1>

        <p className="mt-6 text-lg leading-8 text-slate-500">
          Please read these terms carefully before using LoanKarts services.
        </p>

        <div className="mt-12 space-y-9">
          <section>
            <h2 className="text-2xl font-black">Loan Assistance</h2>
            <p className="mt-3 leading-8 text-slate-600">
              LoanKarts provides assistance and guidance related to loan
              requirements. Loan approval and final terms are subject to the
              respective lender's policies and eligibility criteria.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black">Customer Information</h2>
            <p className="mt-3 leading-8 text-slate-600">
              Customers are responsible for providing accurate and complete
              information and documents required for their application.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black">Lender Decision</h2>
            <p className="mt-3 leading-8 text-slate-600">
              LoanKarts does not guarantee approval, loan amount, interest
              rate or disbursement. Final decisions are made by the relevant
              lender.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black">Contact</h2>
            <p className="mt-3 leading-8 text-slate-600">
              For questions regarding these terms, contact
              docs@loankarts.com.
            </p>
          </section>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}