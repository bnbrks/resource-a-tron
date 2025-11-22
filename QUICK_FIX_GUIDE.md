# Quick Fix Guide - Connect Frontend to Backend

## Your URLs
- **Backend**: `https://resource-a-tron-backend-production.up.railway.app`
- **Frontend**: (check your Railway dashboard)

## Step 1: Verify Backend is Accessible

Run this command to test:

```bash
node verify-config.js https://resource-a-tron-backend-production.up.railway.app
```

Or use the bash script:
```bash
./verify-config.sh https://resource-a-tron-backend-production.up.railway.app
```

## Step 2: Set Frontend Environment Variable

### In Railway Dashboard:

1. Go to your **frontend** service (not backend)
2. Click **Variables** tab
3. Click **+ New Variable**
4. Add:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://resource-a-tron-backend-production.up.railway.app/api`
5. Save

### Using Railway CLI:

```bash
cd frontend
railway link  # Make sure you're on the frontend service
railway variables set VITE_API_URL=https://resource-a-tron-backend-production.up.railway.app/api
railway redeploy
```

## Step 3: Set Backend CORS

### In Railway Dashboard:

1. Go to your **backend** service
2. Click **Variables** tab
3. Check if `CORS_ORIGIN` exists
4. If not, click **+ New Variable**
5. Add:
   - **Name**: `CORS_ORIGIN`
   - **Value**: Your frontend Railway URL (e.g., `https://resource-a-tron-frontend-production.up.railway.app`)
   - **Note**: Find this URL in your frontend service settings → Networking

### Using Railway CLI:

```bash
cd backend
railway link  # Make sure you're on the backend service
railway variables set CORS_ORIGIN=https://resource-a-tron-frontend-production.up.railway.app
railway redeploy
```

## Step 4: Redeploy Both Services

After setting variables:
1. **Frontend**: Go to Deployments → Redeploy
2. **Backend**: Go to Deployments → Redeploy

Or using CLI:
```bash
# Frontend
cd frontend
railway redeploy

# Backend  
cd backend
railway redeploy
```

## Step 5: Verify Everything Works

Run the verification script with both URLs:

```bash
node verify-config.js \
  https://resource-a-tron-backend-production.up.railway.app \
  https://resource-a-tron-frontend-production.up.railway.app
```

## Step 6: Seed Database (if not done)

Once frontend is connected to backend, seed the database:

```bash
cd backend
railway run npm run seed
railway run npm run seed:sample
```

## Troubleshooting

### Frontend still shows zeros?
1. Open browser DevTools (F12)
2. Go to **Console** tab - look for errors
3. Go to **Network** tab - check if API calls are going to the correct backend URL
4. If you see CORS errors, check `CORS_ORIGIN` in backend
5. If you see 404 errors, check `VITE_API_URL` includes `/api` at the end

### Backend not accessible?
1. Check Railway backend service is running
2. Check backend has a public URL (Settings → Networking)
3. Test backend directly: `curl https://resource-a-tron-backend-production.up.railway.app/api/health`

### Environment variables not working?
- **Vite variables** (starting with `VITE_`) are baked into the build at build time
- You MUST redeploy the frontend after changing `VITE_API_URL`
- Check that the variable name is exactly `VITE_API_URL` (case-sensitive)

