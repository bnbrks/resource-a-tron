# Multi-stage build for production
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy all package files
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Install all dependencies with memory optimization
# Use --legacy-peer-deps to avoid memory issues with peer dependencies
RUN npm install --legacy-peer-deps --prefer-offline --no-audit

# Build frontend
FROM base AS frontend-builder
WORKDIR /app

# Copy root node_modules (workspace hoisting)
COPY --from=deps /app/node_modules ./node_modules

# Copy frontend files
COPY frontend ./frontend
COPY package*.json ./

# Install frontend dependencies if needed (workspace might not hoist all)
WORKDIR /app/frontend
RUN npm install --legacy-peer-deps --prefer-offline --no-audit || true

# Build frontend
RUN npm run build

# Build backend
FROM base AS backend-builder
WORKDIR /app

# Copy root node_modules (workspace hoisting)
COPY --from=deps /app/node_modules ./node_modules

# Copy backend files
COPY backend ./backend
COPY package*.json ./

# Install backend dependencies if needed (workspace might not hoist all)
WORKDIR /app/backend
RUN npm install --legacy-peer-deps --prefer-offline --no-audit || true

# Generate Prisma Client (already in node_modules, no global install needed)
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built applications
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder /app/backend/package.json ./backend/
COPY --from=backend-builder /app/backend/prisma ./backend/prisma

# Prisma is already in node_modules, no need to install globally
# Use npx prisma for migrations if needed

# Expose port
EXPOSE 3000

# Start backend (frontend will be served by backend in production)
WORKDIR /app/backend
CMD ["node", "dist/index.js"]


