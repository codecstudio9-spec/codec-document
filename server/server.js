import express from "express";
import cors from "cors";
import "dotenv/config";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import nodemailer from "nodemailer";
import sqlite3 from "sqlite3";
import { fileURLToPath } from "url";
import {
  ApiError,
  CheckoutPaymentIntent,
  Client,
  Environment,
  LogLevel,
  OrdersController,
} from "@paypal/paypal-server-sdk";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PURCHASES_FILE = path.join(__dirname, "purchases.json");
const RESOLVED_DB_PATH = process.env.SIGN_DB_PATH || path.join(__dirname, "data", "signatures.sqlite");
const SIGN_DB_FILE = path.isAbsolute(RESOLVED_DB_PATH) ? RESOLVED_DB_PATH : path.join(__dirname, RESOLVED_DB_PATH);
fs.mkdirSync(path.dirname(SIGN_DB_FILE), { recursive: true });

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.FRONTEND_URL ||
  "http://localhost:5174";

const CORS_ORIGINS = Array.from(
  new Set([
    APP_URL,
    "http://localhost:5174",
    "http://localhost:5173",
    "http://localhost:3000",
  ])
);

app.use(cors({ origin: CORS_ORIGINS, credentials: true }));
app.use(express.json({ limit: "12mb" }));

const {
  PAYPAL_CLIENT_ID,
  PAYPAL_CLIENT_SECRET,
  PAYPAL_SECRET,
  PAYPAL_MODE = "sandbox",
  PAYPAL_WEBHOOK_ID,
  ADMIN_EMAIL = "douglastabordasanchez@gmail.com",
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
  FRONTEND_URL = APP_URL,
  NODE_ENV = "development",
  PORT = 8080,
  GOOGLE_CLIENT_ID = "",
} = process.env;

const RESOLVED_PAYPAL_SECRET = PAYPAL_CLIENT_SECRET || PAYPAL_SECRET;

if (!PAYPAL_CLIENT_ID || !RESOLVED_PAYPAL_SECRET) {
  console.error("❌ ERROR: PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET must be set in .env file");
  process.exit(1);
}

const isLiveMode = PAYPAL_MODE === "live" || NODE_ENV === "production";
const environment = isLiveMode ? Environment.Production : Environment.Sandbox;

const client = new Client({
  clientCredentialsAuthCredentials: {
    oAuthClientId: PAYPAL_CLIENT_ID,
    oAuthClientSecret: RESOLVED_PAYPAL_SECRET,
  },
  timeout: 0,
  environment,
  logging: {
    logLevel: LogLevel.Info,
    logRequest: { logBody: false },
    logResponse: { logHeaders: false },
  },
});

const ordersController = new OrdersController(client);

