const otpService = require('./otp.service');
const ApiError = require('../utils/ApiError');
const emailService = require('./email.service');

const crypto = require("crypto");
const User = require('../models/User.model');
const Session = require('../models/Session.model');
const bcrypt = require('bcryptjs');
const SALT_ROUNDS = 12;

const {
  generateTokens,
  verifyRefreshToken,
} = require('../utils/jwt.util');

class AuthService {

  /**
   * ==========================================================
   * Register User
   * ==========================================================
   */
  async register(userData, ipAddress, userAgent) {

    const {
      name,
      email,
      password,
      phone,
    } = userData;

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone?.trim() || null;

    // Check existing user
    const existingUser = await User.findOne({
      email: normalizedEmail
    });

    if (existingUser) {
      throw new ApiError(
        400,
        'User already exists with this email'
      );
    }

    // Hash password
    const hashedPassword =
      await bcrypt.hash(password, SALT_ROUNDS);

    // Create User
    const user = await User.create({

      name: normalizedName,

      email: normalizedEmail,

      password: hashedPassword,

      phone: normalizedPhone,

      role: "customer",

      status: 'pending',

      isEmailVerified: false,

    });

    await otpService.createAndSendOtp(
      user.email,
      'email_verify',
      {
        name: user.name,
      }
    );
    return {

      user: {

        id: user._id,

        name: user.name,

        email: user.email,

        role: user.role,

        phone: user.phone ?? null,

        isEmailVerified: user.isEmailVerified,

      },
    };

  }
  /**
 * ==========================================================
 * Login User
 * ==========================================================
 */
  async login(email, password, ipAddress, userAgent,  allowedRoles = []) {

    // Find user with password
    const normalizedEmail =
      email.trim().toLowerCase();

  const user = await User.findOne({
  email: normalizedEmail
}).select('+password');

if (!user) {
  throw new ApiError(401, 'Invalid email or password');
}

if (
  Array.isArray(allowedRoles) &&
  allowedRoles.length > 0 &&
  !allowedRoles.includes(user.role)
) {
  throw new ApiError(403, 'You are not allowed to login from this portal');
}

    // Account Lock Check
    if (
      user.accountLockedUntil &&
      user.accountLockedUntil > new Date()
    ) {
      throw new ApiError(
        403,
        'Your account is temporarily locked. Please try again later.'
      );
    }

    // Compare Password
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordValid) {

      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

      if (user.failedLoginAttempts >= 5) {
        user.accountLockedUntil = new Date(
          Date.now() + 30 * 60 * 1000
        );
      }

      await user.save({
        validateBeforeSave: false
      });

      throw new ApiError(
        401,
        'Invalid email or password'
      );
    }

    // Reset failed attempts
    user.failedLoginAttempts = 0;
    user.accountLockedUntil = null;

    await user.save();

    /**
     * Email Verification Check
     */
    if (!user.isEmailVerified) {

      await otpService.resendOtp(
        user.email,
        'email_verify',
        {
          name: user.name,
        }
      );

      throw new ApiError(
        403,
        'Email not verified. A new OTP has been sent.'
      );
    }

    /**
     * Account Status Check
     */
    if (user.status !== 'active') {
      throw new ApiError(
        403,
        `Your account is ${user.status}`
      );
    }

    /**
     * Generate Tokens
     */
    const {
      accessToken,
      refreshToken,
    } = generateTokens(
      user._id,
      user.role
    );
    await Session.create({

      user: user._id,

      refreshToken,
      deviceId: crypto.randomUUID(),

      deviceName: userAgent,

      ipAddress,

      expiresAt: new Date(
        Date.now() +
        7 * 24 * 60 * 60 * 1000
      ),

    });

