# 💳 Configuración de PayPal para Codec Document

## 📋 Estado Actual

✅ **PayPal está configurado en MODO SANDBOX (Pruebas)**
- Client ID de Sandbox: Configurado
- Los pagos NO son reales, solo para pruebas
- Usuario de prueba: `sb-braky27004269@business.example.com`
- Contraseña: `&mC4&<1a`

---

## 🧪 Cómo Probar el Sistema de Pagos (SANDBOX)

### Paso 1: Crear una Cuenta de Prueba de Comprador

1. Ve a: https://developer.paypal.com/dashboard
2. Inicia sesión con tu cuenta de PayPal Developer
3. Ve a **"Sandbox" > "Accounts"**
4. Click en **"Create Account"**
5. Selecciona **"Personal"** (cuenta de comprador)
6. Configura:
   - Country: United States
   - Balance: $1000 (o lo que quieras)
7. Copia el email y contraseña generados

### Paso 2: Probar un Pago

1. Ve a tu app: http://localhost:5173
2. Selecciona un estado (ej: California)
3. Elige un documento (ej: "Residential Lease Agreement" - $7)
4. Llena el formulario
5. Click en "Continue to Preview"
6. Click en "Purchase Document" ($7)
7. En la página de checkout, verás los botones de PayPal
8. Click en **"PayPal"** (el botón azul)
9. Se abrirá una ventana de PayPal
10. **USA LAS CREDENCIALES DE PRUEBA** (la cuenta Personal que creaste)
11. Completa el pago
12. ✅ El documento se desbloqueará y podrás descargarlo

### Paso 3: Ver el Pago en tu Dashboard

1. Ve a: https://developer.paypal.com/dashboard
2. Ve a **"Sandbox" > "Accounts"**
3. Busca tu cuenta Business: `sb-braky27004269@business.example.com`
4. Click en los 3 puntos (**...**) > **"View/Edit Account"**
5. Click en **"Login to Sandbox"**
6. Verás el dashboard de PayPal con el pago recibido

---

## 💰 Cómo Activar Pagos REALES (PRODUCCIÓN)

### Requisitos Previos

Necesitas una **cuenta PayPal Business** verificada:

1. Si NO tienes cuenta Business:
   - Ve a: https://www.paypal.com/businesssignup
   - Crea una cuenta Business
   - Conecta tu cuenta bancaria
   - Verifica tu identidad (pueden pedirte documentos)

2. Si YA tienes PayPal personal:
   - Ve a: https://www.paypal.com/businessmanage/account/aboutBusiness
   - Actualiza a cuenta Business (es gratis)

### Paso 1: Obtener tus Credenciales LIVE

1. Ve a: https://developer.paypal.com/dashboard
2. **IMPORTANTE**: Asegúrate de estar en modo **"Live"** (no "Sandbox")
   - En la esquina superior, verás un switch "Sandbox/Live"
   - Cambia a **"Live"**

3. Ve a **"My Apps & Credentials"**

4. En la sección **"Live"**, busca **"Default Application"**
   - Si no existe, click en **"Create App"**

5. Click en el nombre de tu app

6. Copia el **"Client ID"** (es una cadena larga de letras y números)

### Paso 2: Configurar las Credenciales en tu Código

1. Abre el archivo: `/src/app/config/paypal.ts`

2. Encuentra esta sección:

```typescript
live: {
  clientId: 'YOUR_LIVE_CLIENT_ID_HERE',
},
```

3. Reemplaza `YOUR_LIVE_CLIENT_ID_HERE` con tu Client ID real:

```typescript
live: {
  clientId: 'TU_CLIENT_ID_REAL_AQUI_MUY_LARGO',
},
```

### Paso 3: Activar Modo LIVE

En el mismo archivo `/src/app/config/paypal.ts`, cambia:

```typescript
mode: 'sandbox' as 'sandbox' | 'live',
```

A:

```typescript
mode: 'live' as 'sandbox' | 'live',
```

### Paso 4: Probar con un Pago Real (¡Cuidado!)

⚠️ **ADVERTENCIA**: Ahora los pagos son REALES. El dinero se cargará a tarjetas/cuentas reales.

1. Reinicia tu aplicación
2. Verás un banner **verde** que dice "Live Mode (Real Payments)"
3. Haz un pago de prueba con TU PROPIA cuenta de PayPal
4. El dinero irá a tu cuenta Business
5. Podrás verlo en: https://www.paypal.com/myaccount/summary

### Paso 5: Retirar Fondos

1. Ve a: https://www.paypal.com/myaccount/transfer
2. Click en **"Transfer Money"**
3. Selecciona tu banco
4. Ingresa la cantidad
5. El dinero llegará en 1-3 días hábiles

