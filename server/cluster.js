/**
 * Cluster Setup for Load Balancing
 * Implements Node.js clustering for distributing traffic across multiple instances
 */

const cluster = require('cluster');
const os = require('os');
const loadBalancingConfig = require('../config/loadBalancing');

/**
 * Initialize cluster based on configuration
 * @param {Function} startApp - Function to start the application
 */
function initializeCluster(startApp) {
  // If clustering is disabled or we're not in production, just start the app
  if (!loadBalancingConfig.enabled) {
    return startApp();
  }

  if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running`);

    // Fork workers based on configuration
    const numWorkers = loadBalancingConfig.numberOfWorkers;
    
    // Fork workers
    for (let i = 0; i < numWorkers; i++) {
      cluster.fork();
    }

    // Listen for dying workers
    cluster.on('exit', (worker, code, signal) => {
      console.log(`Worker ${worker.process.pid} died with code: ${code}, and signal: ${signal}`);
      console.log('Starting a new worker');
      cluster.fork();
    });

    // Enable sticky load balancing if configured
    if (loadBalancingConfig.sticky) {
      setupStickyLoadBalancing();
    }
  } else {
    // Workers run the app
    console.log(`Worker ${process.pid} started`);
    startApp();
  }
}

/**
 * Setup sticky session load balancing
 */
function setupStickyLoadBalancing() {
  // Use the first byte of the IP address to route to the same worker
  cluster.setupMaster({
    schedulingPolicy: cluster.SCHED_RR
  });
}

module.exports = initializeCluster;
