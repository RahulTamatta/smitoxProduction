# build stage
FROM node:22-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
# Using --legacy-peer-deps might be necessary for some CRA projects
RUN npm install --legacy-peer-deps

# Copy client code
COPY . .

# Build the application
# CRA projects build to 'build/' directory
RUN npm run build

# Production stage
FROM node:22-alpine

WORKDIR /app

# Install 'serve' package
RUN npm install -g serve
ENV PATH="/usr/local/bin:$PATH"

# Copy build artifacts from build stage
COPY --from=build /app/build ./build

# Expose client port
EXPOSE 3000

# Serve the build folder
CMD ["serve", "-s", "build", "-l", "3000"]
