import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { config } from '../config.js';
import UserModel from '../models/user.js';

export const STAFF_ROLES = ['teacher', 'admin'];

export function signToken(user) {
  return jwt.sign(
    { userId: user._id.toString(), role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

function extractToken(req) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  return scheme === 'Bearer' && token ? token : null;
}

/**
 * Verifies the bearer token and loads the current user into req.user / req.userId.
 * Responds 401 for missing, invalid or expired tokens and for deleted users.
 */
export async function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  if (!payload?.userId || !mongoose.isValidObjectId(payload.userId)) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  try {
    const user = await UserModel.findById(payload.userId).select('-password -verificationToken');
    if (!user) return res.status(401).json({ error: 'User no longer exists' });
    req.user = user;
    req.userId = user._id.toString();
    next();
  } catch (err) {
    next(err);
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Requires role: ${roles.join(' or ')}` });
    }
    next();
  };
}

export const requireStaff = requireRole(...STAFF_ROLES);
export const requireAdmin = requireRole('admin');

export const isStaff = (user) => STAFF_ROLES.includes(user?.role);

/** Users may access their own data; teachers and admins may access anyone's. */
export function canAccessUser(req, targetUserId) {
  return req.userId === String(targetUserId) || isStaff(req.user);
}
