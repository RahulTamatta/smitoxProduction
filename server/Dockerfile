FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy server code (excluding items in .dockerignore)
COPY . .

# Expose the server port
EXPOSE 8080

# Start the server
CMD [ "npm", "start" ]
