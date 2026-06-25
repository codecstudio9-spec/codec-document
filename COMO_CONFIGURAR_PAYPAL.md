# 🚀 Cómo Configurar PayPal - Guía Paso a Paso

## 🎯 Lo que viste en tu pantalla

En tu captura de pantalla de PayPal, viste esta información:

```
Credenciales de API

Client ID de API: AcmqiJghu3pjpnsjEu8E_1JZW6nWDAoldsASHKnq2yJ3o4...
(este puede estar truncado, copia el ID completo)

Contraseña: ******** (oculta)
```

## ⚡ Configuración Rápida (3 pasos)

### PASO 1: Copia tu Client ID

1. Ve a tu dashboard de PayPal
2. Copia el **Client ID completo** que aparece en "Credenciales de API"
3. Asegúrate de copiar TODO el ID (puede ser más largo de lo que se muestra)

### PASO 2: Pega en el código

1. Abre el archivo: `/src/app/components/paypal-checkout.tsx`

2. Busca la línea 12 que dice:
```typescript
const PAYPAL_CLIENT_ID = 'YOUR_PAYPAL_CLIENT_ID_HERE';
```

3. Reemplázala con tu Client ID real:
```typescript
const PAYPAL_CLIENT_ID = 'AcmqiJghu3pjpnsjEu8E_1JZW6nWDAoldsASHKnq2yJ3o4';
// ☝️ PEGA TU CLIENT ID COMPLETO AQUÍ
```

### PASO 3: Elige el modo

#### Para PROBAR (sin dinero real):
```typescript
const PAYPAL_MODE: 'sandbox' | 'live' = 'sandbox';
```

#### Para PRODUCCIÓN (pagos reales):
```typescript
const PAYPAL_MODE: 'sandbox' | 'live' = 'live';
```

---

## 🧪 Modo SANDBOX (Pruebas)

### ¿Qué es Sandbox?
Es un ambiente de pruebas donde puedes simular pagos SIN usar dinero real.

### Cómo crear cuentas de prueba:

1. **Ve a**: https://developer.paypal.com/dashboard/

2. **Inicia sesión** con tu cuenta de PayPal

3. **Ve a la sección "Accounts"** (Cuentas)

4. **Crea 2 cuentas de prueba**:

   **A) Cuenta Personal (Comprador)**
   - Type: Personal
   - Email: algo-buyer@personal.example.com
   - Password: (crea una contraseña)
   - Esta cuenta es para PAGAR (simular el cliente)

   **B) Cuenta Business (Vendedor)**
   - Type: Business
   - Email: algo-seller@business.example.com
   - Password: (crea una contraseña)
   - Esta cuenta RECIBE el dinero (tu negocio)

5. **Apunta las credenciales** de ambas cuentas

### Cómo probar un pago en Sandbox:

1. Ve a tu sitio web local
2. Selecciona un documento (ej: "Last Will and Testament")
3. Llena el formulario
4. Ve a la página de checkout
5. Ingresa cualquier email (ej: test@example.com)
6. Click en el botón azul de PayPal
7. **Se abre una ventana de PayPal**
8. Ingresa el email y contraseña de tu **cuenta Personal de Sandbox**
9. Completa el pago
10. ✅ El pago se procesa y te redirige al documento

**NOTA**: El dinero NO es real, es solo una simulación.

---

## 💰 Modo LIVE (Producción)

### Requisitos antes de activar pagos reales:

1. ✅ Cuenta de PayPal verificada
2. ✅ Email confirmado
3. ✅ Cuenta bancaria conectada (para retirar fondos)
4. ✅ Verificación de identidad completada

### Obtener credenciales de LIVE:

1. Ve a tu PayPal Dashboard
2. Ve a "Configuración de la cuenta" → "Acceso a la API"
3. Busca las credenciales de **LIVE** (no Sandbox)
4. Copia el **Client ID de LIVE**

### Activar modo LIVE:

En `/src/app/components/paypal-checkout.tsx`:

```typescript
// ANTES (Pruebas)
const PAYPAL_CLIENT_ID = 'sandbox_client_id_123...';
const PAYPAL_MODE: 'sandbox' | 'live' = 'sandbox';

// DESPUÉS (Producción)
const PAYPAL_CLIENT_ID = 'live_client_id_789...';
const PAYPAL_MODE: 'sandbox' | 'live' = 'live';
```

---

## 💳 ¿Qué puede pagar el cliente?

Con PayPal, tus clientes pueden pagar con:

