import { Check } from 'lucide-react';
import { useLanguage } from '../contexts/language-context';
import { motion } from 'motion/react';

export function ComparisonTable() {
  const { language } = useLanguage();

  const rows = language === 'en'
    ? [
        'State-specific legal compliance',
        'Detailed legal clauses and structures',
        'Professional formatting and legal hierarchy',
        'Free preview with watermark',
        'One-time payment options',
        'Immediate PDF delivery',
        'Complete customization (30+ fields)',
        'Bilingual legal support (EN/ES)',
        'Legal guidance and disclaimers',
        'QR digital signatures',
        'Logo personalization',
        'White-label legal branding',
        'Consistent enterprise-level output',
      ]
    : [
        'Cumplimiento legal específico por estado',
        'Cláusulas y estructura legal detallada',
        'Formato profesional con jerarquía legal',
        'Vista previa gratis con marca de agua',
        'Opciones de pago único',
        'Entrega inmediata en PDF',
        'Personalización completa (30+ campos)',
        'Soporte legal bilingüe (EN/ES)',
        'Guía legal y descargos incluidos',
        'Firmas digitales QR',
        'Personalización de logo',
        'Marca blanca legal',
        'Resultado consistente nivel empresarial',
      ];

  const codecHas = new Array(rows.length).fill(true);
  const aiHas = [
    false,
    false,
    false,
    false,
    false,
    true,
    true,
    false,
    false,
    false,
    false,
    false,
  ];

  return (
    <section className="py-14 bg-gradient-to-b from-white to-slate-50 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-10 md:mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-6 tracking-wide"
            >
              {language === 'en' ? 'Platform Comparison' : 'Compara la Plataforma'}
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-3xl md:text-5xl font-bold mb-3 md:mb-4"
            >
              {language === 'en'
                ? 'Codec Document vs Standard AI'
                : 'Codec Document vs IA'}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-base text-slate-600 max-w-3xl mx-auto md:text-xl"
            >
              {language === 'en'
                ? 'A robust visual comparison so clients instantly understand why Codec AI+ delivers more legal value.'
                : 'Una comparativa robusta para que tus clientes entiendan al instante por qué Codec AI+ entrega más valor legal.'}
            </motion.p>
          </div>

          {/* Comparison Table */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden"
          >
            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left p-6 font-semibold text-slate-700 bg-slate-50">
                      {language === 'en' ? 'Capabilities' : 'Capacidades'}
                    </th>
                    <th className="p-6 text-center font-semibold bg-gradient-to-br from-blue-600 to-indigo-600 text-white relative">
                      <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-bl-lg">
                        {language === 'en' ? 'PREMIUM' : 'PREMIUM'}
                      </div>
                      <div className="pt-2">Codec AI+</div>
                    </th>
                    <th className="p-6 text-center font-semibold bg-slate-50 text-slate-700">
                      {language === 'en' ? 'Standard AI' : 'IA Estándar'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((feature, featureIdx) => (
                    <tr
                      key={featureIdx}
                      className={`border-b border-slate-100 ${
                        featureIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                      }`}
                    >
                      <td className="p-6 text-slate-700">{feature}</td>
                      <td className="p-6 text-center bg-blue-50/50">
                        {codecHas[featureIdx] ? <Check className="size-6 text-green-600 mx-auto" strokeWidth={3} /> : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="p-6 text-center text-slate-400">
                        {aiHas[featureIdx] ? <Check className="size-6 text-amber-500 mx-auto" strokeWidth={3} /> : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden">
              {rows.map((feature, idx) => (
                <div key={feature} className="border-b border-slate-100 p-4 bg-white">
                  <p className="text-sm font-semibold text-slate-800 mb-2">{feature}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-700 font-semibold">Codec AI+</span>
                    {codecHas[idx] ? <Check className="size-5 text-green-600" strokeWidth={3} /> : <span className="text-slate-400">—</span>}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm text-slate-600">{language === 'en' ? 'Standard AI' : 'IA Estándar'}</span>
                    {aiHas[idx] ? <Check className="size-5 text-amber-500" strokeWidth={3} /> : <span className="text-slate-400">—</span>}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-center mt-12"
          >
            <p className="text-lg text-slate-600 mb-6">
              {language === 'en'
                ? 'Choose a legal workflow that looks and feels enterprise-grade.'
                : 'Elige un flujo legal que se vea y se sienta de nivel empresarial.'}
            </p>
            <button
              onClick={() => document.getElementById('documents-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 inline-flex items-center gap-2"
            >
              {language === 'en' ? 'Get Started Now' : 'Comenzar Ahora'}
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
