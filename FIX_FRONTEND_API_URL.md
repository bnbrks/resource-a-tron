# Fix Frontend API URL Configuration

## Problem
Your frontend is trying to connect to `http://localhost:3000/api` (the default), but your backend is at:
`https://resource-a-tron-backend-production.up.railway.app`

## Solution: Set Environment Variable in Railway

### Step 1: Go to Railway Dashboard
1. Open https://railway.app
2. Go to your **frontend** service (not the backend)

### Step 2: Add Environment Variable
1. Click on your **frontend** service
2. Go to the **Variables** tab
3. Click **+ New Variable**
4. Add:
   - **Variable Name**: `VITE_API_URL`
   - **Value**: `https://resource-a-tron-backend-production.up.railway.app/api`
   - **Note**: Include `/api` at the end since your backend serves the API at `/api`

### Step 3: Redeploy Frontend
After adding the variable:
1. Go to **Deployments** tab
2. Click **Redeploy** (or Railway will auto-redeploy after a short delay)

### Step 4: Verify
After redeployment, refresh your browser and check:
1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Look for any CORS or network errors
4. Check **Network** tab to see if API calls are going to the correct backend URL

## Alternative: Using Railway CLI

If you prefer using the CLI:

```bash
cd frontend
railway link  # Make sure you're linked to the frontend service
railway variables set VITE_API_URL=https://resource-a-tron-backend-production.up.railway.app/api
```

Then trigger a redeploy:
```bash
railway redeploy
```

## Important Notes

1. **Vite Environment Variables**: Variables starting with `VITE_` are exposed to the client-side code at build time. After changing `VITE_API_URL`, you MUST rebuild/redeploy the frontend.

2. **Backend CORS**: Make sure your backend's `FRONTEND_URL` environment variable includes your frontend URL so CORS works correctly.

3. **URL Format**: 
   - ✅ Correct: `https://resource-a-tron-backend-production.up.railway.app/api`
   - ❌ Wrong: `https://resource-a-tron-backend-production.up.railway.app` (missing `/api`)
   - ❌ Wrong: `http://resource-a-tron-backend-production.up.railway.app/api` (use `https`, not `http`)

## Check Backend CORS Configuration

Also verify your backend has the frontend URL configured:

1. Go to your **backend** service in Railway
2. Check **Variables** tab
3. Ensure `FRONTEND_URL` is set to your frontend Railway URL (e.g., `https://resource-a-tron-frontend-production.up.railway.app`)

If it's not set, add it and redeploy the backend.

