import { SEOHead } from '../../components/seo-head';
import { StructuredData } from '../../components/structured-data';
import { Link } from 'react-router';
import { SITE_URL } from '../../config/site';

export default function IndependentContractorLanding() {
  const title = 'Independent Contractor Agreement | CodecDocument';
  const desc = 'Create independent contractor agreements quickly. Protect your freelance work with clear payment terms, scope, and secure online signatures.';
  const canonicalUrl = `${SITE_URL}/independent-contractor-agreement`;

  return (
    <div>
      <SEOHead title={title} description={desc} canonicalUrl={canonicalUrl} />
      <StructuredData />
      <main className="max-w-4xl mx-auto py-16 px-6">
        <h1 className="text-3xl font-bold">Independent Contractor Agreement</h1>
        <p className="mt-4 text-lg text-slate-600">Generate contractor agreements tailored to your project. Secure signatures, identity verification, and audit logs are included.</p>
        <div className="mt-8">
          <Link to="/generator/independent-contractor" className="p-4 rounded-lg border hover:shadow">Create Agreement</Link>
        </div>
        <section className="mt-12 rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-2xl font-semibold">Protect your freelance business</h2>
          <p className="mt-4 text-slate-700">Build contracts that clearly define scope, payment schedule, deliverables, and ownership rights so both parties know what to expect.</p>
          <ul className="mt-4 list-disc pl-6 text-slate-700">
            <li>Custom payment terms and milestone language.</li>
            <li>Clear intellectual property and confidentiality sections.</li>
            <li>ESIGN-compliant signature collection and PDF audit reports.</li>
            <li>Fast contract generation for one-off gigs or ongoing retainers.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
