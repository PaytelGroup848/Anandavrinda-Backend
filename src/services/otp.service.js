const ApiError = require('../utils/ApiError');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const OtpToken = require('../models/Otptoken.model');
const emailService = require('./email.service');

// ─── Generate secure 6-digit OTP ─────────────────────────────────────────────
const generateOTP = () => {
  // Cryptographically secure random 6-digit number
  const buf = crypto.randomBytes(3);
  const num = buf.readUIntBE(0, 3) % 1000000;
  return num.toString().padStart(6, '0');
};

// ─── OTP expiry (minutes → Date) ─────────────────────────────────────────────
const expiresInMinutes = (mins) => new Date(Date.now() + mins * 60 * 1000);

class OtpService {
  // ── Create OTP, save to DB, send email ────────────────────────────────────
  async createAndSendOtp(email, type, userMeta = {}) {
    // Delete any existing OTPs for this email + type
    await OtpToken.deleteMany({ email, type });

    const otp = generateOTP();
    const hashedOtp = await bcrypt.hash(otp, 10);

    await OtpToken.create({
      email,
      otp: hashedOtp,
      type,
      expiresAt: expiresInMinutes(10),
    });

    if (process.env.NODE_ENV === 'development') {
    console.log(`\n🔐 OTP [${type}] for ${email}: ${otp}\n`);
}

    // ── Send the right email based on type ──────────────────────────────────
    const name = userMeta.name || 'User';

    switch (type) {

      case "email_change":
    await emailService.sendEmailChangeOtp(
        email,
        name,
        otp
    );
        break;
      case 'email_verify':
        await emailService.sendVerificationEmail(email, name, otp);
        break;
      case 'forgot_password':
        await emailService.sendPasswordResetEmail(email, name, otp);
        break;
      default:
        // Generic fallback — send as verification
        await emailService.sendVerificationEmail(email, name, otp);
    }

    // In development, return otp so frontend can show it (remove in prod)
    return {
      otp: process.env.NODE_ENV === 'development' ? otp : undefined,
    };
  }

  // ── Verify OTP ────────────────────────────────────────────────────────────
  async verifyOtp(email, otp, type) {
    const record = await OtpToken.findOne({
      email,
      type,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });

    if (!record) {
     throw new ApiError(
    400,
    'OTP has expired or does not exist. Please request a new one.'
);
    }

    if (record.attempts >= 5) {
      await OtpToken.deleteOne({ _id: record._id });
      throw new ApiError( 400,
        'Too many incorrect attempts. Please request a new OTP.');
    }

    const isValid = await bcrypt.compare(otp.toString(), record.otp);

    if (!isValid) {
      record.attempts += 1;
      await record.save();
      const remaining = 5 - record.attempts;
      throw new ApiError( 400,
        `Invalid OTP. ${remaining} attempt(s) remaining.`);
    }

    // Mark as used
    record.isUsed = true;
    await record.save();

    return true;
  }

  // ── Resend OTP (rate-limited: max 1 per minute) ───────────────────────────
  async resendOtp(email, type, userMeta = {}) {
    // Check if a recent OTP was sent in last 60 seconds
    const recent = await OtpToken.findOne({
      email,
      type,
      createdAt: { $gt: new Date(Date.now() - 60 * 1000) },
    });

    if (recent) {
      const waitSecs = Math.ceil((recent.createdAt.getTime() + 60000 - Date.now()) / 1000);
      throw new ApiError( 400,
        `Please wait ${waitSecs} second(s) before requesting a new OTP.`);
    }

    return this.createAndSendOtp(email, type, userMeta);
  }
}

module.exports = new OtpService();