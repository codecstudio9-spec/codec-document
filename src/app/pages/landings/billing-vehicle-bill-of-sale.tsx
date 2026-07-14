import { SEOHead } from '../../components/seo-head';
import { StructuredData } from '../../components/structured-data';
import { Link } from 'react-router';
import { SITE_URL } from '../../config/site';

export default function VehicleBillOfSaleLanding() {
  const title = 'Vehicle Bill of Sale | CodecDocument';
  const desc = 'Create a vehicle bill of sale with buyer and seller details, odometer disclosure, and secure e-signatures. Download an audit-ready PDF instantly.';
  const canonicalUrl = `${SITE_URL}/vehicle-bill-of-sale`;

  return (
    <div>
      <SEOHead title={title} description={desc} canonicalUrl={canonicalUrl} />
      <StructuredData />
      <main className="max-w-4xl mx-auto py-16 px-6">
        <h1 className="text-3xl font-bold">Vehicle Bill of Sale</h1>
        <p className="mt-4 text-lg text-slate-600">Generate a vehicle bill of sale that records sale terms, odometer reading, and signatures. Use online signing and verification.</p>
        <div className="mt-8">
          <Link to="/generator/bill-of-sale-vehicle" className="p-4 rounded-lg border hover:shadow">Create Bill of Sale</Link>
        </div>
        <section className="mt-12 rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-2xl font-semibold">Sell vehicles safely</h2>
          <p className="mt-4 text-slate-700">Document the sale with all the information buyers, sellers, and DMV offices expect. Complete the transaction online and keep a secure copy for your records.</p>
          <ul className="mt-4 list-disc pl-6 text-slate-700">
            <li>Buyer/seller information and vehicle details.</li>
            <li>Odometer disclosure and sale price.</li>
            <li>ESIGN-compliant signature with audit trail.</li>
            <li>Instant downloadable PDF for DMV or title transfer.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