const db = new sqlite3.Database(SIGN_DB_FILE);
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    fullName TEXT,
    avatarUrl TEXT,
    googleSub TEXT,
    plan_type TEXT,
    expiry_date TEXT,
    is_active INTEGER DEFAULT 0,
    available_document_credits INTEGER DEFAULT 0,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  )`);

  db.run(`ALTER TABLE users ADD COLUMN plan_type TEXT`, () => {});
  db.run(`ALTER TABLE users ADD COLUMN expiry_date TEXT`, () => {});
  db.run(`ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 0`, () => {});
  db.run(`ALTER TABLE users ADD COLUMN available_document_credits INTEGER DEFAULT 0`, () => {});

  db.run(`CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    planCode TEXT NOT NULL,
    status TEXT NOT NULL,
    startsAt TEXT NOT NULL,
    endsAt TEXT,
    isLifetime INTEGER DEFAULT 0,
    orderId TEXT,
    amountUsd REAL,
    createdAt TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS auth_sessions (
    token TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    expiresAt TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS user_document_purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    documentId TEXT NOT NULL,
    documentName TEXT,
    orderId TEXT,
    is_single_purchase INTEGER DEFAULT 0,
    is_edit_locked INTEGER DEFAULT 0,
    purchasedAt TEXT NOT NULL,
    UNIQUE(email, documentId)
  )`);

  db.run(`ALTER TABLE user_document_purchases ADD COLUMN is_single_purchase INTEGER DEFAULT 0`, () => {});
  db.run(`ALTER TABLE user_document_purchases ADD COLUMN is_edit_locked INTEGER DEFAULT 0`, () => {});

  db.run(`CREATE TABLE IF NOT EXISTS signature_requests (
    token TEXT PRIMARY KEY,
    orderId TEXT,
    documentId TEXT,
    documentName TEXT,
    documentContent TEXT,
    buyerEmail TEXT,
    buyerName TEXT,
    signerEmail TEXT,
    signerName TEXT,
    contractSignerName TEXT,
    contractSignerId TEXT,
    brandingLogo TEXT,
    buyerIp TEXT,
    buyerSignedAt TEXT,
    guestIp TEXT,
    guestSignedAt TEXT,
    guestUserAgent TEXT,
    signaturePlacement TEXT,
    signaturePlacementNotes TEXT,
    signatureFeeUsd REAL DEFAULT 0,
    isFreeDailyRequest INTEGER DEFAULT 0,
    signatureDataUrl TEXT,
    status TEXT,
    createdAt TEXT
  )`);

  db.run(`ALTER TABLE signature_requests ADD COLUMN documentContent TEXT`, () => {});
  db.run(`ALTER TABLE signature_requests ADD COLUMN guestUserAgent TEXT`, () => {});
  db.run(`ALTER TABLE signature_requests ADD COLUMN contractSignerId TEXT`, () => {});
  db.run(`ALTER TABLE signature_requests ADD COLUMN signaturePlacement TEXT`, () => {});
  db.run(`ALTER TABLE signature_requests ADD COLUMN signaturePlacementNotes TEXT`, () => {});
  db.run(`ALTER TABLE signature_requests ADD COLUMN signatureFeeUsd REAL DEFAULT 0`, () => {});
  db.run(`ALTER TABLE signature_requests ADD COLUMN isFreeDailyRequest INTEGER DEFAULT 0`, () => {});
  db.run(`ALTER TABLE signature_requests ADD COLUMN signaturePage INTEGER`, () => {});
  db.run(`ALTER TABLE signature_requests ADD COLUMN signatureX REAL`, () => {});
  db.run(`ALTER TABLE signature_requests ADD COLUMN signatureY REAL`, () => {});
});

const dbRun = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

const dbGet = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

const getClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress || "0.0.0.0";
};

const getUserAgent = (req) => String(req.headers["user-agent"] || "Unknown Device");

const DEFAULT_ADMIN_EMAILS = ["douglastabordasanchez@gmail.com", "duglas.taborda@universal.edu.co"];
const ADMIN_EMAILS_NORMALIZED = Array.from(
  new Set(
    [
      ...DEFAULT_ADMIN_EMAILS,
      ...String(ADMIN_EMAIL || "")
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean),
    ].map((e) => e.toLowerCase())
  )
);
const UNLIMITED_PLAN_AMOUNT = 180;
const UNLIMITED_PLAN_CODE = "CODEC_UNLIMITED_ANNUAL";
const SUBSCRIPTION_PLANS = {
  "pro-monthly": { amount: 39.99, days: 30, planCode: "CODEC_PRO_MONTHLY" },
  "business-semiannual": { amount: 99.9, days: 180, planCode: "CODEC_BUSINESS_SEMIANNUAL" },
  "ultimate-annual": { amount: 179.99, days: 365, planCode: "CODEC_ULTIMATE_ANNUAL" },
};

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
const isAdminEmail = (email) => ADMIN_EMAILS_NORMALIZED.includes(normalizeEmail(email));

const PAYPAL_HOSTED_BUTTON_PLAN_MAP = {
  "57ERMWNY3UGQ8": { type: "subscription", planType: "Plan Mensual", months: 1, locale: "es" },
  "6TN8ZW2A8CG24": { type: "subscription", planType: "Plan Semestral", months: 6, locale: "es" },
  "VX6Q5YJ49S5JE": { type: "subscription", planType: "Plan Anual", months: 12, locale: "es" },
  "U9T8MGL7YWWEC": { type: "subscription", planType: "Monthly Plan", months: 1, locale: "en" },
  "AWZ3398DYLNS4": { type: "subscription", planType: "Semiannual Plan", months: 6, locale: "en" },
  "FFWCP78D24UAA": { type: "subscription", planType: "Annual Plan", months: 12, locale: "en" },
  "4NL99WAK2P7Q6": { type: "credits", credits: 3, label: "Pack 3 documentos" },
  "F5MBSF53LNSFA": { type: "credits", credits: 6, label: "Pack 6 documentos" },
  "92SRE8A7ZLF6A": { type: "single_document", label: "Contrato de Servicios", locale: "es" },
  "6G4V6WNS3HRL2": { type: "single_document", label: "Pagaré", locale: "es" },
  "3W9M72J497UVA": { type: "single_document", label: "Service Agreement", locale: "en" },
  "7S686CD5H3E4N": { type: "single_document", label: "Promissory Note", locale: "en" },
};

const addMonthsIso = (months) => {
  const d = new Date();
  d.setMonth(d.getMonth() + Number(months || 0));
  return d.toISOString();
};

const addDaysIso = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

const getBearerToken = (req) => {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return null;
  return auth.slice(7).trim() || null;
};

const getSessionUser = async (req) => {
  const token = getBearerToken(req);
  if (!token) return null;
  const row = await dbGet(`SELECT token, email, expiresAt FROM auth_sessions WHERE token = ?`, [token]);
  if (!row) return null;
  if (new Date(row.expiresAt).getTime() < Date.now()) return null;
  return { email: normalizeEmail(row.email), token: row.token };
};

const upsertUser = async ({ email, fullName, avatarUrl, googleSub }) => {
  const now = new Date().toISOString();
  await dbRun(
    `INSERT INTO users (email, fullName, avatarUrl, googleSub, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(email) DO UPDATE SET
       fullName = excluded.fullName,
       avatarUrl = excluded.avatarUrl,
       googleSub = excluded.googleSub,
       updatedAt = excluded.updatedAt`,
    [email, fullName || null, avatarUrl || null, googleSub || null, now, now]
  );
};

const hasActiveUnlimitedByEmail = async (email) => {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  const nowIso = new Date().toISOString();
  const row = await dbGet(
    `SELECT id FROM subscriptions
     WHERE email = ?
       AND planCode = ?
       AND status = 'ACTIVE'
       AND (isLifetime = 1 OR endsAt >= ?)
     ORDER BY createdAt DESC LIMIT 1`,
    [normalized, UNLIMITED_PLAN_CODE, nowIso]
  );
  return Boolean(row);
};

const hasAnyActiveSubscriptionByEmail = async (email) => {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  const nowIso = new Date().toISOString();
  const row = await dbGet(
    `SELECT id FROM subscriptions
     WHERE email = ?
       AND status = 'ACTIVE'
       AND (isLifetime = 1 OR endsAt >= ?)
     ORDER BY createdAt DESC LIMIT 1`,
    [normalized, nowIso]
  );
  return Boolean(row);
};

const grantUnlimitedPlan = async ({ email, orderId, isLifetime = false }) => {
  const normalized = normalizeEmail(email);
  const startsAt = new Date().toISOString();
  const endsAt = isLifetime ? null : addDaysIso(365);
  await dbRun(
    `INSERT INTO subscriptions (email, planCode, status, startsAt, endsAt, isLifetime, orderId, amountUsd, createdAt)
     VALUES (?, ?, 'ACTIVE', ?, ?, ?, ?, ?, ?)`,
    [normalized, UNLIMITED_PLAN_CODE, startsAt, endsAt, isLifetime ? 1 : 0, orderId || null, UNLIMITED_PLAN_AMOUNT, startsAt]
  );
};

const grantPlanByDays = async ({ email, orderId, planCode, amountUsd, days, isLifetime = false }) => {
  const normalized = normalizeEmail(email);
  const startsAt = new Date().toISOString();
  const endsAt = isLifetime ? null : addDaysIso(days);
  await dbRun(
    `INSERT INTO subscriptions (email, planCode, status, startsAt, endsAt, isLifetime, orderId, amountUsd, createdAt)
     VALUES (?, ?, 'ACTIVE', ?, ?, ?, ?, ?, ?)`,
    [normalized, planCode, startsAt, endsAt, isLifetime ? 1 : 0, orderId || null, amountUsd, startsAt]
  );
};

const upsertUserDocumentPurchase = async ({ email, documentId, documentName, orderId }) => {
  const normalized = normalizeEmail(email);
  if (!normalized || !documentId) return;
  const now = new Date().toISOString();
  await dbRun(
    `INSERT INTO user_document_purchases (email, documentId, documentName, orderId, purchasedAt)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(email, documentId) DO UPDATE SET
       documentName = excluded.documentName,
       orderId = excluded.orderId,
       purchasedAt = excluded.purchasedAt`,
    [normalized, String(documentId), documentName || null, orderId || null, now]
  );
};

const dbAll = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

const ensureSignatureRequestsTable = async () => {
  await dbRun(`CREATE TABLE IF NOT EXISTS signature_requests (
    token TEXT PRIMARY KEY,
    orderId TEXT,
    documentId TEXT,
    documentName TEXT,
    documentContent TEXT,
    buyerEmail TEXT,
    buyerName TEXT,
    signerEmail TEXT,
    signerName TEXT,
    contractSignerName TEXT,
    contractSignerId TEXT,
    brandingLogo TEXT,
    buyerIp TEXT,
    buyerSignedAt TEXT,
    guestIp TEXT,
    guestSignedAt TEXT,
    guestUserAgent TEXT,
    signaturePlacement TEXT,
    signaturePlacementNotes TEXT,
    signatureFeeUsd REAL DEFAULT 0,
    isFreeDailyRequest INTEGER DEFAULT 0,
    signatureDataUrl TEXT,
    status TEXT,
    createdAt TEXT
  )`);

  await dbRun(`ALTER TABLE signature_requests ADD COLUMN documentContent TEXT`).catch(() => {});
  await dbRun(`ALTER TABLE signature_requests ADD COLUMN guestUserAgent TEXT`).catch(() => {});
  await dbRun(`ALTER TABLE signature_requests ADD COLUMN contractSignerId TEXT`).catch(() => {});
  await dbRun(`ALTER TABLE signature_requests ADD COLUMN signaturePlacement TEXT`).catch(() => {});
  await dbRun(`ALTER TABLE signature_requests ADD COLUMN signaturePlacementNotes TEXT`).catch(() => {});
  await dbRun(`ALTER TABLE signature_requests ADD COLUMN signatureFeeUsd REAL DEFAULT 0`).catch(() => {});
  await dbRun(`ALTER TABLE signature_requests ADD COLUMN isFreeDailyRequest INTEGER DEFAULT 0`).catch(() => {});
  await dbRun(`ALTER TABLE signature_requests ADD COLUMN signaturePage INTEGER`).catch(() => {});
  await dbRun(`ALTER TABLE signature_requests ADD COLUMN signatureX REAL`).catch(() => {});
  await dbRun(`ALTER TABLE signature_requests ADD COLUMN signatureY REAL`).catch(() => {});
};

const SIGNATURE_EXTRA_REQUEST_FEE_USD = 3;

const getUtcDayBounds = () => {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
  return { startIso: start.toISOString(), endIso: end.toISOString() };
};

const getDailySignatureUsage = async ({ buyerEmail, buyerIp }) => {
  const normalized = normalizeEmail(buyerEmail);
  const ip = String(buyerIp || '').trim();
  const sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  if (!normalized && !ip) return { count: 0, freeRemaining: 1, nextFeeUsd: 0 };

  let row;
  if (ip && normalized) {
    row = await dbGet(
      `SELECT COUNT(*) AS total
       FROM signature_requests
       WHERE createdAt >= ?
         AND (
           lower(trim(COALESCE(buyerEmail, ''))) = ?
           OR trim(COALESCE(buyerIp, '')) = ?
         )`,
      [sinceIso, normalized, ip]
    );
  } else if (ip) {
    row = await dbGet(
      `SELECT COUNT(*) AS total
       FROM signature_requests
       WHERE createdAt >= ?
         AND trim(COALESCE(buyerIp, '')) = ?`,
      [sinceIso, ip]
    );
  } else {
    row = await dbGet(
      `SELECT COUNT(*) AS total
       FROM signature_requests
       WHERE createdAt >= ?
         AND lower(trim(COALESCE(buyerEmail, ''))) = ?`,
      [sinceIso, normalized]
    );
  }
  const count = Number(row?.total || 0);
  const freeRemaining = count >= 1 ? 0 : 1;
  return {
    count,
    freeRemaining,
    nextFeeUsd: freeRemaining > 0 ? 0 : SIGNATURE_EXTRA_REQUEST_FEE_USD,
  };
};

app.get("/api/signature-requests/pricing", async (req, res) => {
  try {
    const buyerEmail = normalizeEmail(req.query?.buyerEmail || "");
    const buyerIp = getClientIp(req);
    const usage = await getDailySignatureUsage({ buyerEmail, buyerIp });
    return res.json({
      buyerEmail,
      freePerDay: 1,
      extraFeeUsd: SIGNATURE_EXTRA_REQUEST_FEE_USD,
      dailyUsage: usage.count,
      freeRemaining: usage.freeRemaining,
      nextRequestFeeUsd: usage.nextFeeUsd,
    });
  } catch (error) {
    return res.status(500).json({ error: "No se pudo consultar la tarifa de firmas", message: error.message });
  }
});

const verifyGoogleIdToken = async (idToken) => {
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
  if (!res.ok) throw new Error("Token de Google inválido");
  const payload = await res.json();
  if (!payload?.email || payload.email_verified !== "true") throw new Error("Cuenta de Google no verificada");
  if (GOOGLE_CLIENT_ID && payload.aud !== GOOGLE_CLIENT_ID) throw new Error("Google Client ID no coincide");
  return payload;
};

const PAYPAL_API_BASE = isLiveMode
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

const ensurePurchasesFile = () => {
  if (!fs.existsSync(PURCHASES_FILE)) fs.writeFileSync(PURCHASES_FILE, JSON.stringify([], null, 2));
};
const readPurchases = () => {
  ensurePurchasesFile();
  return JSON.parse(fs.readFileSync(PURCHASES_FILE, "utf-8"));
};
const upsertPurchase = (purchase) => {
  const list = readPurchases();
  const filtered = list.filter((p) => p.orderId !== purchase.orderId);
  filtered.push(purchase);
  fs.writeFileSync(PURCHASES_FILE, JSON.stringify(filtered, null, 2));
};

const transporter = SMTP_HOST && SMTP_USER && SMTP_PASS
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT || 587),
      secure: Number(SMTP_PORT || 587) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  : null;

const sendPurchaseEmails = async ({ customerEmail, orderId, documentName, amount, documentContent }) => {
  if (!transporter) return;
  const from = SMTP_FROM || SMTP_USER;
  const receiptText = `Order: ${orderId}\nDocument: ${documentName}\nAmount: $${amount}\nCustomer: ${customerEmail || "N/A"}`;

  await transporter.sendMail({
    from,
    to: ADMIN_EMAIL,
    subject: `💰 New sale - ${documentName}`,
    text: `New purchase receipt copy:\n\n${receiptText}`,
    attachments: documentContent
      ? [
          {
            filename: `${String(documentName || "document").replace(/\s+/g, "_")}.txt`,
            content: documentContent,
            contentType: "text/plain; charset=utf-8",
          },
        ]
      : [],
  });

  if (customerEmail) {
    await transporter.sendMail({
      from,
      to: customerEmail,
      subject: `Receipt - ${documentName}`,
      text: `Thanks for your purchase.\n${receiptText}\n\nYour document is now unlocked without watermark.`,
    });
  }
};

const dispatchSignatureRequestEmailInBackground = ({ to, documentName, guestLink }) => {
  if (!transporter || !to) return;

  Promise.resolve()
    .then(() =>
      transporter.sendMail({
        from: SMTP_FROM || SMTP_USER,
        to,
        subject: `Signature request: ${documentName || "Document"}`,
        text: `You have been invited to sign: ${documentName || "Document"}\n\nSign securely here:\n${guestLink}`,
      })
    )
    .catch((error) => {
      console.error("Background signature email failed:", error?.message || error);
    });
};

const getPayPalAccessToken = async () => {
  const basicAuth = Buffer.from(`${PAYPAL_CLIENT_ID}:${RESOLVED_PAYPAL_SECRET}`).toString("base64");
  const tokenRes = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!tokenRes.ok) throw new Error("Could not fetch PayPal access token for webhook verification");
  const tokenData = await tokenRes.json();
  return tokenData.access_token;
};

const verifyWebhookSignature = async (req) => {
  if (!PAYPAL_WEBHOOK_ID) return false;

  const token = await getPayPalAccessToken();
  const verifyRes = await fetch(`${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      auth_algo: req.headers["paypal-auth-algo"],
      cert_url: req.headers["paypal-cert-url"],
      transmission_id: req.headers["paypal-transmission-id"],
      transmission_sig: req.headers["paypal-transmission-sig"],
      transmission_time: req.headers["paypal-transmission-time"],
      webhook_id: PAYPAL_WEBHOOK_ID,
      webhook_event: req.body,
    }),
  });

  if (!verifyRes.ok) return false;
  const verifyData = await verifyRes.json();
  return verifyData.verification_status === "SUCCESS";
};

