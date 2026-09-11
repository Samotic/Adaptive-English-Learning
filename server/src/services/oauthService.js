/**
 * OAuth Service - Google Sign-In
 * Verifies Google ID tokens (from Google Identity Services on the client) with Google's public keys.
 */
import { OAuth2Client } from 'google-auth-library';
import { config } from '../config.js';
import { HttpError } from '../middleware/errors.js';

let client = null;

export function isGoogleAuthConfigured() {
  return Boolean(config.googleClientId);
}

export async function verifyGoogleIdToken(idToken) {
  if (!isGoogleAuthConfigured()) {
    throw new HttpError(503, 'Google sign-in is not configured on this server');
  }
  if (typeof idToken !== 'string' || idToken.length < 20) {
    throw new HttpError(400, 'A Google ID token is required');
  }

  client ??= new OAuth2Client(config.googleClientId);

  let payload;
  try {
    const ticket = await client.verifyIdToken({ idToken, audience: config.googleClientId });
    payload = ticket.getPayload();
  } catch {
    throw new HttpError(401, 'Google credential could not be verified');
  }

  if (!payload?.sub || !payload.email) {
    throw new HttpError(401, 'Google credential is missing required claims');
  }
  if (!payload.email_verified) {
    throw new HttpError(401, 'Your Google account email address is not verified');
  }

  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    firstName: payload.given_name || '',
    lastName: payload.family_name || '',
    picture: payload.picture
  };
}

export default { isGoogleAuthConfigured, verifyGoogleIdToken };
