/**
 * Check if string is a valid URL
 */
function isValidUrl(str) {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if string is a valid email
 */
function isValidEmail(str) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(str);
}

/**
 * Check if string is a valid number
 */
function isValidNumber(str) {
  return !isNaN(str) && !isNaN(parseFloat(str));
}

/**
 * Extract route definitions from code
 */
function extractRoutes(code) {
  const routes = [];
  
  // Match common route patterns
  const patterns = [
    /(?:app|router)\.(get|post|put|delete|patch)\s*\(['"`]([^'"`]+)['"`]/g,
    /(?:app|router)\.(get|post|put|delete|patch)\s*\(['"`]([^'"`]+)['"`]/g,
    /Route\.(get|post|put|delete|patch)\s*\(['"`]([^'"`]+)['"`]/g,
  ];
  
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(code)) !== null) {
      routes.push({
        method: match[1].toUpperCase(),
        path: match[2],
        line: code.substring(0, match.index).split('\n').length
      });
    }
  });
  
  return routes;
}

/**
 * Check if route has auth middleware
 */
function hasAuthMiddleware(code, routeIndex) {
  const lines = code.split('\n');
  const routeLine = lines[routeIndex - 1] || '';
  
  // Check for common auth middleware patterns
  const authPatterns = [
    /authenticate|auth|jwt|verifyToken|requireAuth|isAuthenticated/i,
    /passport\.authenticate/,
    /middleware.*auth/i
  ];
  
  // Check the route line and a few lines before/after
  const context = lines.slice(Math.max(0, routeIndex - 3), routeIndex + 3).join('\n');
  
  return authPatterns.some(pattern => pattern.test(context));
}

/**
 * Extract middleware usage
 */
function extractMiddleware(code) {
  const middleware = [];
  const patterns = [
    /\.use\s*\(['"`]([^'"`]+)['"`]/g,
    /\.use\s*\(([a-zA-Z_$][a-zA-Z0-9_$]*)/g
  ];
  
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(code)) !== null) {
      middleware.push(match[1]);
    }
  });
  
  return middleware;
}

/**
 * Check if code has error handling
 */
function hasErrorHandling(code) {
  const errorPatterns = [
    /catch\s*\(/,
    /\.catch\s*\(/,
    /errorHandler|error-handler|errorMiddleware/i,
    /express\.errorHandler/,
    /app\.use.*error/i
  ];
  
  return errorPatterns.some(pattern => pattern.test(code));
}

/**
 * Check JWT expiry configuration
 */
function extractJWTExpiry(code) {
  const patterns = [
    /expiresIn\s*[:=]\s*['"`]?(\d+)\s*([a-z]+)['"`]?/i,
    /expiresIn\s*[:=]\s*(\d+)/i,
    /JWT_EXPIRY\s*[:=]\s*['"`]?(\d+)\s*([a-z]+)['"`]?/i
  ];
  
  for (const pattern of patterns) {
    const match = code.match(pattern);
    if (match) {
      const value = parseInt(match[1]);
      const unit = (match[2] || 's').toLowerCase();
      
      // Convert to seconds
      let seconds = value;
      if (unit.includes('year') || unit === 'y') seconds = value * 365 * 24 * 60 * 60;
      else if (unit.includes('month') || unit === 'm') seconds = value * 30 * 24 * 60 * 60;
      else if (unit.includes('day') || unit === 'd') seconds = value * 24 * 60 * 60;
      else if (unit.includes('hour') || unit === 'h') seconds = value * 60 * 60;
      else if (unit.includes('minute') || unit === 'min') seconds = value * 60;
      
      return seconds;
    }
  }
  
  return null;
}

module.exports = {
  isValidUrl,
  isValidEmail,
  isValidNumber,
  extractRoutes,
  hasAuthMiddleware,
  extractMiddleware,
  hasErrorHandling,
  extractJWTExpiry
};

