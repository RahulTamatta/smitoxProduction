/**
 * Load Balancing Configuration
 * Settings for application clustering and load balancing
 */

const os = require('os');

const loadBalancingConfig = {
  development: {
    enabled: false,
    numberOfWorkers: 1,
    sticky: false
  },
  production: {
    enabled: true,
    // Use available CPUs minus 1 (leaving one for the OS)
    numberOfWorkers: Math.max(os.cpus().length - 1, 1),
    sticky: true, // Enable sticky sessions
    healthCheck: {
      path: '/health',
      interval: 5000 // Check every 5 seconds
    }
  },
  test: {
    enabled: false,
    numberOfWorkers: 1,
    sticky: false
  }
};

const env = process.env.NODE_ENV || 'development';
module.exports = loadBalancingConfig[env] || loadBalancingConfig.development;
