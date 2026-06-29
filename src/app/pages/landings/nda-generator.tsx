import { SEOHead } from '../../components/seo-head';
import { StructuredData } from '../../components/structured-data';
import { Link } from 'react-router';

export default function NdaGeneratorLanding() {
  const title = 'Free NDA Generator | CodecDocument';
  const desc = 'Generate NDAs tailored to your business and state. Sign securely online with identity verification and a full audit trail.';
  const canonicalUrl = 'https://codecdocument.com/nda-generator';

  return (
    <div>
      <SEOHead title={title} description={desc} canonicalUrl={canonicalUrl} />
      <StructuredData />
      <main className="max-w-4xl mx-auto py-16 px-6">
        <h1 className="text-3xl font-bold">NDA Generator</h1>
        <p className="mt-4 text-lg text-slate-600">Create a non-disclosure agreement in minutes and get it signed securely with identity verification and audit evidence.</p>
        <div className="mt-8">
          <Link to="/generator/nda" className="p-4 rounded-lg border hover:shadow">Create NDA</Link>
        </div>
        <section className="mt-12 rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-2xl font-semibold">Why NDAs matter</h2>
          <p className="mt-4 text-slate-700">Protect your business, employees, and partners with a legally sound NDA. Our generator helps you lock in confidentiality terms quickly and consistently.</p>
          <ul className="mt-4 list-disc pl-6 text-slate-700">
            <li>Customize parties, duration, and disclosure scope.</li>
            <li>Use state-specific governance clauses for reliability.</li>
            <li>Sign online with biometric identity capture.</li>
            <li>Download an audit-ready PDF for every transaction.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
