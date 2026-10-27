/**
 * Sanitize and validate query pagination, search, and sorting
 * @param {Object} query - Request query parameters
 * @param {Array<string>} allowedSortFields - Whitelisted fields allowed for sorting
 * @param {string} defaultSortField - Default field to sort by
 */
const parseQueryParams = (query = {}, allowedSortFields = ['created_at'], defaultSortField = 'created_at') => {
  // 1. Pagination
  let page = parseInt(query.page, 10);
  if (isNaN(page) || page < 1) {
    page = 1;
  }

  let limit = parseInt(query.limit, 10);
  if (isNaN(limit) || limit < 1) {
    limit = 10;
  } else if (limit > 100) {
    limit = 100; // Hard cap limit to prevent denial of service
  }

  const offset = (page - 1) * limit;

  // 2. Sorting Allowlist Validation
  let sortBy = query.sortBy || defaultSortField;
  if (!allowedSortFields.includes(sortBy)) {
    sortBy = defaultSortField;
  }

  let sortOrder = (query.sortOrder || 'DESC').toUpperCase();
  if (sortOrder !== 'ASC' && sortOrder !== 'DESC') {
    sortOrder = 'DESC';
  }

  // 3. Search Term
  const search = typeof query.search === 'string' ? query.search.trim() : '';

  return {
    page,
    limit,
    offset,
    sortBy,
    sortOrder,
    search
  };
};

/**
 * Format standardized pagination metadata
 */
const formatPaginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };
};

/**
 * Safely escapes characters that have special meaning in SQL LIKE clauses (\, %, _)
 * to prevent wildcard manipulation or unindexed full table scans.
 * @param {string} str - Raw search string
 * @returns {string} Escaped search string safe for LIKE pattern construction
 */
const escapeLikeString = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/([\\%_])/g, '\\$1');
};

module.exports = {
  parseQueryParams,
  formatPaginationMeta,
  escapeLikeString
};
