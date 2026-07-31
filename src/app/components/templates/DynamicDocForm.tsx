import { useEffect, useRef } from 'react';
import type { DetectedField } from '../../../lib/docxTemplateEngine';

interface DynamicDocFormProps {
  fields: DetectedField[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  language: 'en' | 'es';
  /** Field keys that should render with a red border/label — set by the
   * caller after a failed "Next"/"Generate" click, so the user can see
   * exactly which required fields are still empty instead of only a
   * generic toast. */
  invalidKeys?: Set<string>;
}

const MEMORY_KEY_PREFIX = 'codec_field_memory:';

/** Keys by the field's LABEL (normalized), not its {{tag}} key — the
 * point is "the last time I typed a phone number/email/name into ANY
 * template, remember it", not per-exact-template memory. */
function memoryKey(label: string): string {
  return MEMORY_KEY_PREFIX + label.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function rememberValue(label: string, value: string) {
  if (!value.trim()) return;
  try { localStorage.setItem(memoryKey(label), value); } catch { /* storage full/blocked — non-fatal */ }
}

function recalledValue(label: string): string {
  try { return localStorage.getItem(memoryKey(label)) ?? ''; } catch { return ''; }
}

/**
 * Renders one input per detected {{variable}} from a Word template —
 * text/date/number/choice, using each field's own label (either the
 * contextual label lifted from text like "Nombre del Cliente: {{tag}}",
 * or a humanized version of the variable key — see
 * src/lib/docxTemplateEngine.ts). A `type: 'section'` field renders as a
 * full-width group heading instead of an input, letting a template owner
 * break a long form into labeled subsections (see the editor's "Agregar
 * subsección" control).
 *
 * Single column on phones, two columns from `md` up — a form with 10+
 * fields (common for a real contract template) reads as one long scroll
 * on mobile either way, so single-column there is still the right call;
 * two columns is purely a desktop/tablet space win. Multi-choice fields
 * with more than a few options span both columns so the dropdown/options
 * don't fight a narrow half-width column.
 */
export function DynamicDocForm({ fields, values, onChange, language, invalidKeys }: DynamicDocFormProps) {
  // Pre-fill empty fields from the last value remembered for that LABEL,
  // once per field the first time it appears — never overwrites something
  // the user (or the template) already put in `values`.
  const prefilled = useRef(new Set<string>());
  useEffect(() => {
    for (const f of fields) {
      if (f.type === 'section' || prefilled.current.has(f.key)) continue;
      prefilled.current.add(f.key);
      if (!values[f.key]?.trim()) {
        const remembered = recalledValue(f.label);
        if (remembered) onChange(f.key, remembered);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields]);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {fields.map((f) => {
        if (f.type === 'section') {
          return (
            <div key={f.key} className="col-span-1 mt-2 border-b border-slate-200 pb-1.5 first:mt-0 md:col-span-2">
              <h3 className="text-xs font-black uppercase tracking-wide text-indigo-600">{f.label}</h3>
            </div>
          );
        }

        const wide = f.type === 'choice' && (f.options?.length ?? 0) > 3;
        const invalid = invalidKeys?.has(f.key) ?? false;
        const fieldClass = `w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-indigo-400 ${
          invalid ? 'border-red-400 bg-red-50 focus:border-red-500' : 'border-slate-200'
        }`;

        return (
          <div key={f.key} className={wide ? 'md:col-span-2' : undefined}>
            <label className={`mb-1 block text-xs font-bold ${invalid ? 'text-red-600' : 'text-slate-600'}`}>
              {f.label}
              {f.required && <span className="text-red-500"> *</span>}
            </label>
            {f.type === 'choice' ? (
              <select
                value={values[f.key] ?? ''}
                onChange={(e) => onChange(f.key, e.target.value)}
                onBlur={() => rememberValue(f.label, values[f.key] ?? '')}
                className={fieldClass}
              >
                <option value="">{language === 'en' ? 'Select...' : 'Selecciona...'}</option>
                {(f.options ?? []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            ) : (
              <input
                type={f.type === 'date' ? 'date' : f.type === 'number' ? 'number' : 'text'}
                value={values[f.key] ?? ''}
                onChange={(e) => onChange(f.key, e.target.value)}
                onBlur={(e) => rememberValue(f.label, e.target.value)}
                className={fieldClass}
              />
            )}
            {invalid && (
              <p className="mt-1 text-[11px] font-semibold text-red-500">
                {language === 'en' ? 'Required' : 'Obligatorio'}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
