# Railway Frontend Service Configuration

## Important: Root Directory Setting

For the **frontend service** in Railway, you MUST set the Root Directory to `frontend`:

1. Go to your Railway project
2. Click on the **frontend** service
3. Go to **Settings** → **Root Directory**
4. Set it to: `frontend`
5. Save

This ensures Railway only builds the frontend code and doesn't try to build the backend.

## Build Configuration

With Root Directory set to `frontend`, Railway will:
- Use `frontend/package.json` for dependencies
- Run `npm install` in the frontend directory
- Run `npm run build` which executes `tsc && vite build`
- Serve the built files with `npx serve -s dist -l $PORT`

## Environment Variables

Make sure to set:
- `VITE_API_URL` - Your backend Railway URL (e.g., `https://your-backend.railway.app`)

## Troubleshooting

If you see backend TypeScript errors when building the frontend:
- **Check Root Directory**: It must be set to `frontend`, not root (`/`)
- **Verify Build Command**: Should be `npm install && npm run build` (Railway auto-detects this)
- **Check Logs**: Make sure it's building from `/app/frontend` not `/app`

