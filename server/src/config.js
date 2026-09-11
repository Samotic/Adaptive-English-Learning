/**
 * Central configuration. Every environment variable the server reads is listed here
 * (see server/.env.example for documentation).
 */
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env'), quiet: true });

const env = process.env.NODE_ENV || 'development';
const isProduction = env === 'production';
const isTest = env === 'test';

function resolveJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (secret) {
    if (isProduction && secret.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters long in production');
    }
    return secret;
  }
  if (isProduction) {
    throw new Error('JWT_SECRET is required in production');
  }
  if (!isTest) {
    console.warn('⚠️  JWT_SECRET is not set - using a random secret. Everyone is logged out on every restart. Set JWT_SECRET in server/.env');
  }
  // Never fall back to a well-known secret: anyone could forge tokens with it.
  return crypto.randomBytes(48).toString('hex');
}

function parseTrustProxy(value) {
  if (!value || value === 'false') return false;
  if (value === 'true') return true;
  const hops = Number(value);
  return Number.isInteger(hops) ? hops : value;
}

const list = (value, fallback) =>
  value ? value.split(',').map((s) => s.trim()).filter(Boolean) : fallback;

export const config = {
  env,
  isProduction,
  isTest,
  port: Number(process.env.PORT) || 4000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017',
  mongoDbName: process.env.MONGODB_DB || 'english',
  jwtSecret: resolveJwtSecret(),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientOrigins: list(process.env.CLIENT_ORIGIN, ['http://localhost:5173']),
  appUrl: process.env.APP_URL || 'http://localhost:5173',
  serveClient: process.env.SERVE_CLIENT === 'true',
  // Set when running behind a reverse proxy (e.g. TRUST_PROXY=1) so rate limiting sees real client IPs
  trustProxy: parseTrustProxy(process.env.TRUST_PROXY),
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
    enableFeedback: process.env.ENABLE_AI_FEEDBACK === 'true'
  },
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'Adaptive English <no-reply@localhost>'
  },
  retention: {
    trainingDataDays: Number(process.env.TRAINING_DATA_RETENTION_DAYS) || 365,
    auditLogDays: Number(process.env.AUDIT_LOG_RETENTION_DAYS) || 365
  },
  rateLimit: {
    authWindowMs: 15 * 60 * 1000,
    authMax: Number(process.env.AUTH_RATE_LIMIT_MAX) || (isTest ? 10000 : 20)
  }
};

export default config;
