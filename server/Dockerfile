FROM node:22-alpine

WORKDIR /app

# Copy ALL files first
COPY . .

# Install dependencies without running scripts and limit network connections to prevent VPS timeouts
RUN npm install --legacy-peer-deps --ignore-scripts --maxsockets=3
EXPOSE 8080

# Start the server directly
CMD [ "node", "server.js" ]