    return {

      user: {

        id: user._id,

        name: user.name,

        email: user.email,

        phone: user.phone,

        avatar: user.avatar,

        role: user.role,

        permissions: user.permissions || [],

      },

      accessToken,

      refreshToken,

    };

  }

  /**
   * ==========================================================
   * Refresh Token
   * ==========================================================
   */
  async refreshToken(refreshToken) {

    if (!refreshToken) {
      throw new ApiError(
        401,
        'Refresh token is required'
      );
    }

    const decoded =
      verifyRefreshToken(refreshToken);

    const session =
      await Session.findOne({

        refreshToken,

        isActive: true,

        expiresAt: {
          $gt: new Date(),
        },

      });

    if (!session) {
      throw new ApiError(
        401,
        'Invalid or expired refresh token'
      );
    }

    const user =
      await User.findById(decoded.id)
        .select("_id role status");

    if (!user) {
      throw new ApiError(
        404,
        'User not found'
      );
    }

    if (user.status !== "active") {
      throw new ApiError(403, "Account inactive");
    }

    const {
      accessToken,
      refreshToken: newRefreshToken,
    } = generateTokens(
      user._id,
      user.role
    );

    session.refreshToken = newRefreshToken;
    session.lastActiveAt = new Date();

    await session.save();

    return {

      accessToken,

      refreshToken: newRefreshToken,

    };


  }
  /**
 * ==========================================================
 * Logout User
 * ==========================================================
 */
  async logout(refreshToken) {

    if (refreshToken) {

      await Session.findOneAndUpdate(

        {
          refreshToken
        },

        {
          isActive: false,
          lastActiveAt: new Date()
        }

      );

    }

    return true;

  }

  /**
   * ==========================================================
   * Verify Email
   * ==========================================================
   */
  async verifyEmail(email, otp) {

    // Verify OTP
    await otpService.verifyOtp(
      email,
      otp,
      'email_verify'
    );

    // Find User
    const user = await User.findOne({
      email: email.trim().toLowerCase()
    });

    if (!user) {
      throw new ApiError(
        404,
        'User not found'
      );
    }

    // Activate Account
    user.isEmailVerified = true;
    user.emailVerifiedAt = new Date();
    user.status = 'active';
    await user.save(); 
    /**
     * Send Welcome Email
     */
    await emailService.sendWelcomeEmail(
      user.email,
      user.name
    );

    return true;

  }

  /**
   * ==========================================================
   * Resend Verification OTP
   * ==========================================================
   */
  async resendVerificationOtp(email) {

    const user = await User.findOne({
      email,
    });

    if (!user) {
      throw new ApiError(
        404,
        'User not found'
      );
    }

    if (user.isEmailVerified) {
      throw new ApiError(
        400,
        'Email is already verified'
      );
    }

    /**
     * resendOtp()
     * already handles:
     *
     * ✔ Rate Limit
     * ✔ OTP Generation
     * ✔ Email Sending
     */

    await otpService.resendOtp(
      email,
      'email_verify',
      {
        name: user.name,
      }
    );

    return true;

  }
  /**
 * ==========================================================
 * Forgot Password
 * ==========================================================
 */
  async forgotPassword(email) {

    const user = await User.findOne({
      email: email.trim().toLowerCase()
    });

    // Security:
    // Don't reveal whether user exists or not
    if (!user) {
      return true;
    }

    await otpService.createAndSendOtp(
      email,
      'forgot_password',
      {
        name: user.name,
      }
    );

    return true;

  }

  /**
   * ==========================================================
   * Reset Password
   * ==========================================================
   */
  async resetPassword(email, otp, newPassword) {

    // Verify OTP
    await otpService.verifyOtp(
      email,
      otp,
      'forgot_password'
    );

    // Find User
    const user = await User.findOne({
      email: email.trim().toLowerCase()
    });

    if (!user) {
      throw new ApiError(
        404,
        'User not found'
      );
    }

    // Hash New Password
    user.password =
      await bcrypt.hash(
        newPassword,
        SALT_ROUNDS
      );

    user.passwordChangedAt = new Date();

    await user.save();

    // Logout from all devices
    await Session.deleteMany({
      user: user._id,
    });

    return true;

  }

}

module.exports = new AuthService();
