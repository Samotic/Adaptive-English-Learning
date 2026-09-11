/**
 * User Service
 * Registration, password login, email verification and Google sign-in.
 */
import crypto from 'crypto';
import UserModel, { USERNAME_PATTERN, MIN_PASSWORD_LENGTH } from '../models/user.js';
import { HttpError } from '../middleware/errors.js';
import { verifyGoogleIdToken } from './oauthService.js';
import { sendVerificationEmail } from './notificationService.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_PASSWORD_LENGTH = 128;

export function isValidEmail(email) {
  return typeof email === 'string' && email.length <= 254 && EMAIL_PATTERN.test(email.trim());
}

export function validateRegistration({ username, password, email }) {
  const errors = [];
  if (typeof username !== 'string' || !USERNAME_PATTERN.test(username.trim())) {
    errors.push('Username must be 3-30 characters and use only letters, numbers, dots, dashes or underscores');
  }
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    errors.push(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  } else if (password.length > MAX_PASSWORD_LENGTH) {
    errors.push(`Password must be at most ${MAX_PASSWORD_LENGTH} characters`);
  }
  if (email !== undefined && email !== null && email !== '' && !isValidEmail(email)) {
    errors.push('Email address is invalid');
  }
  return errors;
}

class UserService {
  async registerUser({ username, password, email }) {
    const errors = validateRegistration({ username, password, email });
    if (errors.length) throw new HttpError(400, errors[0], errors);

    const cleanUsername = username.trim();
    const cleanEmail = email ? email.trim().toLowerCase() : undefined;

    const conflict = await UserModel.exists({
      $or: [{ username: cleanUsername }, ...(cleanEmail ? [{ email: cleanEmail }] : [])]
    });
    if (conflict) throw new HttpError(409, 'That username or email is already registered');

    const verificationToken = cleanEmail ? crypto.randomBytes(32).toString('hex') : undefined;
    const user = await UserModel.create({
      username: cleanUsername,
      email: cleanEmail,
      password,
      role: 'student',
      emailVerified: false,
      verificationToken
    });

    if (cleanEmail) await sendVerificationEmail(cleanEmail, verificationToken);
    return user;
  }

  /** Returns the user when the credentials match, otherwise null. Accepts username or email. */
  async authenticate(identifier, password) {
    if (typeof identifier !== 'string' || typeof password !== 'string' || !identifier.trim()) return null;
    const value = identifier.trim();
    let user = await UserModel.findOne({ username: value });
    if (!user && value.includes('@')) user = await UserModel.findOne({ email: value.toLowerCase() });
    if (!user) return null;
    return (await user.comparePassword(password)) ? user : null;
  }

  async activateAccount(token) {
    if (typeof token !== 'string' || !token) throw new HttpError(400, 'Verification token is required');
    const user = await UserModel.findOne({ verificationToken: token });
    if (!user) throw new HttpError(400, 'Invalid or expired verification token');
    user.emailVerified = true;
    user.verificationToken = undefined;
    await user.save();
    return { success: true, message: 'Account activated successfully' };
  }

  async loginWithGoogle(idToken) {
    const google = await verifyGoogleIdToken(idToken);

    let user = await UserModel.findOne({ googleId: google.googleId });
    if (!user) {
      // Only link to an existing account whose email was verified; otherwise someone could
      // pre-register a victim's email address and take over their Google sign-in.
      const existing = await UserModel.findOne({ email: google.email, emailVerified: true });
      if (existing) {
        existing.googleId = google.googleId;
        if (!existing.profilePicture) existing.profilePicture = google.picture;
        await existing.save();
        user = existing;
      }
    }

    if (!user) {
      user = await UserModel.create({
        username: await this.generateUniqueUsername(google.email.split('@')[0]),
        email: google.email,
        firstName: google.firstName,
        lastName: google.lastName,
        googleId: google.googleId,
        emailVerified: true,
        authProvider: 'google',
        role: 'student',
        profilePicture: google.picture
      });
    }
    return user;
  }

  async generateUniqueUsername(base) {
    const cleaned = (base || '').replace(/[^a-zA-Z0-9_.-]/g, '').slice(0, 24).padEnd(3, '0') || 'user';
    let candidate = cleaned;
    for (let attempt = 0; attempt < 10 && await UserModel.exists({ username: candidate }); attempt++) {
      candidate = `${cleaned}${crypto.randomInt(1000, 10000)}`;
    }
    return candidate;
  }

  toPublicUser(user) {
    return {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role || 'student',
      theta: user.theta ?? 0,
      points: user.points ?? 0,
      profilePicture: user.profilePicture,
      emailVerified: Boolean(user.emailVerified)
    };
  }
}

export default new UserService();
