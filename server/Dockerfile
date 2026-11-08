# Production Dockerfile for Portfolio OS Backend Server
FROM node:20-alpine AS base

# Install curl for container health check
RUN apk add --no-cache curl

WORKDIR /app

# Install dependencies using package-lock.json
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source files
COPY index.js ./
COPY data/ ./data/
COPY src/ ./src/
COPY tsconfig.json ./

# Production environment variables
ENV NODE_ENV=production
ENV PORT=4000

# Expose backend port
EXPOSE 4000

# Container healthcheck against /api/health
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4000/api/health || exit 1

# Start server
CMD ["node", "index.js"]
