# Railway Service Configuration for Monorepo

## Current Issue
Both services are using the root Dockerfile which builds everything together, causing TypeScript conflicts.

## Solution: Configure Each Service Separately

### Option 1: Use NIXPACKS (Recommended for Separate Services)

#### Backend Service Configuration:
1. Go to Railway Dashboard → Backend Service
2. **Settings → Root Directory**: Set to `backend`
3. **Settings → Build**: 
   - Builder: `NIXPACKS` (should auto-detect from `backend/railway.json`)
   - OR manually set to use NIXPACKS
4. **Settings → Deploy**:
   - Start Command: `npm start`

#### Frontend Service Configuration:
1. Go to Railway Dashboard → Frontend Service  
2. **Settings → Root Directory**: Set to `frontend`
3. **Settings → Build**:
   - Builder: `NIXPACKS` (should auto-detect from `frontend/railway.json`)
   - OR manually set to use NIXPACKS
4. **Settings → Deploy**:
   - Start Command: `npx serve -s dist -l $PORT`

### Option 2: Use Dockerfile with Separate Build Contexts

If you want to keep using Dockerfile, you need to:
1. Create separate Dockerfiles in each subfolder, OR
2. Configure Railway to use build arguments to target specific stages
3. Backend service: Use Dockerfile with build arg `--target backend-builder`
4. Frontend service: Use Dockerfile with build arg `--target frontend-builder`

## Why This Fixes The Problem

- **Root Dockerfile** builds both frontend + backend together (for single service deployment)
- **Separate services** should use their respective subfolders with NIXPACKS or separate Dockerfiles
- This prevents TypeScript from seeing cross-service files

## Recommended Setup

Use **Option 1 (NIXPACKS)** because:
- ✅ Simpler configuration
- ✅ Faster builds (only builds what's needed)
- ✅ Already configured in `backend/railway.json` and `frontend/railway.json`
- ✅ No Docker complexity
