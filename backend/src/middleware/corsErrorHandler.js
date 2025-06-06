/**
 * Middleware to handle CORS errors with clear error messages
 */
module.exports = (err, req, res, next) => {
  // Log any error that comes through for debugging
  console.error('CORS Error Handler:', err.message);
  
  // Check if the error is a CORS error
  if (err.message === 'Not allowed by CORS') {
    const origin = req.headers.origin || 'Unknown Origin';
    const method = req.method || 'Unknown Method';
    
    console.error(`CORS violation from ${origin} using ${method} method`);
    
    return res.status(403).json({
      status: 'error',
      message: 'Cross-Origin Request Blocked: This domain or method is not authorized to access this API',
      error: 'CORS_POLICY_VIOLATION',
      details: {
        origin: origin,
        method: method,
        url: req.originalUrl
      }
    });
  }
  
  // Pass to the next error handler
  next(err);
};