const createOrder = async ({ amount, documentName, documentId, customerEmail }) => {
  const collect = {
    body: {
      intent: CheckoutPaymentIntent.Capture,
      purchaseUnits: [{
        referenceId: documentId || "CODEC_DOC",
        description: `${documentName} - Codec Document`,
        customId: customerEmail || "",
        amount: {
          currencyCode: "USD",
          value: amount.toFixed(2),
          breakdown: { itemTotal: { currencyCode: "USD", value: amount.toFixed(2) } },
        },
        items: [{
          name: documentName,
          description: "Professional Legal Document Template",
          unitAmount: { currencyCode: "USD", value: amount.toFixed(2) },
          quantity: "1",
          category: "DIGITAL_GOODS",
        }],
      }],
      applicationContext: {
        brandName: "Codec Document",
        shippingPreference: "NO_SHIPPING",
        userAction: "PAY_NOW",
        returnUrl: `${FRONTEND_URL}/checkout?success=true`,
        cancelUrl: `${FRONTEND_URL}/checkout?cancelled=true`,
      },
    },
    prefer: "return=representation",
  };

  const { body, ...httpResponse } = await ordersController.createOrder(collect);
  return { jsonResponse: JSON.parse(body), httpStatusCode: httpResponse.statusCode };
};

const captureOrder = async (orderID) => {
  const { body, ...httpResponse } = await ordersController.captureOrder({ id: orderID, prefer: "return=representation" });
  return { jsonResponse: JSON.parse(body), httpStatusCode: httpResponse.statusCode };
};

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", environment: isLiveMode ? "live" : "sandbox", timestamp: new Date().toISOString() });
});

