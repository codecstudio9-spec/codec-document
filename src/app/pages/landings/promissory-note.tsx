import { SEOHead } from '../../components/seo-head';
import { StructuredData } from '../../components/structured-data';
import { Link } from 'react-router';

export default function PromissoryNoteLanding() {
  const title = 'Promissory Note Generator | CodecDocument';
  const desc = 'Create promissory notes for personal or business loans with clear payment terms, interest schedules, and secure e-signatures.';
  const canonicalUrl = 'https://codecdocument.com/promissory-note';

  return (
    <div>
      <SEOHead title={title} description={desc} canonicalUrl={canonicalUrl} />
      <StructuredData />
      <main className="max-w-4xl mx-auto py-16 px-6">
        <h1 className="text-3xl font-bold">Promissory Note Generator</h1>
        <p className="mt-4 text-lg text-slate-600">Generate legally-sound promissory notes and collect signatures online. Customize payment schedules and interest terms.</p>
        <div className="mt-8">
          <Link to="/generator/promissory-note" className="p-4 rounded-lg border hover:shadow">Create Promissory Note</Link>
        </div>
        <section className="mt-12 rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-2xl font-semibold">Loan agreements that protect both parties</h2>
          <p className="mt-4 text-slate-700">Create a clear payment agreement for loans between individuals or business partners, with documentation that supports accountability and repayment clarity.</p>
          <ul className="mt-4 list-disc pl-6 text-slate-700">
            <li>Define borrower, lender, loan amount, and repayment terms.</li>
            <li>Include interest rate, due date, and late fee provisions.</li>
            <li>Collect electronic signatures with audit evidence.</li>
            <li>Download a reliable PDF for your records.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
