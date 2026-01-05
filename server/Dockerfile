FROM node:22-alpine

WORKDIR /app

# Install build tools for native modules (bcrypt, node-gyp)
RUN apk add --no-cache python3 make g++ build-base

# Copy ALL files first (so scripts are available)
COPY . .

# Install dependencies (this will compile native modules like bcrypt)
RUN npm install --legacy-peer-deps

# Expose the server port
EXPOSE 8080

# Start the server directly
CMD [ "node", "server.js" ]