---

## 💵 Comisiones de PayPal

PayPal cobra comisiones por cada transacción:

### Transacciones Domésticas (USA)
- **2.9% + $0.30 USD** por transacción

### Ejemplos:
| Precio Doc | Comisión PayPal | Recibes  |
|-----------|----------------|----------|
| $4.00     | $0.42          | $3.58    |
| $5.00     | $0.45          | $4.55    |
| $6.00     | $0.47          | $5.53    |
| $7.00     | $0.50          | $6.50    |
| $8.00     | $0.53          | $7.47    |
| $9.00     | $0.56          | $8.44    |
| $10.00    | $0.59          | $9.41    |

### Transacciones Internacionales
- **4.4% + comisión fija** (varía por país)

---

## 🔒 Seguridad

### ✅ LO QUE ESTÁ SEGURO:
- El Client ID puede ser público (está en el frontend)
- PayPal maneja toda la información de tarjetas
- Nunca tocas información de tarjetas de crédito
- PayPal tiene protección contra fraude

### ⚠️ NUNCA EXPONGAS:
- Tu **Secret Key** (no se usa en este proyecto frontend-only)
- Tu contraseña de PayPal
- Información bancaria

---

## 📊 Cómo Ver tus Ventas

### Dashboard de PayPal
1. Ve a: https://www.paypal.com/myaccount/summary
2. Verás todas las transacciones
3. Puedes exportar reportes

### Información por Transacción:
- Order ID
- Monto
- Fecha
- Comprador (email)
- Documento vendido (en la descripción)

---

## 🐛 Solución de Problemas

### Error: "PayPal is not configured"
- Verifica que el Client ID esté correctamente pegado en `/src/app/config/paypal.ts`
- No debe decir `YOUR_LIVE_CLIENT_ID_HERE`

### Error: "Error loading PayPal"
- Verifica tu conexión a internet
- Asegúrate de que el Client ID sea correcto
- Revisa la consola del navegador (F12) para más detalles

### Los pagos se cancelan automáticamente
- Verifica que estés en el modo correcto (sandbox vs live)
- Si estás en sandbox, usa cuentas de prueba de PayPal
- Si estás en live, usa cuentas reales

### No veo el dinero en mi cuenta
- En **sandbox**: Ve al dashboard de developer.paypal.com
- En **live**: Ve a paypal.com/myaccount
- Los pagos son instantáneos, deberías verlos inmediatamente

### Quiero cambiar de Sandbox a Live
1. Cambia `mode: 'live'` en `/src/app/config/paypal.ts`
2. Agrega tu Client ID de producción
3. Reinicia la aplicación
4. ✅ Listo para recibir pagos reales

### Quiero volver a Sandbox (pruebas)
1. Cambia `mode: 'sandbox'` en `/src/app/config/paypal.ts`
2. Reinicia la aplicación
3. ✅ De vuelta a modo pruebas

---

## 📞 Soporte

### PayPal
- Centro de ayuda: https://www.paypal.com/us/cshelp
- Developer docs: https://developer.paypal.com/docs
- Soporte técnico: https://www.paypal.com/merchantsupport

### Codec Document
- Archivo de configuración: `/src/app/config/paypal.ts`
- Componente de pago: `/src/app/components/paypal-checkout.tsx`
- Página de checkout: `/src/app/pages/checkout-page.tsx`

---

## ✅ Checklist para Go Live

Antes de lanzar tu plataforma al público:

- [ ] Crear cuenta PayPal Business
- [ ] Verificar cuenta (conectar banco)
- [ ] Obtener Client ID de producción
- [ ] Configurar Client ID en `/src/app/config/paypal.ts`
- [ ] Cambiar mode a `'live'`
- [ ] Probar un pago real con tu propia cuenta
- [ ] Verificar que el dinero llegue a tu PayPal Business
- [ ] Configurar retiro automático a tu banco (opcional)
- [ ] Revisar términos de servicio de PayPal
- [ ] Agregar políticas de reembolso en tu sitio
- [ ] Configurar correos de confirmación (opcional)
- [ ] Lanzar al público 🚀

---

## 🎉 ¡Todo Listo!

Tu sistema de pagos está configurado y funcionando. Los usuarios podrán:

1. ✅ Ver documentos con marca de agua (gratis)
2. ✅ Comprar con PayPal de forma segura
3. ✅ Descargar documentos sin marca de agua
4. ✅ Editar documentos después de comprar

**Tú recibirás:**
- 💰 Pagos directamente en tu cuenta PayPal Business
- 📊 Reportes de todas las ventas
- 🔒 Protección contra fraude de PayPal
- 💳 Posibilidad de aceptar tarjetas de crédito/débito (a través de PayPal)
