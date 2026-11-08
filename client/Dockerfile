# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files and install
COPY package*.json ./
RUN npm ci

# Copy client source files and build
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Production web server stage
FROM nginx:alpine

# Copy built static files to Nginx docroot
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
