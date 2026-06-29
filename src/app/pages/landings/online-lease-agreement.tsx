import { SEOHead } from '../../components/seo-head';
import { StructuredData } from '../../components/structured-data';
import { Link } from 'react-router';

export default function OnlineLeaseAgreementLanding() {
  const title = 'Online Lease Agreement Generator | CodecDocument';
  const desc = 'Create state-specific residential lease agreements online. Fill forms, preview, sign electronically, and get identity verification with audit-ready PDFs.';
  const canonicalUrl = 'https://codecdocument.com/online-lease-agreement';

  return (
    <div>
      <SEOHead title={title} description={desc} canonicalUrl={canonicalUrl} />
      <StructuredData />
      <main className="max-w-4xl mx-auto py-16 px-6">
        <h1 className="text-3xl font-bold">Online Lease Agreement Generator</h1>
        <p className="mt-4 text-lg text-slate-600">Create rental contracts tailored to your state, sign electronically, and collect tenant identity verification with a secure audit trail.</p>
        <div className="mt-8">
          <Link to="/generator/residential-lease" className="p-4 rounded-lg border hover:shadow">Start Lease Agreement</Link>
        </div>
        <section className="mt-12">
          <h2 className="text-2xl font-semibold">Why use our Lease Generator?</h2>
          <p className="mt-4 text-slate-700">Generate lease agreements with built-in state compliance and e-signatures so you can reduce risk, speed move-ins, and protect your rental business.</p>
          <ul className="mt-4 list-disc pl-6 text-slate-700">
            <li>State-specific lease terms for all 50 states.</li>
            <li>Tenant selfie + ID verification with geolocation.</li>
            <li>Audit-ready signed PDFs with tamper indication.</li>
            <li>Modern mobile-friendly signing flow for landlords.</li>
          </ul>
        </section>
        <section className="mt-12 rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-2xl font-semibold">What you get</h2>
          <p className="mt-4 text-slate-700">A fully completed lease agreement, preview before signing, and an e-signature-ready PDF you can download or send to a tenant instantly.</p>
        </section>
      </main>
    </div>
  );
}
