import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export const USERNAME_PATTERN = /^[a-zA-Z0-9_.-]{3,30}$/;
export const MIN_PASSWORD_LENGTH = 8;

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String }, // Optional for OAuth users
  role: { type: String, enum: ['student', 'teacher', 'admin'], default: 'student' },
  email: { type: String, trim: true, lowercase: true },
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },

  // Adaptive engine (IRT ability estimate) and gamification
  theta: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
  pathGeneratedAt: { type: Date },
  lastActiveAt: { type: Date },

  // OAuth fields
  googleId: { type: String, unique: true, sparse: true },
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
  profilePicture: { type: String },

  // Email verification
  emailVerified: { type: Boolean, default: false },
  verificationToken: { type: String },

  // GDPR Consent (FR19). Using interaction data for model training is opt-in.
  dataProcessingConsent: { type: Boolean, default: true },
  marketingConsent: { type: Boolean, default: false },
  analyticsConsent: { type: Boolean, default: false },
  consentDate: { type: Date, default: Date.now },
  consentUpdatedAt: { type: Date }
}, { timestamps: true });

UserSchema.index({ email: 1 }, { sparse: true });
UserSchema.index({ role: 1 });

const BCRYPT_HASH = /^\$2[aby]\$/;

// Hash the password only when it changed and is not already a bcrypt hash
UserSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password') || !this.password || BCRYPT_HASH.test(this.password)) return;
  this.password = await bcrypt.hash(this.password, 10);
});

UserSchema.methods.comparePassword = function comparePassword(candidate) {
  if (!this.password || typeof candidate !== 'string') return Promise.resolve(false);
  return bcrypt.compare(candidate, this.password);
};

export const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
export default UserModel;
