# 🚀 Codec Document - PayPal Backend Server

Este es el servidor backend de Node.js/Express que procesa los pagos de PayPal de forma segura.

## 🎯 ¿Por qué necesitas este servidor?

**SIN servidor backend:**
- ❌ Solo puedes usar el Client ID (público)
- ❌ Menos seguro
- ❌ No puedes validar pagos server-side
- ❌ No puedes usar webhooks

**CON servidor backend:**
- ✅ Usa Client ID + Secret Key (más seguro)
- ✅ Valida pagos en el servidor
- ✅ Puede recibir webhooks de PayPal
- ✅ Puedes guardar transacciones en base de datos
- ✅ Mejor control sobre el proceso de pago

## 📦 Instalación

```bash
cd server
npm install
```

## ⚙️ Configuración

1. **Copia el archivo de ejemplo:**
   ```bash
   cp .env.example .env
   ```

2. **El archivo `.env` ya tiene tus credenciales de Sandbox configuradas:**
   ```
   NODE_ENV=development
   PAYPAL_CLIENT_ID=Admipg5R4jQHbYbFjO4J8K_jTXOvQVSH58XDU7IbuZQWaLHjxHDQA7KGsPmpHBgvZfgGfXWjqGdEBZSS
   PAYPAL_CLIENT_SECRET=EJQe0XnZnavWXyz4FbyUb-KAVhZp3oYm5QS3wA62lTCsq_Yu4pKvReIJSq3SUCTrcX3F3y16z4fEqzYm
   ```

## 🚀 Ejecutar el Servidor

### Modo Desarrollo (con auto-reload):
```bash
npm run dev
```

### Modo Producción:
```bash
npm start
```

El servidor estará corriendo en: **http://localhost:8080**

## 📡 Endpoints

### `GET /api/health`
Verifica que el servidor esté funcionando.

**Respuesta:**
```json
{
  "status": "ok",
  "environment": "sandbox",
  "timestamp": "2026-03-08T15:30:00.000Z"
}
```

### `POST /api/orders`
Crea una nueva orden de PayPal.

**Request Body:**
```json
{
  "amount": 7.00,
  "documentName": "Residential Lease Agreement",
  "documentId": "residential-lease"
}
```

**Respuesta:**
```json
{
  "id": "5O190127TN364715T",
  "status": "CREATED",
  "links": [...]
}
```

### `POST /api/orders/:orderID/capture`
Captura el pago de una orden aprobada.

**Respuesta:**
```json
{
  "id": "5O190127TN364715T",
  "status": "COMPLETED",
  "purchase_units": [...]
}
```

### `GET /api/orders/:orderID`
Obtiene los detalles de una orden.

## 🔄 Flujo Completo

```
1. Frontend: Usuario selecciona documento ($7)
   ↓
2. Frontend → Backend: POST /api/orders
   ↓
3. Backend → PayPal: Crear orden
   ↓
4. PayPal → Backend: Order ID
   ↓
5. Backend → Frontend: Order ID
   ↓
6. Frontend: Usuario ve botones de PayPal
   ↓
7. Usuario: Click en PayPal y aprueba pago
   ↓
8. Frontend → Backend: POST /api/orders/{id}/capture
   ↓
9. Backend → PayPal: Capturar pago
   ↓
10. PayPal → Backend: Pago completado
    ↓
11. Backend → Frontend: Confirmación
    ↓
12. Frontend: Desbloquear documento ✅
```

## 🧪 Modo Sandbox (Pruebas)

Cuando `NODE_ENV=development`:
- ✅ Usa credenciales de Sandbox
- ✅ Los pagos son simulados
- ✅ Perfecto para desarrollo y pruebas
- ❌ NO procesa dinero real

**Cuentas de prueba:**
- Business: `sb-braky27004269@business.example.com` / `&mC4&<1a`
- Personal: Crea una en https://developer.paypal.com/dashboard

