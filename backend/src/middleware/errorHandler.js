exports.errorHandler = (err, req, res, next) => {
  console.error('Error:', err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Something went wrong';
  
  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};