1. **Cuenta de PayPal** (si tienen una)
2. **Tarjeta de crédito** (Visa, Mastercard, Amex, Discover)
3. **Tarjeta de débito**
4. **Pago a plazos** (en algunos países)

**NO necesitan tener cuenta de PayPal** para pagar con tarjeta.

---

## 🌍 ¿Funciona desde Colombia?

**¡SÍ!** PayPal funciona perfectamente desde Colombia:

- ✅ Puedes recibir pagos de TODO el mundo
- ✅ Tus clientes pueden pagar en USD
- ✅ Puedes retirar a una cuenta bancaria colombiana
- ✅ PayPal maneja la conversión de moneda automáticamente

### Comisiones en Colombia:

- **Recibir pagos**: ~4.4% + tarifa fija
- **Retirar a banco colombiano**: Gratis (o comisión mínima según el monto)

Ejemplo:
- Cliente paga $10 USD por un documento
- PayPal cobra ~$0.74 en comisiones
- Recibes ~$9.26 USD
- Retiras a tu cuenta en COP (pesos colombianos)

---

## 🔍 Verificar que todo funciona

### En Sandbox:
1. Haz un pago de prueba
2. Abre la consola del navegador (F12)
3. Busca el mensaje: `Payment successful: { id: 'ORDER_ID_123...' }`
4. Ve a https://developer.paypal.com/dashboard/
5. Revisa las transacciones de tu cuenta Business de prueba

### En Live:
1. Haz un pago real pequeño ($1-2)
2. Ve a tu PayPal dashboard real
3. Busca en "Actividad"
4. Verás la transacción con el mismo Order ID

---

## 🐛 Solución de Problemas

### Error: "Client ID is invalid"
- ✅ Verifica que copiaste el Client ID completo
- ✅ Asegúrate de usar el Client ID del modo correcto (sandbox vs live)
- ✅ No uses el Secret, solo el Client ID

### El botón de PayPal no aparece
- ✅ Verifica que ingresaste un email
- ✅ Abre la consola (F12) y busca errores
- ✅ Verifica tu conexión a internet

### El pago no se completa
- ✅ En Sandbox: usa una cuenta de prueba válida
- ✅ En Live: verifica que tu cuenta esté verificada
- ✅ Revisa que el email del cliente sea válido

### "Payment cancelled"
- Es normal, el usuario canceló el pago
- Puede intentar de nuevo

---

## 📊 Resumen del Flujo Completo

```
1. Usuario selecciona estado (ej: California)
   ↓
2. Ve documentos disponibles para California
   ↓
3. Selecciona "Residential Lease Agreement" ($7)
   ↓
4. Llena formulario con datos del contrato
   ↓
5. Ve preview con marca de agua
   ↓
6. Click "Purchase Document"
   ↓
7. Ingresa email en checkout
   ↓
8. Click botón "PayPal" (azul)
   ↓
9. Ventana de PayPal se abre
   ↓
10. Usuario paga con PayPal/tarjeta
    ↓
11. PayPal confirma pago
    ↓
12. Sistema desbloquea documento
    ↓
13. Usuario descarga sin marca de agua
    ↓
14. Puede editar y re-descargar
    ↓
15. Tú recibes el dinero en PayPal
    ↓
16. Retiras a tu banco en Colombia 🎉
```

---

## ✅ Checklist Final

Antes de publicar tu sitio:

- [ ] Client ID de LIVE configurado correctamente
- [ ] `PAYPAL_MODE` en `'live'`
- [ ] Cuenta de PayPal verificada
- [ ] Cuenta bancaria conectada
- [ ] Probaste un pago real pequeño
- [ ] El documento se desbloquea correctamente
- [ ] Mensaje de sandbox removido/oculto
- [ ] Precios de documentos correctos en USD
- [ ] Traducciones funcionando (español/inglés)

---

## 🎉 ¡Listo!

Tu plataforma ahora puede recibir pagos reales de clientes en todo el mundo, directamente a tu cuenta de PayPal en Colombia.

**Próximos pasos sugeridos:**
1. Publicar tu sitio en Vercel/Netlify
2. Configurar un dominio personalizado
3. Promocionar en redes sociales
4. ¡Recibir tus primeros pagos!

---

## 📞 Soporte de PayPal

- **Centro de ayuda**: https://www.paypal.com/co/smarthelp/home
- **Teléfono Colombia**: Disponible en su sitio web
- **Documentación técnica**: https://developer.paypal.com/docs/

¡Éxitos con tu plataforma de documentos legales! 🚀
