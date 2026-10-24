# Codec POS → Codec Document (Mi contador), fase 2

Instrucciones para el agente que trabaja en el repo de **Codec POS** (proyecto Supabase `ophsckohhjajcsqniqvw`).
El lado de Codec Document ya está hecho y publicado el 2026-10-24; este documento es el contrato.

---

## 0. Antes de tocar nada: cuidado con el proyecto de Supabase

En la copia de Codec POS de la Mac, `supabase/.temp/linked-project.json` apunta a **Codec Document** (`yxzchnldmfsgdtbjurey`), no a Codec POS.
Si corres `supabase db push` o `functions deploy` así, aplicarías las migraciones del POS en la base de Codec Document.
Antes de cualquier comando: `supabase link --project-ref ophsckohhjajcsqniqvw` y verifica con `supabase projects list` / `cat supabase/.temp/linked-project.json`.

## 1. Por qué hoy no llega nada (diagnóstico del 2026-10-24)

- Boniexpress (NIT 1026304640) se conectó el 2026-10-21 a las 14:19 (hora Colombia) y llegaron 287 ventas (del 24 sep al 20 oct).
- A las 14:52 el contador pulsó «Desconectar» en Codec Document y generó un código nuevo, **CD-FN4B-5AMK** (vence el 28 de octubre de 2026). Nadie lo ha pegado en Codec POS.
- Desde la desconexión, `pos-ingesta` responde 401 `conexion_revocada` a ese token. Codec POS sólo se entera cuando intenta mandar algo, y su pantalla «Mi contador» sigue mostrando «Conectado». Mientras diga «activo», `vincular` rechaza el código nuevo con «ya está conectado, desconéctalo primero».
- No ha llegado **ninguna** factura electrónica (0 XML). Revisa en `contador_eventos` las de `tipo = 'factura_electronica'`: su estado, su motivo y si alguna vez se encolaron (solo se encolan las `accepted` en `produccion`).

## 2. Endpoints de Codec Document

Base: `https://yxzchnldmfsgdtbjurey.supabase.co/functions/v1`. Los cuatro van **sin JWT de Supabase**: se autentican con el token `cdp_…` en `Authorization: Bearer`.

| Función | Para qué | Respuesta |
|---|---|---|
| `pos-vincular` (POST `{codigo, nit, nombre_negocio, pos_cliente_id}`) | Igual que hoy | `{token, empresa, contador}` · 404 `codigo_invalido` · 410 `codigo_vencido` · 409 `nit_no_coincide` |
| **`pos-estado`** (POST o GET, nuevo) | ¿Sigue viva la conexión? | 200 `{estado:'activo', empresa, nit, vinculado_at, ultimo_envio_at, eventos_recibidos}` · 401 `{estado:'revocado', error:'conexion_revocada'}` · 401 `token_invalido` |
| `pos-ingesta` (POST `{eventos:[…]}`, máx. 200) | Mandar datos | `{aceptados:[id_origen], duplicados:[…], rechazados:[{id_origen, motivo}]}` · 401 `conexion_revocada` · 500 = reintentar el lote |
| `pos-desvincular` (POST) | El negocio deja de compartir | `{ok:true}` |

## 3. Lo que hay que hacer en Codec POS

### 3.1 Reconexión (lo urgente)
1. **«Mi contador» consulta `pos-estado` al abrirse.** Si responde `conexion_revocada` o `token_invalido`, marcar el vínculo como `revocado`, borrar el `token_cifrado`, cancelar lo pendiente y mostrar «Tu contador desconectó esta empresa. Pídele un código nuevo» con el campo para pegarlo.
2. **`vincular` con un vínculo `activo` no debe bloquear.** Si el negocio pega un código nuevo: llamar `pos-estado` con el token guardado; si ya no está activo, seguir con el código nuevo sin pedir que desconecte. Si sigue activo, mantener el aviso actual.
3. **Al reconectar se reenvía todo**: volver a encolar lo `cancelado` y lo `enviado`/`duplicado`, o simplemente volver a llamar el historial. Codec Document deduplica por `id_origen` y por empresa: reenviar no duplica, y la conexión nueva puede ser de otra cuenta de contador que no tiene nada.

### 3.2 Historial completo
- `contador_encolar_historial` hoy solo encola desde el 1 de enero del año en curso. Cambiarlo a **todo el historial que haya en la nube** (o mínimo desde el 1 de enero del año anterior, para cierres y declaraciones anuales), para todos los tipos de abajo.
- Verificar que las ventas de **Electron** estén llegando a la tabla `ventas` de la nube. Boniexpress solo tiene ventas en la nube desde el 24 de septiembre, casi todas del 15 al 20 de octubre. Si hay ventas de Electron que nunca subieron, el contador nunca las verá.

### 3.3 Tipos de evento nuevos (todos con `id_origen` único y estable, normalmente el uuid de la fila)
Ampliar el `check` de `contador_eventos.tipo`, encolar con triggers en las tablas de la nube (y en el historial) y armarlos en `contador-sync`:

