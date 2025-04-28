/**
 * Response formatter middleware
 * Standardizes API responses with a consistent structure
 */
const responseFormatter = (req, res, next) => {
  // Original send method
  const originalSend = res.send;
  
  // Create success response method
  res.success = function(data = null, message = 'Success', statusCode = 200) {
    // Set status code
    res.status(statusCode);
    
    // Create response object
    const response = {
      status: 'success',
      message,
      data,
    };
    
    // Send response
    return res.json(response);
  };
  
  // Create error response method
  res.error = function(message = 'Error', errors = [], statusCode = 400) {
    // Set status code
    res.status(statusCode);
    
    // Create response object
    const response = {
      status: 'error',
      message,
    };
    
    // Add errors array if provided
    if (errors && errors.length > 0) {
      response.errors = errors;
    }
    
    // Send response
    return res.json(response);
  };
  
  // Create not found response method
  res.notFound = function(message = 'Resource not found') {
    return res.error(message, [], 404);
  };
  
  // Create unauthorized response method
  res.unauthorized = function(message = 'Unauthorized') {
    return res.error(message, [], 401);
  };
  
  // Create forbidden response method
  res.forbidden = function(message = 'Forbidden') {
    return res.error(message, [], 403);
  };
  
  // Create internal error response method
  res.serverError = function(message = 'Internal Server Error') {
    return res.error(message, [], 500);
  };
  
  // Create created response method
  res.created = function(data = null, message = 'Resource created successfully') {
    return res.success(data, message, 201);
  };
  
  // Create no content response method
  res.noContent = function() {
    return res.status(204).send();
  };
  
  // Override send method to ensure JSON response
  res.send = function(body) {
    // If headers already sent or non-object response, use original send
    if (res.headersSent || typeof body !== 'object' || body === null) {
      return originalSend.call(this, body);
    }
    
    // If body doesn't have status property, wrap it in success response
    if (!body.status) {
      return res.success(body);
    }
    
    // Otherwise, use original send
    return originalSend.call(this, body);
  };
  
  next();
};

module.exports = responseFormatter;
