/**
 * rateLimitMiddleware - Prevents brute-force attacks by limiting login attempts
 * Limit: 5 attempts per minute per IP address
 * Frontend: Display error message when rate limited
 */

const requestAttempts = new Map(); // In-memory store (use Redis in production)

const rateLimitMiddleware = (maxAttempts = 5, windowMs = 60 * 1000) => {
  // windowMs is time window in milliseconds (default: 1 minute)

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const key = `${ip}:login`;

    if (!requestAttempts.has(key)) {
      // First attempt for this IP
      requestAttempts.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    const attempt = requestAttempts.get(key);

    // Check if time window has expired
    if (now > attempt.resetTime) {
      // Reset attempts
      requestAttempts.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    // Increment attempt count
    attempt.count++;

    if (attempt.count > maxAttempts) {
      const timeRemaining = Math.ceil((attempt.resetTime - now) / 1000);
      return res.status(429).json({
        message: `Too many login attempts. Please try again in ${timeRemaining} seconds.`,
        retryAfter: timeRemaining,
      });
    }

    // Add remaining attempts info to response headers (optional)
    res.set('X-RateLimit-Remaining', maxAttempts - attempt.count);

    next();
  };
};

/**
 * cleanupRateLimitMiddleware - Cleans up old entries from memory
 * Run periodically to prevent memory leaks
 */
const cleanupRateLimitMiddleware = () => {
  setInterval(() => {
    const now = Date.now();
    for (const [key, attempt] of requestAttempts.entries()) {
      if (now > attempt.resetTime) {
        requestAttempts.delete(key);
      }
    }
  }, 5 * 60 * 1000); // Run cleanup every 5 minutes
};

module.exports = {
  rateLimitMiddleware,
  cleanupRateLimitMiddleware,
};
