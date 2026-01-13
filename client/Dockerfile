# Production stage - uses pre-built files (build locally, deploy fast)
FROM node:22-alpine

WORKDIR /app

# Install 'serve' package to serve static files
RUN npm install -g serve
ENV PATH="/usr/local/bin:$PATH"

# Copy pre-built React app (built locally on your Mac)
COPY build ./build

# Expose client port
EXPOSE 3000

# Serve the build folder
CMD ["serve", "-s", "build", "-l", "3000"]
