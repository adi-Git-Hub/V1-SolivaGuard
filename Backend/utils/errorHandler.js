class ErrorHandler extends Error {
  // `code` is an optional stable machine-readable identifier (e.g.
  // 'ACCOUNT_BLOCKED') the frontend can branch on without string-matching the
  // human message. Mongo driver errors use a numeric `code`; ours is a string,
  // so the two never collide.
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    if (code) this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ErrorHandler;