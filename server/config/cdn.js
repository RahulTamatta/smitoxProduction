/**
 * CDN Configuration
 * Configure paths and settings for CDN integration
 */

const env = process.env.NODE_ENV || 'development';

const config = {
  development: {
    enabled: false,
    baseUrl: '',
    paths: {
      images: '/assets/images',
      css: '/assets/css',
      js: '/assets/js'
    },
    cacheControl: 'public, max-age=86400' // 24 hours
  },
  production: {
    enabled: true,
    baseUrl: process.env.CDN_BASE_URL || 'https://cdn.yourwebsite.com',
    paths: {
      images: '/assets/images',
      css: '/assets/css',
      js: '/assets/js'
    },
    cacheControl: 'public, max-age=2592000' // 30 days
  }
};

module.exports = config[env];
