import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Search, FileText, ArrowRight, LayoutGrid, type LucideIcon } from 'lucide-react';
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

/**
 * Un círculo del menú de secciones.
 *
 * Inactivo es un disco blanco con el icono en el color de su sección y un
 * anillo tenue del mismo color; activo se rellena de ese color con una sombra
 * proyectada del mismo tono. Así el estado se ve por el color y por el
 * relieve, no sólo por un borde —que a este tamaño casi no se distingue.
 */
function CirculoSeccion({ activa, color, Icono, nombre, cuantas, onClick }: {
  activa: boolean;
  color: string;
  Icono: LucideIcon;
  nombre: string;
  cuantas: number;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="group flex w-[86px] flex-col items-center gap-2">
      <motion.span
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.94 }}
        className="relative flex size-[62px] items-center justify-center rounded-full transition-colors"
        style={activa
          ? { background: color, boxShadow: `0 12px 26px ${color}59` }
          : { background: '#fff', boxShadow: CARD_SHADOW, border: `1.5px solid ${color}26` }}
      >
        <Icono className="size-[23px]" style={{ color: activa ? '#fff' : color }} />
        <span
          className="absolute -right-1 -top-1 flex min-w-[20px] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-black tabular-nums"
          style={activa
            ? { background: '#fff', color }
            : { background: color, color: '#fff' }}
        >
          {cuantas}
        </span>
      </motion.span>
      <span
        className="text-center text-[11px] font-bold leading-tight transition-colors"
        style={{ color: activa ? color : '#475569' }}
      >
        {nombre}
      </span>
    </button>
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

      {/* Secciones en círculos.
          Una fila de pastillas de texto de anchos distintos se lee como una
          lista desordenada; un círculo por sección, todos del mismo tamaño y
          alineados, se lee como un menú. El icono hace el trabajo de
          reconocimiento —una casa se identifica antes que la palabra
          «Inmobiliaria»— y el número dice cuántas plantillas hay dentro sin
          tener que entrar a mirar. */}
      <div className="mt-6 flex flex-wrap gap-x-5 gap-y-4">
        <CirculoSeccion
          activa={activeCategory === null}
          color="#0F172A"
          Icono={LayoutGrid}
          nombre={language === 'en' ? 'All' : 'Todas'}
          cuantas={documentTemplates.length}
          onClick={() => setActiveCategory(null)}
        />

        {CATEGORIAS.map((c) => {
          const cuantas = documentTemplates.filter((t) => claveCategoria(t.category) === c.id).length;
          if (cuantas === 0) return null;
          return (
            <CirculoSeccion
              key={c.id}
              activa={activeCategory === c.id}
              color={c.color}
              Icono={c.icono}
              nombre={nombreCategoria(c.id, language)}
              cuantas={cuantas}
              onClick={() => setActiveCategory(activeCategory === c.id ? null : c.id)}
            />
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