app.post("/api/auth/google", async (req, res) => {
  try {
    const { idToken } = req.body || {};
    if (!idToken) return res.status(400).json({ error: "idToken es requerido" });

    const payload = await verifyGoogleIdToken(idToken);
    const email = normalizeEmail(payload.email);
    await upsertUser({
      email,
      fullName: payload.name,
      avatarUrl: payload.picture,
      googleSub: payload.sub,
    });

    if (isAdminEmail(email)) {
      const already = await hasActiveUnlimitedByEmail(email);
      if (!already) {
        await grantUnlimitedPlan({ email, orderId: "ADMIN-LIFETIME", isLifetime: true });
      }
    }

    const token = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const expiresAt = addDaysIso(30);
    await dbRun(`INSERT INTO auth_sessions (token, email, createdAt, expiresAt) VALUES (?, ?, ?, ?)`, [token, email, createdAt, expiresAt]);

    const unlimitedActive = await hasActiveUnlimitedByEmail(email);
    const subscriptionActive = await hasAnyActiveSubscriptionByEmail(email);
    return res.json({
      token,
      user: {
        email,
        name: payload.name,
        picture: payload.picture,
      },
      subscription: {
        unlimitedActive,
        subscriptionActive,
        planCode: unlimitedActive ? UNLIMITED_PLAN_CODE : null,
      },
    });
  } catch (error) {
    return res.status(401).json({ error: "No se pudo autenticar con Google", message: error.message });
  }
});

