import express from 'express';
import rateLimit from 'express-rate-limit';
import { config } from '../config.js';
import { asyncHandler } from '../middleware/errors.js';
import { signToken } from '../middleware/auth.js';
import userService from '../services/userService.js';
import * as auditService from '../services/auditService.js';
import { isGoogleAuthConfigured } from '../services/oauthService.js';

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: config.rateLimit.authWindowMs,
  limit: config.rateLimit.authMax,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again in a few minutes.' }
});

const logName = (value) => (typeof value === 'string' && value.trim() ? value.trim().slice(0, 100) : 'unknown');
const authResponse = (user) => ({ token: signToken(user), user: userService.toPublicUser(user) });

router.post('/register', authLimiter, asyncHandler(async (req, res) => {
  const { username, password, email } = req.body || {};
  try {
    const user = await userService.registerUser({ username, password, email });
    await auditService.logAction('REGISTER', user.username, 'New user registration', req.ip, 'SUCCESS', user._id);
    res.status(201).json(authResponse(user));
  } catch (err) {
    await auditService.logAction('REGISTER', logName(username), `Registration failed: ${err.message}`, req.ip, 'FAILURE');
    throw err;
  }
}));

router.post('/login', authLimiter, asyncHandler(async (req, res) => {
  const { username, password } = req.body || {};
  const user = await userService.authenticate(username, password);

  if (!user) {
    await auditService.logAction('LOGIN', logName(username), 'Invalid credentials', req.ip, 'FAILURE');
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  await auditService.logAction('LOGIN', user.username, 'User logged in', req.ip, 'SUCCESS', user._id);
  res.json(authResponse(user));
}));

// Public client configuration for sign-in options
router.get('/auth/config', (req, res) => {
  res.json({
    googleEnabled: isGoogleAuthConfigured(),
    googleClientId: config.googleClientId || null
  });
});

// Google Identity Services sends an ID token ("credential")
router.post('/auth/google', authLimiter, asyncHandler(async (req, res) => {
  const { credential, token } = req.body || {};
  const user = await userService.loginWithGoogle(credential || token);
  await auditService.logAction('LOGIN_GOOGLE', user.username, 'User signed in with Google', req.ip, 'SUCCESS', user._id);
  res.json({ success: true, ...authResponse(user) });
}));

router.post('/verify-email', authLimiter, asyncHandler(async (req, res) => {
  res.json(await userService.activateAccount(req.body?.token));
}));

export default router;
