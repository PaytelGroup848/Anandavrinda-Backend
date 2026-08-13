const { verifyAccessToken } = require('../utils/jwt.util');
const ApiError = require('../utils/ApiError');
const User = require('../models/User.model');

const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Get token from cookie
    else if (req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw new ApiError(401, 'Not authorized, no token');
    }

    // Verify token
    const decoded = verifyAccessToken(token);
    
    // Get user from database
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      throw new ApiError(401, 'User not found');
    }

    // Check if user is active
    if (user.status === 'suspended') {
      throw new ApiError(403, 'Account suspended');
    }

    if (user.status === 'inactive') {
      throw new ApiError(403, 'Account inactive');
    }

    // Check if email is verified (except for certain routes)
    if (!user.isEmailVerified && req.path !== '/verify-email' && req.path !== '/resend-otp') {
      throw new ApiError(403, 'Please verify your email first');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, `Access denied. ${req.user.role} cannot access this resource`));
    }
    next();
  };
};

module.exports = { protect, restrictTo };