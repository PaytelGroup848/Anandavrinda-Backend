const authService = require('../services/auth.service');
const ApiResponse = require('../utils/ApiResponse');

class AuthController {
  async register(req, res, next) {
    try {
      const { name, email, password, phone } = req.body;
      
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const result = await authService.register(
        { name, email, password, phone },
        ipAddress,
        userAgent
      );

      res.status(201).json(
        ApiResponse.success('Registration successful. Please verify your email', {
          user: result.user,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password,  allowedRoles } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const result = await authService.login(email, password, ipAddress, userAgent,allowedRoles);

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json(
        ApiResponse.success('Login successful', {
          user: result.user,
          accessToken: result.accessToken,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      const result = await authService.refreshToken(refreshToken);

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json(
        ApiResponse.success('Token refreshed', {
          accessToken: result.accessToken,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const refreshToken = req.cookies.refreshToken;
      await authService.logout(refreshToken);

      res.clearCookie('refreshToken');
      res.status(200).json(ApiResponse.success('Logout successful'));
    } catch (error) {
      next(error);
    }
  }

  async verifyEmail(req, res, next) {
    try {
      const { email, otp } = req.body;
      await authService.verifyEmail(email, otp);

      res.status(200).json(ApiResponse.success('Email verified successfully'));
    } catch (error) {
      next(error);
    }
  }

  async resendVerificationOtp(req, res, next) {
    try {
      const { email } = req.body;
      await authService.resendVerificationOtp(email);

      res.status(200).json(ApiResponse.success('OTP sent to your email'));
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      await authService.forgotPassword(email);

      res.status(200).json(
        ApiResponse.success('If account exists, password reset OTP has been sent')
      );
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { email, otp, newPassword } = req.body;
      await authService.resetPassword(email, otp, newPassword);

      res.clearCookie('refreshToken');
      res.status(200).json(ApiResponse.success('Password reset successful'));
    } catch (error) {
      next(error);
    }
  }

  async getCurrentUser(req, res, next) {
    try {
      res.status(200).json(
        ApiResponse.success('User fetched successfully', { user: req.user })
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();