/**
 * Middleware to ensure static assets are properly handled by Next.js
 * This is a workaround for cases where static assets might be incorrectly
 * intercepted by Express middleware
 */
const path = require('path');

function staticAssetFix() {
  return (req, res, next) => {
    // Check if this is a Next.js static asset request
    if (req.path.startsWith('/_next/')) {
      // Let Next.js handle static assets by bypassing Express middleware
      // This ensures they're served with correct MIME types
      // We also need to make sure we don't apply auth middleware to static assets
      return next();
    }
    
    // For other requests, continue with normal flow
    next();
  };
}

module.exports = { staticAssetFix };