app.get("/api/subscription/status", async (req, res) => {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) return res.status(401).json({ error: "No autenticado" });

    const unlimitedActive = await hasActiveUnlimitedByEmail(sessionUser.email);
    const subscriptionActive = await hasAnyActiveSubscriptionByEmail(sessionUser.email);
    return res.json({
      email: sessionUser.email,
      unlimitedActive,
      subscriptionActive,
      annualPriceUsd: UNLIMITED_PLAN_AMOUNT,
      planCode: UNLIMITED_PLAN_CODE,
    });
  } catch (error) {
    return res.status(500).json({ error: "No se pudo consultar la suscripción", message: error.message });
  }
});

app.get("/api/purchases/me", async (req, res) => {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) return res.status(401).json({ error: "No autenticado" });
    const rows = await dbAll(
      `SELECT documentId, documentName, orderId, purchasedAt
       FROM user_document_purchases
       WHERE email = ?
       ORDER BY purchasedAt DESC`,
      [sessionUser.email]
    );
    return res.json({ email: sessionUser.email, documents: rows || [] });
  } catch (error) {
    return res.status(500).json({ error: "No se pudieron cargar las compras", message: error.message });
  }
});

app.post("/api/purchases/me", async (req, res) => {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) return res.status(401).json({ error: "No autenticado" });
    const { documentId, documentName, orderId } = req.body || {};
    if (!documentId) return res.status(400).json({ error: "documentId es requerido" });
    await upsertUserDocumentPurchase({
      email: sessionUser.email,
      documentId,
      documentName,
      orderId,
    });
    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: "No se pudo guardar la compra", message: error.message });
  }
});

app.post("/api/payments/webhook-success", async (req, res) => {
  try {
    const {
      email,
      hostedButtonId,
      orderId,
      documentId,
      documentName,
    } = req.body || {};

    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) return res.status(400).json({ error: "email es requerido" });
    if (!hostedButtonId) return res.status(400).json({ error: "hostedButtonId es requerido" });

    const mapped = PAYPAL_HOSTED_BUTTON_PLAN_MAP[String(hostedButtonId)] || null;
    if (!mapped) {
      return res.status(400).json({ error: "hostedButtonId no mapeado" });
    }

    const now = new Date().toISOString();

    if (mapped.type === "subscription") {
      const expiryDate = addMonthsIso(mapped.months);
      await dbRun(
        `INSERT INTO users (email, fullName, avatarUrl, googleSub, plan_type, expiry_date, is_active, createdAt, updatedAt)
         VALUES (?, NULL, NULL, NULL, ?, ?, 1, ?, ?)
         ON CONFLICT(email) DO UPDATE SET
           plan_type = excluded.plan_type,
           expiry_date = excluded.expiry_date,
           is_active = excluded.is_active,
           updatedAt = excluded.updatedAt`,
        [normalizedEmail, mapped.planType, expiryDate, now, now]
      );

      return res.json({
        ok: true,
        email: normalizedEmail,
        hostedButtonId,
        flow: "subscription",
        plan_type: mapped.planType,
        expiry_date: expiryDate,
        is_active: true,
        message: `Pago procesado con éxito. Plan ${mapped.planType} activo.`,
      });
    }

    if (mapped.type === "credits") {
      await dbRun(
        `INSERT INTO users (email, fullName, avatarUrl, googleSub, is_active, available_document_credits, createdAt, updatedAt)
         VALUES (?, NULL, NULL, NULL, 1, ?, ?, ?)
         ON CONFLICT(email) DO UPDATE SET
           is_active = 1,
           available_document_credits = COALESCE(users.available_document_credits, 0) + excluded.available_document_credits,
           updatedAt = excluded.updatedAt`,
        [normalizedEmail, mapped.credits, now, now]
      );

      const updatedUser = await dbGet(`SELECT available_document_credits FROM users WHERE email = ?`, [normalizedEmail]);
      return res.json({
        ok: true,
        email: normalizedEmail,
        hostedButtonId,
        flow: "credits",
        credits_added: mapped.credits,
        available_document_credits: Number(updatedUser?.available_document_credits || 0),
        message: `Pago procesado con éxito. Se agregaron ${mapped.credits} créditos.`,
      });
    }

    if (!documentId) {
      return res.status(400).json({ error: "documentId es requerido para compras individuales" });
    }

    await dbRun(
      `INSERT INTO users (email, fullName, avatarUrl, googleSub, is_active, createdAt, updatedAt)
       VALUES (?, NULL, NULL, NULL, 1, ?, ?)
       ON CONFLICT(email) DO UPDATE SET
         is_active = 1,
         updatedAt = excluded.updatedAt`,
      [normalizedEmail, now, now]
    );

    await dbRun(
      `INSERT INTO user_document_purchases (email, documentId, documentName, orderId, is_single_purchase, is_edit_locked, purchasedAt)
       VALUES (?, ?, ?, ?, 1, 1, ?)
       ON CONFLICT(email, documentId) DO UPDATE SET
         documentName = excluded.documentName,
         orderId = excluded.orderId,
         is_single_purchase = 1,
         is_edit_locked = 1,
         purchasedAt = excluded.purchasedAt`,
      [normalizedEmail, String(documentId), documentName || mapped.label || null, orderId || null, now]
    );

    return res.json({
      ok: true,
      email: normalizedEmail,
      hostedButtonId,
      flow: "single_document",
      documentId: String(documentId),
      documentName: documentName || mapped.label || null,
      is_edit_locked: true,
      message: "Pago procesado con éxito. Compra única registrada y edición bloqueada.",
    });
  } catch (error) {
    return res.status(500).json({ error: "No se pudo procesar el pago", message: error.message });
  }
});

