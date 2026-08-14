import SiteHeader from "../../../../components/SiteHeader";
import SiteFooter from "../../../../components/SiteFooter";

export default function TeamPage() {
  return (
    <main className="min-h-screen bg-white text-[#082f42]">
      <SiteHeader />

      <section className="bg-[#062536]">
        <div className="mx-auto max-w-[1180px] px-5 py-20 sm:px-6">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#08b8d4]">
            OUR TEAM
          </p>

          <h1 className="mt-4 text-4xl font-black text-white sm:text-6xl">
            Meet Our <span className="text-[#08b8d4]">Team</span>
          </h1>

          <p className="mt-6 max-w-[700px] text-lg leading-8 text-white/65">
            Our team is here to understand your requirement and provide
            professional loan assistance.
          </p>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-[1180px] px-5 py-16 sm:px-6">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#08aeca]">
            WHO YOU'LL WORK WITH
          </p>

          <h2 className="mt-3 text-3xl font-black text-[#082f42] sm:text-5xl">
            LoanKarts Team
          </h2>

          <p className="mt-5 max-w-[750px] text-lg leading-8 text-slate-500">
            Our professionals work together to understand your requirement,
            coordinate documentation and assist throughout the loan process.
          </p>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}