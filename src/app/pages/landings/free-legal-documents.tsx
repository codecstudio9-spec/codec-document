import { SEOHead } from '../../components/seo-head';
import { StructuredData } from '../../components/structured-data';
import { Link } from 'react-router';

export default function FreeLegalDocumentsLanding() {
  const title = 'Free Legal Documents | CodecDocument';
  const desc = 'Create free legal documents online with state-specific templates, ESIGN-compliant signing, and identity verification. Start for free today.';
  const canonicalUrl = 'https://codecdocument.com/free-legal-documents';

  return (
    <div>
      <SEOHead title={title} description={desc} canonicalUrl={canonicalUrl} />
      <StructuredData />
      <main className="max-w-4xl mx-auto py-16 px-6">
        <h1 className="text-3xl font-bold">Free Legal Documents</h1>
        <p className="mt-4 text-lg text-slate-600">Create, sign, and verify legal documents online with CodecDocument. Use free templates for NDAs, lease agreements, service contracts, promissory notes, and vehicle bills of sale.</p>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link to="/generator/nda" className="p-4 rounded-lg border hover:shadow">Create NDA</Link>
          <Link to="/generator/residential-lease" className="p-4 rounded-lg border hover:shadow">Create Lease Agreement</Link>
          <Link to="/generator/service-agreement" className="p-4 rounded-lg border hover:shadow">Create Service Agreement</Link>
          <Link to="/generator/promissory-note" className="p-4 rounded-lg border hover:shadow">Create Promissory Note</Link>
        </div>
        <section className="mt-12">
          <h2 className="text-2xl font-semibold">Why CodecDocument?</h2>
          <p className="mt-4 text-slate-700">Build legally structured documents fast, with state-specific language that improves reliability and reduces review time. Our platform combines free templates, audit-ready signing, and identity verification so you can launch with confidence.</p>
          <ul className="mt-4 list-disc pl-6 text-slate-700">
            <li>Free legal document templates for top business and personal agreements.</li>
            <li>ESIGN Act compliant electronic signature and audit trail.</li>
            <li>State-specific clauses for all 50 U.S. states.</li>
            <li>Fast online delivery with no hidden fees.</li>
          </ul>
        </section>
        <section className="mt-12 rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-2xl font-semibold">How it works</h2>
          <ol className="mt-4 list-decimal pl-6 text-slate-700">
            <li>Choose the document type you need.</li>
            <li>Fill out the form with your details and state.</li>
            <li>Preview the full contract and download or sign instantly.</li>
          </ol>
        </section>
      </main>
    </div>
  );
}
