FROM node:22-alpine

WORKDIR /app

# Copy ALL files first
COPY . .

# Install dependencies without running scripts (avoids prepare script issues)
RUN npm install --legacy-peer-deps --ignore-scripts

# Expose the server port
EXPOSE 8080

# Start the server directly
CMD [ "node", "server.js" ]
