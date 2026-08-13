const ApiError = require('../utils/ApiError');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      const message = error.details[0].message;
      return next(new ApiError(400, message));
    }
    
    next();
  };
};

module.exports = validate;