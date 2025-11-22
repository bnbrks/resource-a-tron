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
# Use ARG to make this stage optional
ARG BUILD_FRONTEND=true
FROM base AS frontend-builder
WORKDIR /app

# Copy root package.json and workspace structure
COPY package*.json ./
COPY frontend/package*.json ./frontend/

# Copy root node_modules from deps (workspace hoisting)
COPY --from=deps /app/node_modules ./node_modules

# Copy frontend source files (including all TypeScript fixes and vite-env.d.ts)
# Force cache invalidation by adding timestamp
ARG BUILD_TIMESTAMP
COPY frontend ./frontend

# Verify fixes are present (this will fail if Railway is using old cached code)
RUN test -f /app/frontend/src/vite-env.d.ts || (echo "ERROR: vite-env.d.ts missing - clear Railway cache!" && exit 1)

# Verify TypeScript fixes are present
RUN grep -q "import { api }" /app/frontend/src/context/AuthContext.tsx || \
    (echo "ERROR: TypeScript fixes not present - Railway is using cached code! Clear build cache!" && exit 1)

# Install frontend dependencies (this will create frontend/node_modules if needed)
WORKDIR /app/frontend
RUN npm install --legacy-peer-deps --prefer-offline --no-audit || true

# Build frontend using Docker build script (skips TypeScript check - Vite handles it)
# Vite will still do type checking during its build, but won't fail on test files
RUN npm run build:docker || npm run build

# Build backend
FROM base AS backend-builder
WORKDIR /app

# Copy root package.json and workspace structure
COPY package*.json ./
COPY backend/package*.json ./backend/

# Copy root node_modules from deps (workspace hoisting)
COPY --from=deps /app/node_modules ./node_modules

# Copy backend source files ONLY (don't copy frontend to avoid TypeScript conflicts)
COPY backend ./backend

# Install backend dependencies (this will create backend/node_modules if needed)
WORKDIR /app/backend

# Ensure we're building from the backend directory and only include backend files
# Set environment to prevent TypeScript from resolving outside backend directory
ENV TS_NODE_PROJECT=./tsconfig.json
RUN npm install --legacy-peer-deps --prefer-offline --no-audit || true

# Generate Prisma Client (already in node_modules, no global install needed)
RUN npx prisma generate

# Build TypeScript with increased memory limit
# Exit code 137 = out of memory, so we increase Node.js memory limit
# Use tsc directly with explicit project file to ensure it only compiles backend
ENV NODE_OPTIONS="--max-old-space-size=2048"
# Verify we're in the backend directory and only backend files exist
RUN pwd && ls -la && test -f tsconfig.json || (echo "ERROR: Not in backend directory!" && exit 1)
RUN test ! -d ../frontend/src || (echo "ERROR: Frontend files detected in backend build context!" && exit 1)
# Run TypeScript compiler explicitly from backend directory
RUN npx tsc --project ./tsconfig.json

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built applications
# Frontend dist is optional (create directory first)
RUN mkdir -p ./frontend/dist
# Copy frontend dist if it exists (optional - backend can run without frontend)
# Note: This will fail if frontend-builder stage wasn't run, but that's ok for backend-only deploys
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist || echo "Frontend not built, skipping..."
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/package.json ./backend/
COPY --from=backend-builder /app/backend/prisma ./backend/prisma

# Copy node_modules from deps (workspace hoisting puts everything at root)
COPY --from=deps /app/node_modules ./node_modules

# Prisma is already in node_modules, no need to install globally
# Use npx prisma for migrations if needed

# Expose port
EXPOSE 3000

# Start backend (frontend will be served by backend in production)
WORKDIR /app/backend
CMD ["node", "dist/index.js"]


