import crypto from 'crypto';
import express from 'express';
import UserModel from '../models/user.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../middleware/errors.js';
import { isValidEmail } from '../services/userService.js';
import { sendVerificationEmail } from '../services/notificationService.js';

const router = express.Router();
const PUBLIC_FIELDS = '-password -verificationToken';

router.get('/profile', requireAuth, (req, res) => {
  res.json(req.user);
});

router.put('/profile', requireAuth, asyncHandler(async (req, res) => {
  const { email, firstName, lastName } = req.body || {};
  const set = {};
  const unset = {};
  let verificationToken;

  if (firstName !== undefined) set.firstName = String(firstName).trim().slice(0, 50);
  if (lastName !== undefined) set.lastName = String(lastName).trim().slice(0, 50);

  if (email !== undefined) {
    const cleanEmail = String(email ?? '').trim().toLowerCase();
    if (cleanEmail && !isValidEmail(cleanEmail)) throw new HttpError(400, 'Email address is invalid');

    if (cleanEmail !== (req.user.email || '')) {
      if (!cleanEmail) {
        unset.email = 1;
        unset.verificationToken = 1;
        set.emailVerified = false;
      } else {
        if (await UserModel.exists({ email: cleanEmail, _id: { $ne: req.user._id } })) {
          throw new HttpError(409, 'That email address is already in use');
        }
        verificationToken = crypto.randomBytes(32).toString('hex');
        Object.assign(set, { email: cleanEmail, emailVerified: false, verificationToken });
      }
    }
  }

  const update = {};
  if (Object.keys(set).length) update.$set = set;
  if (Object.keys(unset).length) update.$unset = unset;

  const user = Object.keys(update).length
    ? await UserModel.findByIdAndUpdate(req.user._id, update, { new: true, runValidators: true }).select(PUBLIC_FIELDS)
    : req.user;

  if (verificationToken) await sendVerificationEmail(set.email, verificationToken);
  res.json(user);
}));

export default router;
