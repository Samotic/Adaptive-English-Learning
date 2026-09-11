import nodemailer from 'nodemailer';
import { config } from '../config.js';

let transporter = null;

export function isEmailConfigured() {
  return Boolean(config.smtp.host);
}

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined
    });
  }
  return transporter;
}

/** Sends an email via SMTP. Returns false (never throws) when SMTP is not configured or sending fails. */
export async function sendEmail({ to, subject, text, html }) {
  if (!to) return false;
  if (!isEmailConfigured()) {
    if (!config.isTest) console.log(`[Email] SMTP not configured - skipped email "${subject}"`);
    return false;
  }
  try {
    await getTransporter().sendMail({ from: config.smtp.from, to, subject, text, html });
    return true;
  } catch (err) {
    console.error(`[Email] Failed to send "${subject}":`, err.message);
    return false;
  }
}
