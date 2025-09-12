// Centralized error handler for Express
// Place this after all routes: app.use(errorHandler);

const errorHandler = (err, req, res, next) => {
  // Defaults
  let status = 500;
  let message = 'Something went wrong on our end. Please try again later.';
  let errors = null;
  let userFriendlyMessage = null;

  // Server-side logging (consider structured logging in production)
  console.error(err); // do not expose sensitive details to clients [dev logging]

  // 1) Known framework/middleware errors
  if (err.type === 'entity.too.large') {
    status = 413;
    message = 'The file or data you\'re trying to upload is too large';
    userFriendlyMessage = 'File too large. Please try with a smaller file.';
  }

  // 2) Joi validation errors
  else if (err.isJoi) {
    status = 400;
    message = 'Please check your input and try again';
    userFriendlyMessage = 'Some of the information you entered is not valid. Please check and try again.';
    errors = err.details?.map(d => ({
      field: Array.isArray(d.path) ? d.path.join('.') : String(d.path || ''),
      message: d.message
    })) || [{ field: '', message: err.message }];
  }

  // 3) Mongoose-like ValidationError (kept for general compatibility)
  else if (err.name === 'ValidationError' && err.errors) {
    status = 400;
    message = 'Please check your input and try again';
    userFriendlyMessage = 'Some of the information you entered is not valid. Please check and try again.';
    errors = Object.values(err.errors).map(e => ({
      field: e.path || e.kind || 'field',
      message: e.message || String(e)
    }));
  }

  // 4) Database errors (MySQL)
  else if (err.code === 'ER_DUP_ENTRY') {
    status = 409; // Conflict
    message = 'This information already exists in the system';
    userFriendlyMessage = 'This username or email is already taken. Please try a different one.';
  } else if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    status = 400;
    message = 'The selected option is not valid';
    userFriendlyMessage = 'One of your selections is no longer available. Please refresh and try again.';
  }

  // 5) Auth/JWT errors
  else if (err.name === 'JsonWebTokenError') {
    status = 401;
    message = 'Your session is invalid';
    userFriendlyMessage = 'Your session has expired or is invalid. Please log in again.';
  } else if (err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Your session has expired';
    userFriendlyMessage = 'Your session has expired. Please log in again.';
  }

  // 6) Respect HttpError-like status if provided (after known mappings)
  if (err.statusCode && Number.isInteger(err.statusCode)) {
    status = err.statusCode;
  } else if (err.status && Number.isInteger(err.status)) {
    status = err.status;
  }

  // 7) Handle common HTTP status codes with user-friendly messages
  if (status === 403) {
    message = 'You don\'t have permission to perform this action';
    userFriendlyMessage = 'Access denied. You don\'t have permission to perform this action.';
  } else if (status === 404) {
    message = 'The requested resource was not found';
    userFriendlyMessage = 'The item you\'re looking for doesn\'t exist or may have been removed.';
  } else if (status === 401 && !userFriendlyMessage) {
    message = 'Authentication required';
    userFriendlyMessage = 'Please log in to access this feature.';
  } else if (status === 400 && !userFriendlyMessage) {
    message = 'Bad request';
    userFriendlyMessage = 'There was an issue with your request. Please check your input and try again.';
  } else if (status === 409 && !userFriendlyMessage) {
    message = 'Conflict';
    userFriendlyMessage = 'This action conflicts with existing data. Please try again.';
  } else if (status === 422) {
    message = 'Invalid input provided';
    userFriendlyMessage = 'Some of the information you provided is not valid. Please check and try again.';
  } else if (status === 429) {
    message = 'Too many requests';
    userFriendlyMessage = 'You\'re making too many requests. Please wait a moment and try again.';
  } else if (status >= 500) {
    message = 'Something went wrong on our end. Please try again later.';
    userFriendlyMessage = 'We\'re experiencing technical difficulties. Please try again in a few minutes.';
  }

  // Prefer provided message when safe (don't override user-friendly messages unless desired)
  if (!errors && err.message && status !== 500 && !userFriendlyMessage && message.includes('Internal server error')) {
    message = err.message;
  }

  // Build consistent payload
  const payload = {
    success: false,
    message: userFriendlyMessage || message,
    ...(errors && { errors }),
    timestamp: new Date().toISOString(),
    ...(req.id && { requestId: req.id })
  };

  // Include stack only in development
  if (process.env.NODE_ENV === 'development' && err.stack) {
    payload.stack = err.stack;
  }

  res.status(status).json(payload);
};

module.exports = errorHandler;
