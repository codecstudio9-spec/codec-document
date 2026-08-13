-- Lanzamiento: 100 documentos gratis durante 15 días. Después, 50.
--
-- ── Por qué se vuelve atrás del 100 fijo ─────────────────────────────────
-- El 100 permanente se puso razonando sobre el coste de infraestructura, que
-- es despreciable. Pero un contador real lo miró y dijo lo que faltaba: con
-- 100 al mes, un despacho pequeño hace su mes entero gratis y nunca necesita
-- pagar. El límite no lo pone el servidor, lo pone el momento en que la
-- herramienta deja de alcanzar — y con 100 ese momento no llega.
--
-- 50 sigue siendo suficiente para probar con datos reales de un cliente y
-- comprobar que las cifras cuadran, que es lo único que hay que demostrar
-- antes de cobrar.
--
-- ── Y por qué 100 durante quince días ────────────────────────────────────
-- Porque en el lanzamiento el problema no es la conversión, es que nadie
-- conoce la herramienta. Quince días de tope doble dan margen para procesar
-- un mes completo sin restricciones y formarse una opinión. Pasada la fecha
-- baja a 50 SOLO, sin que nadie tenga que acordarse: es el mecanismo de
-- `promo_until` que ya existe y que caduca por sí mismo.
--
-- La pantalla de planes ya cuenta las dos cifras —«100 hasta el X, después
-- 50»— para que el 100 no se lea como permanente y el cambio no sea una
-- sorpresa el día 16. Prometer un límite y bajarlo en silencio es la forma
-- más rápida de perder a alguien que acababa de empezar a confiar.

UPDATE public.ed_plans
   SET monthly_xml_limit = 50,
       promo_xml_limit   = 100,
       promo_until       = now() + interval '15 days',
       updated_at        = now()
 WHERE code = 'gratis';
