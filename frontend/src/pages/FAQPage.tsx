import { useDB } from '../hooks/useDB';
import FAQAccordion from '../components/FAQAccordion';
import { HelpCircle } from 'lucide-react';

export default function FAQPage() {
  const db = useDB();

  return (
    <div id="faq-page-wrapper" className="space-y-12 py-12 md:py-16">
      {/* Header section */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4" id="faq-hero">
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#1763B6] tracking-tight">
          Frequently Asked Questions
        </h1>
        <p className="text-slate-500 text-sm sm:text-base max-w-2xl mx-auto">
          Find quick answers to common questions about our courses, schedules, and placements.
        </p>
      </section>

      {/* Output Render Accordion Container */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8" id="faq-grid-output">
        {db.faqs.length > 0 ? (
          <div className="space-y-6" id="faq-accordion-rendered">
            <FAQAccordion items={db.faqs} />
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-100 shadow-xs max-w-sm mx-auto" id="no-faq-matches">
            <div className="p-3 bg-slate-50 rounded-full w-12 h-12 flex items-center justify-center mx-auto text-slate-400">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800 text-sm mt-3">No FAQs Available</h4>
          </div>
        )}
      </section>
    </div>
  );
}
