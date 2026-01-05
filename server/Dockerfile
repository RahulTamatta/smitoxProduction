FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install build tools for node-gyp (required for @sentry/profiling-node)
RUN apk add --no-cache python3 make g++ build-base

# Install dependencies
RUN npm install

# Copy server code (excluding items in .dockerignore)
COPY . .

# Expose the server port
EXPOSE 8080

# Start the server
CMD [ "npm", "start" ]
