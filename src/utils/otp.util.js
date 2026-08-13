const crypto = require('crypto');

const generateOTP = (length = 6) => {
  // Generate random numeric OTP
  const otp = crypto
    .randomInt(Math.pow(10, length - 1), Math.pow(10, length))
    .toString();
  return otp;
};

const generateExpiryTime = (minutes = 10) => {
  return new Date(Date.now() + minutes * 60 * 1000);
};

module.exports = {
  generateOTP,
  generateExpiryTime,
};