import SiteHeader from "../../../../components/SiteHeader";
import SiteFooter from "../../../../components/SiteFooter";

const faqs = [
  {
    question: "What type of loans does LoanKarts assist with?",
    answer:
      "LoanKarts provides assistance for personal, business, home, loan against property, car and education loan requirements.",
  },
  {
    question: "Can I apply for a loan online?",
    answer:
      "Yes. You can share your basic requirement through our online application and our team can contact you for the next steps.",
  },
  {
    question: "Do you help with documentation?",
    answer:
      "Yes. Our team can help you understand the basic documentation required for your loan application.",
  },
  {
    question: "Do you provide assistance across India?",
    answer:
      "LoanKarts provides loan assistance for customers across India, subject to lender availability and eligibility.",
  },
  {
    question: "Is loan approval guaranteed?",
    answer:
      "No. Final approval, interest rate, fees and disbursement depend on the selected lender and the applicant's eligibility.",
  },
];

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-white text-[#082f42]">
      <SiteHeader />

      <section className="bg-[#062536]">
        <div className="mx-auto max-w-[1180px] px-5 py-20 sm:px-6">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#08b8d4]">
            FREQUENTLY ASKED QUESTIONS
          </p>

          <h1 className="mt-4 text-4xl font-black text-white sm:text-6xl">
            How Can We <span className="text-[#08b8d4]">Help?</span>
          </h1>

          <p className="mt-6 max-w-[700px] text-lg leading-8 text-white/65">
            Find answers to some of the common questions about LoanKarts and
            our loan assistance process.
          </p>
        </div>
      </section>

      <section className="bg-[#f7fbfc]">
        <div className="mx-auto max-w-[900px] px-5 py-16 sm:px-6">
          <div className="space-y-4">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <summary className="cursor-pointer text-lg font-extrabold text-[#082f42]">
                  {faq.question}
                </summary>

                <p className="mt-4 text-[15px] leading-7 text-slate-500">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}