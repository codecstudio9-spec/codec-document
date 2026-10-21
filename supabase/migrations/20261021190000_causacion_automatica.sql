-- Causación automática por empresa (2026-10-21).
--
-- Encendida por defecto, pero sólo causa lo que el contador ya enseñó: la
-- empresa necesita sus cuentas guardadas (ed_causacion_config, que se crea la
-- primera vez que causa a mano) y cada proveedor su cuenta confirmada
-- (ed_causacion_reglas). Los proveedores nuevos se quedan «por causar» para
-- que los revise él. El cálculo es el mismo motor determinista de siempre
-- (src/lib/dian/causacion.ts): ninguna cifra sale de una IA.
ALTER TABLE public.fiscal_entities
  ADD COLUMN IF NOT EXISTS causacion_automatica boolean NOT NULL DEFAULT true;