app.post("/api/subscription/unlimited/create-order", async (req, res) => {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) return res.status(401).json({ error: "No autenticado" });

    const { jsonResponse } = await createOrder({
      amount: UNLIMITED_PLAN_AMOUNT,
      documentName: "Codec Unlimited (Anual)",
      documentId: UNLIMITED_PLAN_CODE,
      customerEmail: sessionUser.email,
    });
    return res.json({ id: jsonResponse.id, amountUsd: UNLIMITED_PLAN_AMOUNT });
  } catch (error) {
    return res.status(500).json({ error: "No se pudo crear la orden de suscripción", message: error.message });
  }
});

app.post("/api/subscription/unlimited/:orderID/capture", async (req, res) => {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) return res.status(401).json({ error: "No autenticado" });

    const { jsonResponse, httpStatusCode } = await captureOrder(req.params.orderID);
    const capture = jsonResponse?.purchase_units?.[0]?.payments?.captures?.[0];

    if (jsonResponse?.status === "COMPLETED" && capture?.status === "COMPLETED") {
      await grantUnlimitedPlan({ email: sessionUser.email, orderId: jsonResponse.id, isLifetime: false });
    }

    const unlimitedActive = await hasActiveUnlimitedByEmail(sessionUser.email);
    return res.status(httpStatusCode).json({ ...jsonResponse, unlimitedActive });
  } catch (error) {
    return res.status(500).json({ error: "No se pudo capturar la suscripción", message: error.message });
  }
});

app.post("/api/subscription/plans/:planId/create-order", async (req, res) => {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) return res.status(401).json({ error: "No autenticado" });

    const { planId } = req.params;
    const plan = SUBSCRIPTION_PLANS[planId];
    if (!plan) return res.status(400).json({ error: "Plan inválido" });

    const { jsonResponse } = await createOrder({
      amount: plan.amount,
      documentName: `Codec ${planId}`,
      documentId: plan.planCode,
      customerEmail: sessionUser.email,
    });

    return res.json({ id: jsonResponse.id, amountUsd: plan.amount, planId });
  } catch (error) {
    return res.status(500).json({ error: "No se pudo crear la orden del plan", message: error.message });
  }
});

app.post("/api/subscription/plans/:planId/:orderID/capture", async (req, res) => {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) return res.status(401).json({ error: "No autenticado" });

    const { planId, orderID } = req.params;
    const plan = SUBSCRIPTION_PLANS[planId];
    if (!plan) return res.status(400).json({ error: "Plan inválido" });

    const { jsonResponse, httpStatusCode } = await captureOrder(orderID);
    const capture = jsonResponse?.purchase_units?.[0]?.payments?.captures?.[0];

    if (jsonResponse?.status === "COMPLETED" && capture?.status === "COMPLETED") {
      await grantPlanByDays({
        email: sessionUser.email,
        orderId: jsonResponse.id,
        planCode: plan.planCode,
        amountUsd: plan.amount,
        days: plan.days,
      });
    }

    const unlimitedActive = await hasActiveUnlimitedByEmail(sessionUser.email);
    return res.status(httpStatusCode).json({ ...jsonResponse, unlimitedActive, expiry_date: addDaysIso(plan.days) });
  } catch (error) {
    return res.status(500).json({ error: "No se pudo capturar la orden del plan", message: error.message });
  }
});

app.post("/api/orders", async (req, res) => {
  try {
    const { amount, documentName, documentId, customerEmail } = req.body || {};

    // Flujo principal solicitado: orden fija para Codec Document en modo Live
    // Mantiene compatibilidad con payload dinámico si el frontend lo envía.
    const parsedAmount = Number.parseFloat(String(amount));
    const safeAmount = Number.isFinite(parsedAmount) ? parsedAmount : 9.99;
    const safeDocumentName = documentName || "Codec Document";

    const { jsonResponse } = await createOrder({
      amount: safeAmount,
      documentName: safeDocumentName,
      documentId,
      customerEmail,
    });

    // Respuesta mínima esperada por el botón JS SDK v6
    res.json({ id: jsonResponse.id });
  } catch (error) {
    console.error("Failed to create order:", error);
    const message = error instanceof ApiError ? error.message : error.message;
    res.status(500).json({ error: "Failed to create order.", message });
  }
});