**`gasto`** (tabla `gastos`)
```json
{ "tipo": "gasto", "id_origen": "<uuid>", "fecha": "2026-10-23T13:00:00-05:00",
  "concepto": "Bolsas", "categoria": "Insumos", "valor": 11900, "iva": 1900,
  "medio_pago": "efectivo", "proveedor_nombre": "Distribuidora X", "proveedor_nit": "800123456",
  "numero_soporte": "FV-123", "cajero": "Ana", "tienda": "Principal", "notas": null }
```
`valor` es lo que salió de la caja o del banco, IVA incluido (> 0; si es 0 se rechaza con `valor_invalido`).

**`devolucion`** (tablas `devoluciones` + `devolucion_items`)
```json
{ "tipo": "devolucion", "id_origen": "<uuid>", "venta_id_origen": "<uuid de la venta>",
  "fecha": "...-05:00", "total": 5000, "subtotal": 4202, "iva": 798, "medio_pago": "efectivo",
  "motivo": "Producto dañado", "nota_credito_cufe": null,
  "items": [{ "nombre": "X", "cantidad": 1, "precio_unitario": 5000, "subtotal": 5000, "iva_pct": 19 }] }
```
Si la devolución tuvo nota crédito electrónica, mandar su CUFE/CUDE en `nota_credito_cufe` y además el XML como `nota_credito` (abajo).

**`cierre_caja`** (tabla `cierres_caja`)
```json
{ "tipo": "cierre_caja", "id_origen": "<uuid>", "apertura": "...-05:00", "cierre": "...-05:00",
  "cajero": "Ana", "tienda": "Principal", "caja": "A", "base_inicial": 50000,
  "ventas_total": 16900, "ventas_por_medio": { "efectivo": 11900, "transferencia": 5000 },
  "gastos_efectivo": 11900, "retiros": 0, "ingresos_extra": 0,
  "efectivo_esperado": 50000, "efectivo_contado": 49000, "diferencia": -1000,
  "num_ventas": 2, "observaciones": null }
```

**`nota_credito`, `nota_debito`, `documento_soporte`** (tablas `notas_credito_electronicas`, `notas_debito_electronicas`, y la de documento soporte que corresponda), igual que `factura_electronica`:
```json
{ "tipo": "nota_credito", "id_origen": "<uuid>", "cufe": "<CUDE>", "fecha": "2026-10-23", "xml": "<?xml …" }
```
Solo las aceptadas por la DIAN en producción. El XML preferido es el **AttachedDocument** de la DIAN; si no está, el XML firmado. Máximo 5 MB.

**`anulacion`**, ahora con `de`:
```json
{ "tipo": "anulacion", "id_origen": "<id_origen del registro anulado>", "de": "venta" }
```
`de` es `"venta"` (por defecto), `"gasto"` o `"devolucion"`. Encolar cuando una venta pasa a anulada, cuando se elimina o anula un gasto, o cuando se anula una devolución. La anulación debe viajar **después** del registro que anula (ordenar la cola por fecha y luego por id, como hoy); si llega antes, Codec Document responde `venta_no_encontrada` / `gasto_no_encontrada`, y conviene reintentarla más tarde en vez de marcarla rechazada.

### 3.4 Lo que ya funciona y no hay que cambiar
- `venta` y `factura_electronica` con el formato actual.
- Lotes de hasta 200, reintentos con espera creciente, espera de 6 horas cuando el contador no tiene cupo, y 401 `conexion_revocada` → marcar revocado.

## 4. Cómo probar
1. El contador genera un código en Codec Document (Mis empresas → la empresa → Codec POS). La empresa debe tener el mismo NIT que el negocio.
2. En Codec POS, Configuración → Mi contador → pegar el código.
3. En `contador_eventos` deben quedar `enviado` las ventas, gastos, devoluciones, cierres y documentos del historial. En Codec Document se ven en las pestañas Ventas, Gastos, Devoluciones y Cierres de caja.
4. Desconectar desde Codec Document → abrir «Mi contador» en el POS → debe decir que el contador desconectó y dejar pegar un código nuevo sin pasos extra.

## 5. Respuestas a Codec POS (2026-10-24, tras su commit 2714337)

- **Cupo:** `pos-ingesta` nunca rechaza por cupo. Todo XML entra a la bandeja y el cupo del plan se aplica cuando el contador la lee; lo que no cabe queda pendiente en Codec Document. La regla de las 6 horas no hace daño, pero ningún motivo actual la activa.
- **Anulación antes de su registro:** el motivo es `<de>_no_encontrada`: `venta_no_encontrada`, `gasto_no_encontrada` y `devolucion_no_encontrada` (todas en femenino). Si `de` no es venta, gasto ni devolución: `tipo_desconocido`.
- **Gasto sin documento de compra:** está bien con `iva` en 0 y el proveedor en null. Va a 519595 sin tercero.
- **Cierre con `tienda` y `caja` en null:** está bien.
- **`pos-estado`:** acepta POST (con cualquier cuerpo, también `{}`) y GET; ignora el cuerpo.
- **Duplicados:** desde ahora un duplicado CORRIGE el registro. Ventas, gastos y devoluciones que todavía no están contabilizados se reemplazan enteros. Si ya están en un comprobante, solo se actualizan los ítems (las cifras quedan como se contabilizaron). Los cierres de caja se reemplazan siempre. La anulación nunca se deshace con un reenvío. Hoy no hay ninguna venta con ítems incompletos: las 287 cuadran con su total.