## 💰 Modo Producción (Pagos Reales)

Cuando `NODE_ENV=production`:
- ✅ Usa credenciales de Producción (Live)
- ✅ Procesa pagos REALES
- ✅ El dinero va a tu cuenta PayPal Business
- ⚠️ PayPal cobra comisiones (2.9% + $0.30)

**Para activar:**

1. Obtén tus credenciales Live:
   - Ve a https://developer.paypal.com/dashboard
   - Cambia a modo "Live"
   - Ve a "My Apps & Credentials"
   - Copia Client ID y Secret

2. Actualiza `.env`:
   ```
   NODE_ENV=production
   PAYPAL_CLIENT_ID=tu_client_id_live
   PAYPAL_CLIENT_SECRET=tu_secret_live
   ```

3. Reinicia el servidor:
   ```bash
   npm start
   ```

## 🔒 Seguridad

### ✅ Buenas Prácticas:
- El Secret Key NUNCA está en el frontend
- El `.env` está en `.gitignore`
- CORS configurado solo para localhost
- Validación de datos en cada endpoint
- Logs de todas las transacciones

### ⚠️ IMPORTANTE:
- **NUNCA** commitees el archivo `.env` a Git
- **NUNCA** expongas el `CLIENT_SECRET` públicamente
- Usa variables de entorno en producción
- Considera agregar autenticación JWT para endpoints sensibles

## 📊 Logs

El servidor muestra logs detallados:

```
🚀 PayPal Server Starting...
📍 Environment: SANDBOX (Test)
🔑 Client ID: Admipg5R4jQHbYbFjO4...

✅ PayPal Server is running!
📍 URL: http://localhost:8080
🔧 Environment: 🟡 SANDBOX

Endpoints:
  GET  /api/health
  POST /api/orders
  POST /api/orders/:orderID/capture
  GET  /api/orders/:orderID
```

Cada transacción se registra:
```
📝 Creating order for: Residential Lease Agreement ($7)
✅ Order created: { orderId: '5O190...', amount: 7, document: 'Residential Lease Agreement' }
💳 Capturing payment for order: 5O190...
💰 Payment captured: { orderId: '5O190...', status: 'COMPLETED', amount: '7.00' }
```

## 🐛 Solución de Problemas

### Error: "PAYPAL_CLIENT_ID must be set"
- Verifica que el archivo `.env` existe
- Verifica que las credenciales están correctamente copiadas

### Error: CORS
- Asegúrate de que el frontend corre en `http://localhost:5173`
- Actualiza la configuración de CORS en `server.js` si usas otro puerto

### Error: "Failed to create order"
- Verifica que las credenciales sean correctas
- Verifica tu conexión a internet
- Revisa los logs del servidor para más detalles

### Los pagos no se procesan
- Verifica que estés usando cuentas de Sandbox si estás en modo desarrollo
- Verifica que el monto sea válido (mayor a $0.01)

## 🔄 Desarrollo Paralelo

Para correr frontend + backend juntos:

**Terminal 1 - Frontend:**
```bash
npm run dev
# Corre en http://localhost:5173
```

**Terminal 2 - Backend:**
```bash
cd server
npm run dev
# Corre en http://localhost:8080
```

## 📚 Recursos

- [PayPal Server SDK](https://github.com/paypal/PayPal-node-SDK)
- [PayPal Developer Dashboard](https://developer.paypal.com/dashboard)
- [PayPal API Reference](https://developer.paypal.com/docs/api/orders/v2/)
- [PayPal Sandbox Testing](https://developer.paypal.com/tools/sandbox/)

## 🤝 Contribuir

Este servidor es parte del proyecto Codec Document. Para mejoras:
1. Fork el proyecto
2. Crea una rama con tu feature
3. Haz commit de tus cambios
4. Envía un Pull Request

## 📄 Licencia

Privado - Codec Document © 2026