app.post("/api/orders/:orderID/capture", async (req, res) => {
  try {
    const { orderID } = req.params;
    const { customerEmail, documentName, documentContent } = req.body || {};
    const sessionUser = await getSessionUser(req);
    const { jsonResponse, httpStatusCode } = await captureOrder(orderID);

    const capture = jsonResponse?.purchase_units?.[0]?.payments?.captures?.[0];
    if (jsonResponse?.status === "COMPLETED" && capture?.status === "COMPLETED") {
      const record = {
        orderId: jsonResponse.id,
        documentId: jsonResponse?.purchase_units?.[0]?.reference_id || null,
        documentName: documentName || jsonResponse?.purchase_units?.[0]?.description || "Document",
        customerEmail: customerEmail || jsonResponse?.purchase_units?.[0]?.custom_id || null,
        amount: capture?.amount?.value || "9.99",
        currency: capture?.amount?.currency_code || "USD",
        status: "COMPLETED",
        source: "capture",
        purchasedAt: new Date().toISOString(),
      };
      upsertPurchase(record);
      await sendPurchaseEmails({ ...record, documentContent });

      const documentId = jsonResponse?.purchase_units?.[0]?.reference_id || null;
      if (sessionUser?.email && documentId) {
        await upsertUserDocumentPurchase({
          email: sessionUser.email,
          documentId,
          documentName: record.documentName,
          orderId: jsonResponse.id,
        });
      }
    }

    res.status(httpStatusCode).json(jsonResponse);
  } catch (error) {
    console.error("Failed to capture order:", error);
    res.status(500).json({ error: "Failed to capture order.", message: error.message });
  }
});

