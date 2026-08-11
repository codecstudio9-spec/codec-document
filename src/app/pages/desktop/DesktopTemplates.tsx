import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Search, FileText, Home, Briefcase, Building2, DollarSign, Globe, ArrowRight, LayoutGrid } from 'lucide-react';
import { DesktopAppShell } from '../../components/desktop/DesktopAppShell';
import { useLanguage } from '../../contexts/language-context';
import { documentTemplates } from '../../data/templates';
import { CATEGORIAS, claveCategoria, nombreCategoria, metaCategoria } from '../../data/categories-meta';
import { getDocumentTranslation } from '../../data/document-translations';
import { CARD_RADIUS, CARD_SHADOW } from '../../styles/mobile-theme';

export function DesktopTemplates() {
  return (
    <DesktopAppShell>
      <TemplatesContent />
    </DesktopAppShell>
  );
}

function TemplatesContent() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return documentTemplates.filter((t) => {
      const matchesCategory = !activeCategory || claveCategoria(t.category) === activeCategory;
      const matchesQuery = !q || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [query, activeCategory]);

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-black text-slate-900">{language === 'en' ? 'Templates' : 'Plantillas'}</h1>

      <div className="mt-5 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={language === 'en' ? 'Search templates...' : 'Buscar plantillas...'}
            className="w-full rounded-2xl bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none"
            style={{ boxShadow: CARD_SHADOW }}
          />
        </div>
      </div>

      {/* Menú de secciones. Iconos y no sólo texto: el contador reconoce
          antes un icono de casa que la frase «Real Estate & Property», y
          además los nombres estaban sin traducir. Cada botón muestra
          cuántas plantillas tiene, para que no haya que entrar a
          descubrir que una sección está vacía. */}
      <div className="mt-5 flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={() => setActiveCategory(null)}
          className="flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition"
          style={activeCategory === null
            ? { background: '#0F172A', color: '#fff' }
            : { background: '#fff', color: '#334155', boxShadow: CARD_SHADOW }}
        >
          <LayoutGrid className="size-4" />
          {language === 'en' ? 'All' : 'Todas'}
          <span className="tabular-nums opacity-60">{documentTemplates.length}</span>
        </button>

        {CATEGORIAS.map((c) => {
          const activa = activeCategory === c.id;
          const cuantas = documentTemplates.filter((t) => claveCategoria(t.category) === c.id).length;
          if (cuantas === 0) return null;
          const Icono = c.icono;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveCategory(activa ? null : c.id)}
              className="flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition"
              style={activa
                ? { background: c.color, color: '#fff', boxShadow: `0 10px 22px ${c.color}44` }
                : { background: '#fff', color: '#334155', boxShadow: CARD_SHADOW }}
            >
              <Icono className="size-4" style={{ color: activa ? '#fff' : c.color }} />
              {nombreCategoria(c.id, language)}
              <span className="tabular-nums opacity-60">{cuantas}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-3 bg-white px-6 py-16 text-center" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}>
            <Search className="mx-auto mb-2 size-7 text-slate-300" />
            <p className="text-sm font-semibold text-slate-500">{language === 'en' ? 'No results' : 'Sin resultados'}</p>
          </div>
        ) : (
          filtered.map((t) => {
            // Por la clave normalizada, no por la categoría cruda: las
            // plantillas en español la traen traducida y se quedaban con el
            // icono genérico.
            const meta = metaCategoria(claveCategoria(t.category));
            const Icon = meta?.icono ?? FileText;
            const acento = meta?.color ?? '#4F46E5';
            const name = getDocumentTranslation(t.id, 'name', language) || t.name;
            const description = getDocumentTranslation(t.id, 'desc', language) || t.description;
            return (
              <motion.div
                key={t.id}
                whileHover={{ y: -2 }}
                className="flex flex-col gap-3 bg-white p-5"
                style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}
              >
                <div className="flex size-11 items-center justify-center rounded-2xl" style={{ background: acento + "14" }}>
                  <Icon className="size-5" style={{ color: acento }} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900">{name}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500">{description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/generator/${t.id}`)}
                  className="mt-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' }}
                >
                  {language === 'en' ? 'Use template' : 'Usar plantilla'} <ArrowRight className="size-3.5" />
                </button>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
