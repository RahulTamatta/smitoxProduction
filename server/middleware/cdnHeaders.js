/**
 * CDN Headers Middleware
 * Sets proper cache headers for static assets
 */

const cdnConfig = require('../config/cdn');

/**
 * Middleware to set cache headers for static assets
 */
const cdnHeadersMiddleware = (req, res, next) => {
  // Check if the request path is for static assets
  const isStaticAsset = (
    req.path.startsWith('/assets/') || 
    req.path.endsWith('.js') || 
    req.path.endsWith('.css') || 
    req.path.endsWith('.jpg') || 
    req.path.endsWith('.jpeg') || 
    req.path.endsWith('.png') || 
    req.path.endsWith('.gif') || 
    req.path.endsWith('.svg') || 
    req.path.endsWith('.webp')
  );

  if (isStaticAsset) {
    // Set Cache-Control header
    res.setHeader('Cache-Control', cdnConfig.cacheControl);
    
    // Add additional CDN-related headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Set cors headers for CDN assets
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // Set Cache revalidation
    res.setHeader('Vary', 'Accept-Encoding');
  }
  
  next();
};

/**
 * Middleware to rewrite URLs to point to CDN
 */
const cdnUrlRewriter = (req, res, next) => {
  if (!cdnConfig.enabled) {
    return next();
  }
  
  // Store the original res.locals.assetUrl or create it
  res.locals.assetUrl = (path) => {
    // Check if path should be served from CDN
    const shouldUseCdn = (
      path.startsWith('/assets/') || 
      path.endsWith('.js') || 
      path.endsWith('.css') || 
      path.endsWith('.jpg') || 
      path.endsWith('.jpeg') || 
      path.endsWith('.png') || 
      path.endsWith('.gif') || 
      path.endsWith('.svg') || 
      path.endsWith('.webp')
    );
    
    if (shouldUseCdn) {
      return `${cdnConfig.baseUrl}${path}`;
    }
    
    return path;
  };
  
  next();
};

module.exports = {
  cdnHeadersMiddleware,
  cdnUrlRewriter
};
