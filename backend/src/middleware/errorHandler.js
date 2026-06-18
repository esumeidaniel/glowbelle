export function notFound(req, res, next) {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);

  if (err.name === 'CastError') {
    err.message = 'Resource not found';
  }

  if (err.code === 11000) {
    err.message = `Duplicate value for ${Object.keys(err.keyValue || {}).join(', ')}`;
  }

  if (err.name === 'ValidationError') {
    err.message = Object.values(err.errors).map(error => error.message).join(', ');
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Server error',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
}
