/**
 * Pagination middleware
 * Processes pagination parameters and adds pagination metadata to the response
 * 
 * @param {Object} options - Pagination options
 * @param {number} options.defaultLimit - Default items per page
 * @param {number} options.maxLimit - Maximum items per page
 * @returns {Function} Express middleware
 */
const paginate = (options = {}) => {
  const defaultLimit = options.defaultLimit || 10;
  const maxLimit = options.maxLimit || 100;
  
  return (req, res, next) => {
    // Extract pagination parameters from query
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || defaultLimit;
    
    // Validate pagination parameters
    if (page < 1) {
      req.query.page = 1;
    }
    
    // Ensure limit doesn't exceed maxLimit
    if (limit < 1) {
      req.query.limit = defaultLimit;
    } else if (limit > maxLimit) {
      req.query.limit = maxLimit;
    }
    
    // Calculate skip value for pagination
    const skip = (page - 1) * limit;
    
    // Add pagination parameters to the request
    req.pagination = {
      page,
      limit,
      skip,
    };
    
    // Extend response with pagination metadata
    const originalJson = res.json;
    res.json = function(data) {
      // If data has totalCount property, use it for pagination
      if (data && data.totalCount !== undefined) {
        // Save original data
        const originalData = { ...data };
        
        // Calculate pagination metadata
        const totalCount = originalData.totalCount;
        const totalPages = Math.ceil(totalCount / limit);
        const currentPage = page;
        const hasNext = currentPage < totalPages;
        const hasPrev = currentPage > 1;
        
        // Add pagination metadata to response
        data.pagination = {
          total: totalCount,
          totalPages,
          currentPage,
          limit,
          hasNext,
          hasPrev,
        };
        
        // Set pagination headers for clients that need them
        res.set('X-Total-Count', totalCount.toString());
        res.set('X-Total-Pages', totalPages.toString());
        res.set('X-Current-Page', currentPage.toString());
        res.set('X-Per-Page', limit.toString());
        
        // Set Content-Range header (format: items start-end/total)
        const start = skip;
        const end = Math.min(skip + limit - 1, totalCount - 1);
        res.set('Content-Range', `items ${start}-${end}/${totalCount}`);
      }
      
      // Call original json method
      return originalJson.call(this, data);
    };
    
    next();
  };
};

/**
 * Generate pagination links for HATEOAS
 * @param {string} baseUrl - Base URL for pagination links
 * @param {Object} pagination - Pagination metadata
 * @param {Object} query - Query parameters
 * @returns {Object} HATEOAS links object
 */
const paginationLinks = (baseUrl, pagination, query = {}) => {
  const { currentPage, totalPages, limit } = pagination;
  const links = {};
  
  // Create copy of query without pagination params
  const queryParams = { ...query };
  delete queryParams.page;
  delete queryParams.limit;
  
  // Convert query params to string
  const queryString = Object.keys(queryParams).length > 0
    ? '&' + Object.entries(queryParams)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&')
    : '';
  
  // Add self link
  links.self = `${baseUrl}?page=${currentPage}&limit=${limit}${queryString}`;
  
  // Add first link
  links.first = `${baseUrl}?page=1&limit=${limit}${queryString}`;
  
  // Add last link
  links.last = `${baseUrl}?page=${totalPages}&limit=${limit}${queryString}`;
  
  // Add prev link if not on first page
  if (currentPage > 1) {
    links.prev = `${baseUrl}?page=${currentPage - 1}&limit=${limit}${queryString}`;
  }
  
  // Add next link if not on last page
  if (currentPage < totalPages) {
    links.next = `${baseUrl}?page=${currentPage + 1}&limit=${limit}${queryString}`;
  }
  
  return links;
};

module.exports = {
  paginate,
  paginationLinks,
};
