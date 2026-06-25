# 🚀 INSTRUCCIONES: SERVIDOR PAYPAL BACKEND

## 📋 PASOS PARA INICIAR EL SERVIDOR

### 1️⃣ **VERIFICAR QUE EXISTE EL ARCHIVO `.env`**

Abre una terminal y ejecuta:

```bash
cd server
ls -la
```

**Debes ver estos archivos:**
```
.env            ← Este archivo DEBE existir (contiene tus credenciales)
.env.example    ← Template de ejemplo
.gitignore      ← Protege el .env
package.json    ← Configuración del proyecto
server.js       ← Código del servidor
```

### 2️⃣ **VERIFICAR EL CONTENIDO DEL `.env`**

```bash
cat .env
```

**Debe mostrar EXACTAMENTE esto (sin comillas, sin espacios):**
```
NODE_ENV=development
PORT=8080
PAYPAL_CLIENT_ID=Admipg5R4jQHbYbFjO4J8K_jTXOvQVSH58XDU7IbuZQWaLHjxHDQA7KGsPmpHBgvZfgGfXWjqGdEBZSS
PAYPAL_CLIENT_SECRET=EJQe0XnZnavWXyz4FbyUb-KAVhZp3oYm5QS3wA62lTCsq_Yu4pKvReIJSq3SUCTrcX3F3y16z4fEqzYm
```

⚠️ **SI NO VES ESTO, el archivo está mal. Recréalo con:**

```bash
echo "NODE_ENV=development
PORT=8080
PAYPAL_CLIENT_ID=Admipg5R4jQHbYbFjO4J8K_jTXOvQVSH58XDU7IbuZQWaLHjxHDQA7KGsPmpHBgvZfgGfXWjqGdEBZSS
PAYPAL_CLIENT_SECRET=EJQe0XnZnavWXyz4FbyUb-KAVhZp3oYm5QS3wA62lTCsq_Yu4pKvReIJSq3SUCTrcX3F3y16z4fEqzYm" > .env
```

### 3️⃣ **INSTALAR DEPENDENCIAS** (Solo la primera vez)

```bash
npm install
```

**Deberías ver:**
```
added 120 packages in 15s
```

### 4️⃣ **INICIAR EL SERVIDOR**

```bash
npm run dev
```

**Si todo está bien, deberías ver:**
```
🚀 PayPal Server Starting...
📍 Environment: SANDBOX (Test)
🔑 Client ID: Admipg5R4jQHbYbFjO...

✅ PayPal Server is running!
📍 URL: http://localhost:8080
🔧 Environment: 🟡 SANDBOX

Endpoints:
  GET  /api/health
  POST /api/orders
  POST /api/orders/:orderID/capture
  GET  /api/orders/:orderID
```

### 5️⃣ **PROBAR QUE FUNCIONA**

Abre otra terminal y ejecuta:

```bash
curl http://localhost:8080/api/health
```

**Deberías ver:**
```json
{
  "status": "ok",
  "environment": "sandbox",
  "timestamp": "2026-03-08T..."
}
```

---

## ❌ SOLUCIÓN DE ERRORES COMUNES

### **Error: "PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET must be set"**

**Causa:** El archivo `.env` no existe o está vacío.

**Solución:**
```bash
cd server
cat .env    # Ver si existe y tiene contenido

# Si está vacío o no existe, recrearlo:
echo "NODE_ENV=development
PORT=8080
PAYPAL_CLIENT_ID=Admipg5R4jQHbYbFjO4J8K_jTXOvQVSH58XDU7IbuZQWaLHjxHDQA7KGsPmpHBgvZfgGfXWjqGdEBZSS
PAYPAL_CLIENT_SECRET=EJQe0XnZnavWXyz4FbyUb-KAVhZp3oYm5QS3wA62lTCsq_Yu4pKvReIJSq3SUCTrcX3F3y16z4fEqzYm" > .env

# Intentar de nuevo:
npm run dev
```

---

### **Error: "Cannot find module 'dotenv'"**

**Causa:** No se instalaron las dependencias.

**Solución:**
```bash
cd server
npm install
npm run dev
```

---

### **Error: "Port 8080 is already in use"**

**Causa:** Otro proceso está usando el puerto 8080.

**Solución 1 - Cambiar puerto:**
Edita `.env` y cambia `PORT=8080` por `PORT=8081`

**Solución 2 - Matar el proceso:**
```bash
# macOS/Linux:
lsof -ti:8080 | xargs kill -9

# Windows:
netstat -ano | findstr :8080
taskkill /PID <PID_NUMBER> /F
```

---

### **Error: "CORS policy blocked"**

**Causa:** El frontend corre en un puerto diferente.

**Solución:** Verifica que el frontend corra en `http://localhost:5173` o edita `server.js` línea 18:

```javascript
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'TU_PUERTO_AQUI'],
  credentials: true
}));
```

---

## 🔄 REINICIAR TODO DESDE CERO

Si nada funciona, ejecuta:

```bash
# 1. Detener el servidor (Ctrl + C)

# 2. Limpiar todo
cd server
rm -rf node_modules package-lock.json

# 3. Recrear .env
echo "NODE_ENV=development
PORT=8080
PAYPAL_CLIENT_ID=Admipg5R4jQHbYbFjO4J8K_jTXOvQVSH58XDU7IbuZQWaLHjxHDQA7KGsPmpHBgvZfgGfXWjqGdEBZSS
PAYPAL_CLIENT_SECRET=EJQe0XnZnavWXyz4FbyUb-KAVhZp3oYm5QS3wA62lTCsq_Yu4pKvReIJSq3SUCTrcX3F3y16z4fEqzYm" > .env

# 4. Reinstalar todo
npm install

# 5. Iniciar
npm run dev
```

---

## 📞 ¿SIGUE SIN FUNCIONAR?

**Copia y pega en el chat el mensaje de error COMPLETO que ves en la terminal.**

Ejemplo:
```
❌ ERROR: PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET must be set in .env file
```

O:

```
Error: Cannot find module 'express'
```
