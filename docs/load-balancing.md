# Load Balancing Guide

This document explains the load balancing setup for the application in both development and production environments.

## Overview

Load balancing distributes incoming application traffic across multiple instances, improving performance and providing failover capability. Our implementation consists of:

1. Node.js clustering for process-level load balancing
2. NGINX as a reverse proxy for HTTP-level load balancing
3. Environment-specific configurations

## Node.js Clustering

In production, the application automatically creates worker processes equal to the number of CPU cores minus one (leaving one core for the OS). This utilizes all available server resources efficiently.

### Usage

```javascript
// In your main application file (e.g., server.js or app.js)
const initializeCluster = require('./server/cluster');

function startApp() {
  // Your normal application startup code
  const app = express();
  // ...other configuration...
  app.listen(port, () => {
    console.log(`Server started on port ${port}`);
  });
}

// Initialize cluster with the startApp function
initializeCluster(startApp);
```

### Configuration

The cluster behavior is controlled by the `config/loadBalancing.js` file. Key settings include:

- `enabled`: Whether clustering is active
- `numberOfWorkers`: How many worker processes to create
- `sticky`: Whether to use sticky sessions (route the same client to the same worker)

## NGINX Load Balancer

For production deployments, NGINX acts as a reverse proxy and load balancer. The configuration is in `deployment/nginx/load-balancer.conf`.

### Key Features

- **Health checks**: Regularly tests if backend servers are responsive
- **SSL termination**: Handles HTTPS, reducing overhead on application servers
- **Static asset caching**: Improves performance for common assets
- **Failover support**: Automatically routes to backup servers if primaries fail
- **Sticky sessions**: Ensures a user continues to connect to the same backend server

### Deployment

1. Install NGINX on your load balancer server:
   ```bash
   sudo apt update
   sudo apt install nginx
   ```

2. Copy the configuration file:
   ```bash
   sudo cp /Users/rahultamatta/Documents/GitHub/smitoxProduction/deployment/nginx/load-balancer.conf /etc/nginx/sites-available/app
   sudo ln -s /etc/nginx/sites-available/app /etc/nginx/sites-enabled/
   ```

3. Update server names and IP addresses in the configuration file
4. Test and reload NGINX:
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

## Cloud-based Load Balancing

For deployments on cloud platforms, you can use native load balancing services:

### AWS Elastic Load Balancing

1. Create an Application Load Balancer in AWS console
2. Configure target groups pointing to your EC2 instances
3. Set up health checks, sticky sessions, and SSL certificates

### Azure Load Balancer

1. Create a Load Balancer in Azure Portal
2. Add backend pools with your virtual machines
3. Configure health probes and load balancing rules

### Google Cloud Load Balancing

1. Create a HTTP(S) Load Balancer in Google Cloud Console
2. Configure backend services and instance groups
3. Set up health checks and SSL certificates

## Health Checks

The application includes a `/health` endpoint that load balancers can use to verify instance health. It returns:

- Status code 200 if the server is operating normally
- Memory usage and system health metrics
- Database connection status (if applicable)

## Troubleshooting

1. **Uneven Load Distribution**:
   - Check if sticky sessions are enabled when not needed
   - Verify load balancer algorithm settings
   - Monitor individual instance loads

2. **Session Issues**:
   - Implement a shared session store (Redis, Memcached)
   - Enable sticky sessions if user state must be maintained

3. **504 Gateway Timeout Errors**:
   - Increase proxy timeout settings in NGINX
   - Check application response times
   - Consider implementing request timeout handling
