import { SEOHead } from '../../components/seo-head';
import { StructuredData } from '../../components/structured-data';
import { Link } from 'react-router';

export default function ElectronicSignatureLanding() {
  const title = 'Electronic Signature Platform | CodecDocument';
  const desc = 'ESIGN Act compliant electronic signatures with selfie identity verification, geolocation audit trail and secure online signing for NDAs, leases, service agreements and more.';
  const canonicalUrl = 'https://codecdocument.com/electronic-signature';

  return (
    <div>
      <SEOHead title={title} description={desc} canonicalUrl={canonicalUrl} />
      <StructuredData />
      <main className="max-w-4xl mx-auto py-16 px-6">
        <h1 className="text-3xl font-bold">Electronic Signatures — Create, Sign & Verify</h1>
        <p className="mt-4 text-lg text-slate-600">Sign documents online with ESIGN Act compliance. Verify signer identity with selfies, capture ID, and preserve a tamper-evident audit trail for legal evidence.</p>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link to="/generator/residential-lease" className="p-4 rounded-lg border hover:shadow">Sign Lease</Link>
          <Link to="/generator/nda" className="p-4 rounded-lg border hover:shadow">Sign NDA</Link>
        </div>
        <section className="mt-12">
          <h2 className="text-2xl font-semibold">Why choose our e-signature workflow?</h2>
          <p className="mt-4 text-slate-700">CodecDocument combines secure digital signing with identity verification so every signature is traceable, legally compliant, and ready for review by contracts teams or attorneys.</p>
          <ul className="mt-4 list-disc pl-6 text-slate-700">
            <li>Selfie + ID capture embedded directly in PDF audit pages.</li>
            <li>SHA-256 hash audit trail for every signed agreement.</li>
            <li>Geolocation and timestamp logging for signer validation.</li>
            <li>Daily free signatures with premium unlimited signing plans.</li>
          </ul>
        </section>
        <section className="mt-12 rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-2xl font-semibold">How it works</h2>
          <ol className="mt-4 list-decimal pl-6 text-slate-700">
            <li>Upload or choose a document template.</li>
            <li>Invite signers or sign yourself with a secure link.</li>
            <li>Capture selfie verification and finish with a signed PDF.</li>
          </ol>
        </section>
      </main>
    </div>
  );
}