app.post("/api/paypal/webhook", async (req, res) => {
  try {
    if (!PAYPAL_WEBHOOK_ID) return res.status(503).json({ error: "PAYPAL_WEBHOOK_ID not configured" });

    const isValid = await verifyWebhookSignature(req);
    if (!isValid) return res.status(400).json({ error: "Invalid webhook signature" });

    const event = req.body;
    if (event?.event_type === "PAYMENT.CAPTURE.COMPLETED") {
      const resource = event.resource || {};
      const orderId = resource.supplementary_data?.related_ids?.order_id;
      const { body } = await ordersController.getOrder({ id: orderId });
      const order = JSON.parse(body);
      const amount = resource?.amount?.value || "9.99";
      const documentName = order?.purchase_units?.[0]?.description || "Document";
      const customerEmail = order?.purchase_units?.[0]?.custom_id || null;

      const record = {
        orderId,
        documentId: order?.purchase_units?.[0]?.reference_id || null,
        documentName,
        customerEmail,
        amount,
        currency: resource?.amount?.currency_code || "USD",
        status: "COMPLETED",
        source: "webhook",
        purchasedAt: new Date().toISOString(),
      };
      upsertPurchase(record);
      await sendPurchaseEmails(record);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(500).json({ error: "Webhook processing failed", message: error.message });
  }
});

app.get("/api/purchases/:orderID/status", (req, res) => {
  const { orderID } = req.params;
  const found = readPurchases().find((p) => p.orderId === orderID && p.status === "COMPLETED");
  if (!found) return res.status(404).json({ unlocked: false });
  return res.json({ unlocked: true, purchase: found });
});

app.get("/api/orders/:orderID", async (req, res) => {
  try {
    const { body } = await ordersController.getOrder({ id: req.params.orderID });
    res.json(JSON.parse(body));
  } catch (error) {
    res.status(500).json({ error: "Failed to get order details.", message: error.message });
  }
});

app.post("/api/signature-requests", async (req, res) => {
  try {
    await ensureSignatureRequestsTable();

    const {
      orderId,
      documentId,
      documentName,
      documentContent,
      buyerEmail,
      buyerName,
      signerEmail,
      signerName,
      contractSignerName,
      contractSignerId,
      brandingLogo,
      signaturePlacement,
      signaturePlacementNotes,
      signatureCoordinates,
      feePaymentConfirmed,
    } = req.body || {};

    const isAdminBypass = isAdminEmail(buyerEmail);
    const adminFallbackEmail = ADMIN_EMAILS_NORMALIZED[0] || normalizeEmail(ADMIN_EMAIL);
    const effectiveSignerEmail = signerEmail || (isAdminBypass ? adminFallbackEmail : "");
    const effectiveSignerName = signerName || (isAdminBypass ? "Admin Mobile Signer" : "");

    if (!orderId || !effectiveSignerEmail || !effectiveSignerName) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const usage = await getDailySignatureUsage({ buyerEmail, buyerIp: getClientIp(req) });
    const requiredFeeUsd = usage.freeRemaining > 0 ? 0 : SIGNATURE_EXTRA_REQUEST_FEE_USD;
    if (requiredFeeUsd > 0 && feePaymentConfirmed !== true) {
      return res.status(402).json({
        error: "PAYMENT_REQUIRED_FOR_SIGNATURE_REQUEST",
        message: `La solicitud adicional de firma cuesta USD ${SIGNATURE_EXTRA_REQUEST_FEE_USD.toFixed(2)}.`,
        pricing: {
          freePerDay: 1,
          dailyUsage: usage.count,
          freeRemaining: usage.freeRemaining,
          requiredFeeUsd,
        },
      });
    }

    const token = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const buyerIp = getClientIp(req);
    const guestLink = `${FRONTEND_URL}/guest-sign/${token}`;

    await dbRun(
      `INSERT INTO signature_requests
      (token, orderId, documentId, documentName, documentContent, buyerEmail, buyerName, signerEmail, signerName, contractSignerName, contractSignerId, brandingLogo, buyerIp, signaturePlacement, signaturePlacementNotes, signaturePage, signatureX, signatureY, signatureFeeUsd, isFreeDailyRequest, status, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)`,
      [
        token,
        orderId,
        documentId || null,
        documentName || "Document",
        documentContent || null,
        buyerEmail || null,
        buyerName || null,
        effectiveSignerEmail,
        effectiveSignerName,
        contractSignerName || effectiveSignerName,
        contractSignerId || null,
        brandingLogo || null,
        buyerIp,
        signaturePlacement || "right",
        signaturePlacementNotes || null,
        Number(signatureCoordinates?.page_number || 1),
        Math.max(0, Math.min(1, Number(signatureCoordinates?.x_coordinate || 0))),
        Math.max(0, Math.min(1, Number(signatureCoordinates?.y_coordinate || 0))),
        requiredFeeUsd,
        requiredFeeUsd === 0 ? 1 : 0,
        createdAt,
      ]
    );

    dispatchSignatureRequestEmailInBackground({
      to: effectiveSignerEmail,
      documentName,
      guestLink,
    });

    return res.status(200).json({ token, guestLink, status: "PENDING", isAdminBypass, signatureFeeUsd: requiredFeeUsd, isFreeDailyRequest: requiredFeeUsd === 0 });
  } catch (error) {
    console.error(error);
    console.error("Failed to create signature request:", error);
    return res.status(500).json({ error: "Failed to create signature request", message: error.message });
  }
});

app.get("/api/signature-requests/:token", async (req, res) => {
  try {
    const row = await dbGet(
      `SELECT token, orderId, documentId, documentName, documentContent, buyerEmail, buyerName, signerEmail, signerName, contractSignerName, contractSignerId, brandingLogo, signaturePlacement, signaturePlacementNotes, signaturePage, signatureX, signatureY, signatureFeeUsd, isFreeDailyRequest, status, createdAt, guestSignedAt, guestIp, guestUserAgent, signatureDataUrl
       FROM signature_requests WHERE token = ?`,
      [req.params.token]
    );
    if (!row) return res.status(404).json({ error: "Not found" });
    return res.json(row);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch signature request", message: error.message });
  }
});

app.post("/api/signature-requests/:token/sign", async (req, res) => {
  try {
    const { signatureDataUrl, signerName } = req.body || {};
    if (!signatureDataUrl) return res.status(400).json({ error: "Signature is required" });

    const token = req.params.token;
    const row = await dbGet(`SELECT * FROM signature_requests WHERE token = ?`, [token]);
    if (!row) return res.status(404).json({ error: "Not found" });

    const guestIp = getClientIp(req);
    const guestUserAgent = getUserAgent(req);
    const guestSignedAt = new Date().toISOString();
    await dbRun(
       `UPDATE signature_requests
        SET signatureDataUrl = ?, guestIp = ?, guestUserAgent = ?, guestSignedAt = ?, status = 'COMPLETED', contractSignerName = COALESCE(?, contractSignerName)
        WHERE token = ?`,
      [signatureDataUrl, guestIp, guestUserAgent, guestSignedAt, signerName || null, token]
    );

    if (transporter && row.buyerEmail) {
      await transporter.sendMail({
        from: SMTP_FROM || SMTP_USER,
        to: row.buyerEmail,
        subject: `Guest signature completed - ${row.documentName}`,
        text: `The invited signer has completed their signature.\n\nDocument: ${row.documentName}\nOrder ID: ${row.orderId}\nSigned at: ${guestSignedAt}`,
      });
    }

    return res.json({ status: "COMPLETED", guestSignedAt, guestIp, guestUserAgent, webhookDispatched: true });
  } catch (error) {
    return res.status(500).json({ error: "Failed to save signature", message: error.message });
  }
});

app.get("/api/signature-requests/order/:orderId", async (req, res) => {
  try {
    const row = await dbGet(`SELECT * FROM signature_requests WHERE orderId = ? ORDER BY createdAt DESC`, [req.params.orderId]);
    if (!row) return res.status(404).json({ found: false });
    return res.json({
      found: true,
      audit: {
        documentId: row.documentId,
        orderId: row.orderId,
        buyerEmail: row.buyerEmail,
        buyerName: row.buyerName,
        signerName: row.contractSignerName || row.signerName,
        signerId: row.contractSignerId,
        buyerIp: row.buyerIp,
        guestIp: row.guestIp,
        buyerSignedAt: row.createdAt,
        guestSignedAt: row.guestSignedAt,
        guestUserAgent: row.guestUserAgent,
        signatureDataUrl: row.signatureDataUrl,
        signaturePage: row.signaturePage,
        signatureX: row.signatureX,
        signatureY: row.signatureY,
        signatureMethod: "Mobile Device",
        status: row.status,
        legalStatus: "Documento Validado bajo E-SIGN Act",
      },
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to get audit", message: error.message });
  }
});

app.get("/api/signature-requests/order/:orderId/all", async (req, res) => {
  try {
    const rows = await dbAll(
      `SELECT * FROM signature_requests WHERE orderId LIKE ? ORDER BY createdAt ASC`,
      [`${req.params.orderId}%`]
    );
    if (!rows || rows.length === 0) return res.status(404).json({ found: false });

    const signatures = rows.map((row) => ({
      token: row.token,
      orderId: row.orderId,
      documentId: row.documentId,
      buyerEmail: row.buyerEmail,
      buyerName: row.buyerName,
      signerName: row.contractSignerName || row.signerName,
      signerId: row.contractSignerId,
      buyerIp: row.buyerIp,
      guestIp: row.guestIp,
      buyerSignedAt: row.createdAt,
      guestSignedAt: row.guestSignedAt,
      guestUserAgent: row.guestUserAgent,
      signatureDataUrl: row.signatureDataUrl,
      signaturePage: row.signaturePage,
      signatureX: row.signatureX,
      signatureY: row.signatureY,
      signatureMethod: "Mobile Device",
      status: row.status,
      legalStatus: "Documento Validado bajo E-SIGN Act",
    }));

    return res.json({ found: true, signatures });
  } catch (error) {
    return res.status(500).json({ error: "Failed to get signatures", message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ PayPal Server running on http://localhost:${PORT}`);
  console.log(`🔧 Environment: ${NODE_ENV}`);
});
