import SiteHeader from "../../../components/SiteHeader";
import SiteFooter from "../../../components/SiteFooter";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-white text-[#082f42]">
      <SiteHeader />

      <section className="mx-auto max-w-[1180px] px-5 py-20 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <p className="text-[12px] font-extrabold uppercase tracking-[.22em] text-[#08aeca]">
              CONTACT US
            </p>

            <h1 className="mt-4 text-5xl font-black leading-tight sm:text-6xl">
              Let's discuss your requirement.
            </h1>

            <p className="mt-6 max-w-[650px] text-lg leading-8 text-slate-500">
              Share your basic requirement and our team can contact you to
              understand your profile and next steps.
            </p>

            <div className="mt-10 space-y-6 text-lg">
              <a
                href="tel:+919315743939"
                className="block font-semibold hover:text-[#08aeca]"
              >
                ☎ +91 93157 43939
              </a>

              <a
                href="mailto:docs@loankarts.com"
                className="block font-semibold hover:text-[#08aeca]"
              >
                @ docs@loankarts.com
              </a>

              <p>⌖ Faridabad, Haryana, India</p>
            </div>
          </div>

          <form className="rounded-3xl border border-slate-200 p-7 shadow-sm sm:p-9">
            <h2 className="text-2xl font-black">Tell us what you need</h2>

            <div className="mt-7 grid gap-4">
              <input
                placeholder="Full Name"
                className="rounded-xl border border-slate-300 px-4 py-4 outline-none focus:border-[#08aeca]"
              />

              <input
                placeholder="Mobile Number"
                className="rounded-xl border border-slate-300 px-4 py-4 outline-none focus:border-[#08aeca]"
              />

              <input
                placeholder="Email Address"
                className="rounded-xl border border-slate-300 px-4 py-4 outline-none focus:border-[#08aeca]"
              />

              <select className="rounded-xl border border-slate-300 px-4 py-4 outline-none focus:border-[#08aeca]">
                <option>Select Loan Type</option>
                <option>Personal Loan</option>
                <option>Business Loan</option>
                <option>Home Loan</option>
                <option>Loan Against Property</option>
                <option>Car Loan</option>
                <option>Education Loan</option>
              </select>

              <textarea
                rows={5}
                placeholder="Tell us about your requirement"
                className="rounded-xl border border-slate-300 px-4 py-4 outline-none focus:border-[#08aeca]"
              />

              <button
                type="submit"
                className="rounded-xl bg-[#08b8d4] px-6 py-4 font-extrabold text-white hover:bg-[#079eb7]"
              >
                SUBMIT REQUIREMENT
              </button>
            </div>
          </form>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}