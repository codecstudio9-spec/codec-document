-- Retira el plan «Ilimitado» del catálogo.
--
-- ── Por qué ──────────────────────────────────────────────────────────────
-- Nació sin precio (`price_cop IS NULL`) porque todavía no se sabía cuánto
-- cobrar por él, y así ha estado desde entonces. En la pantalla de planes eso
-- se traducía en una tarjeta que decía «Precio por definir» y no se podía
-- comprar: ocupaba el mismo sitio que los planes reales, invitaba a pulsarla y
-- no llevaba a ninguna parte. Un plan que no se puede contratar no es una
-- opción, es una distracción en medio de una decisión de compra.
--
-- ── Por qué `active = false` y no DELETE ─────────────────────────────────
-- `ed_subscriptions` y `ed_payments` referencian planes por código. Borrar la
-- fila dejaría cualquier registro histórico apuntando a un código que ya no
-- existe, y el día que se quiera reactivar habría que reconstruir el texto de
-- uso justo de memoria. `active = false` lo saca del catálogo —
-- `ed_planes_listar()` filtra por `active`— sin romper nada de lo anterior.
--
-- Reactivarlo cuando tenga precio es un UPDATE de una línea.

UPDATE public.ed_plans
   SET active = false,
       updated_at = now()
 WHERE code = 'ilimitado';
