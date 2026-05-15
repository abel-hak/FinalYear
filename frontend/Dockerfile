# Frontend - React + Vite Application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* bun.lockb* yarn.lock* ./

# Install dependencies (auto-detect npm/yarn/bun)
RUN npm install

# Copy source code
COPY . .

# Build the application with environment variables
ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

# Production stage - use nginx to serve built files
FROM nginx:alpine

# Install curl so the image can probe the backend during startup
RUN apk add --no-cache curl

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Add a startup script that waits for the backend to be healthy once,
# then starts nginx. This avoids running continuous health checks against the server.
ENV SERVER_HEALTH_URL=http://server:8000/health
COPY wait-for-server.sh /wait-for-server.sh
RUN chmod +x /wait-for-server.sh

# Expose port
EXPOSE 5173

# Health check for the client itself (optional, occasional)
HEALTHCHECK --interval=1m --timeout=5s --retries=3 \
    CMD wget -q -O- http://localhost:5173/ || exit 1

# Start with the wait script which launches nginx after the backend is ready
CMD ["/wait-for-server.sh"]
