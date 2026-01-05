FROM node:22-alpine

WORKDIR /app

# Install build tools for native modules (bcrypt, node-gyp)
RUN apk add --no-cache python3 make g++ build-base

# Copy ALL files first
COPY . .

# Install dependencies without running scripts (avoids prepare script issues)
RUN npm install --legacy-peer-deps --ignore-scripts

# Rebuild native modules (bcrypt needs this)
RUN npm rebuild bcrypt --build-from-source

# Expose the server port
EXPOSE 8080

# Start the server directly
CMD [ "node", "server.js" ]
