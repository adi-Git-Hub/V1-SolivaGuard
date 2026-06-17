const { ZodError } = require('zod');
const sendResponse = require('../utils/sendResponse');

/**
 * Validation Middleware
 * @param {import('zod').AnyZodObject} schema 
 */
const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedErrors = (error.errors || error.issues || []).map((err) => ({
        field: err.path.slice(1).join('.'), // Remove 'body', 'query', or 'params' from path
        message: err.message,
      }));

      return sendResponse(res, {
        statusCode: 400,
        success: false,
        message: 'Validation Failed',
        errors: formattedErrors,
      });
    }
    next(error);
  }
};

module.exports = validate;