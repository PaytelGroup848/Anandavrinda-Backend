class ApiResponse {
  constructor(success, message, data = null, statusCode = 200) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.statusCode = statusCode;
  }

  static success(message, data = null, statusCode = 200) {
    return new ApiResponse(true, message, data, statusCode);
  }

  static error(message, data = null, statusCode = 400) {
    return new ApiResponse(false, message, data, statusCode);
  }
}

module.exports = ApiResponse;