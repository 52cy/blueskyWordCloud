# Stage 1: Build the Vite App
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package info
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the app (outputs to /dist)
RUN npm run build

# Stage 2: Serve with Express
FROM node:20-alpine

WORKDIR /app

# Copy package info again for production deps
COPY package*.json ./

# Install ONLY production dependencies (ignoring devDeps like Vite)
# We need express and http-proxy-middleware, which are now in dependencies
RUN npm install --production

# Copy built assets from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./server.js
# Should we copy public? Vite puts public into dist during build, so dist is enough usually.
# But if server.js references explicit paths... server.js serves 'dist'. Vite build moves 'public/*' to 'dist/*'.
# So we just need dist.

# Expose port (Digital Ocean App Platform default is 8080)
EXPOSE 8080

# Start server
CMD ["node", "server.js"]
