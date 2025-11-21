# Railway Deployment Guide

This guide walks you through deploying the Resource Management Application to Railway.

## Prerequisites

1. A Railway account (sign up at https://railway.app)
2. GitHub account (Railway connects via GitHub)
3. Your code pushed to a GitHub repository

## Step 1: Prepare Your Repository

1. Push your code to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

## Step 2: Deploy PostgreSQL Database

1. Go to https://railway.app and create a new project
2. Click "New" → "Database" → "Add PostgreSQL"
3. Railway will create a PostgreSQL database
4. Click on the PostgreSQL service
5. Go to the "Variables" tab
6. Copy the `DATABASE_URL` - you'll need this for the backend

## Step 3: Deploy Backend API

1. In your Railway project, click "New" → "GitHub Repo"
2. Select your repository
3. Railway will detect it's a Node.js project
4. Click on the newly created service
5. Go to "Settings" → "Root Directory" and set it to `backend`
6. Go to "Variables" tab and add:

```
DATABASE_URL=<your-postgres-database-url>
JWT_SECRET=<generate-a-secure-random-string-at-least-32-chars>
NODE_ENV=production
FRONTEND_URL=<will-be-set-after-frontend-deployment>
PORT=<railway-sets-this-automatically>
```

7. Go to "Settings" → "Deploy" and configure:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Root Directory**: `backend`

8. Railway will automatically deploy your backend

## Step 4: Run Database Migrations

After the backend is deployed, you need to run Prisma migrations:

1. Install Railway CLI (if not already installed):
```bash
npm i -g @railway/cli
```

2. Login to Railway:
```bash
railway login
```

3. Link to your project:
```bash
railway link
```

4. Run migrations:
```bash
cd backend
railway run npx prisma migrate deploy
```

5. Generate Prisma client:
```bash
railway run npx prisma generate
```

## Step 5: Deploy Frontend

You have two options for frontend deployment:

### Option A: Deploy Frontend to Railway (Recommended)

1. In your Railway project, click "New" → "GitHub Repo"
2. Select the same repository
3. Click on the new service
4. Go to "Settings" → "Root Directory" and set it to `frontend`
5. Go to "Variables" tab and add:

```
VITE_API_URL=<your-backend-railway-url>
```

6. Go to "Settings" → "Deploy" and configure:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npx serve -s dist -l 3000`
   - **Root Directory**: `frontend`

7. Add `serve` to frontend dependencies:
```bash
cd frontend
npm install --save serve
```

8. Update `frontend/package.json`:
```json
{
  "scripts": {
    "start": "serve -s dist -l 3000"
  }
}
```

### Option B: Deploy Frontend to Vercel/Netlify (Alternative)

1. **Vercel:**
   - Go to https://vercel.com
   - Import your GitHub repository
   - Set root directory to `frontend`
   - Add environment variable: `VITE_API_URL=<your-backend-railway-url>`
   - Deploy

2. **Netlify:**
   - Go to https://netlify.com
   - Import your GitHub repository
   - Set base directory to `frontend`
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Add environment variable: `VITE_API_URL=<your-backend-railway-url>`

## Step 6: Update Environment Variables

After frontend is deployed:

1. Go back to your backend service on Railway
2. Update `FRONTEND_URL` variable to your frontend URL
3. Redeploy the backend (Railway will auto-redeploy)

## Step 7: Seed Sample Data (Optional)

To populate your database with sample data:

```bash
cd backend
railway run npm run seed
```

Or connect via Railway's database console and run the seed script manually.

## Step 8: Configure Custom Domains (Optional)

1. In Railway, go to your service
2. Click "Settings" → "Networking"
3. Add a custom domain
4. Follow Railway's DNS instructions

## Troubleshooting

### Backend won't start
- Check logs in Railway dashboard
- Verify DATABASE_URL is correct
- Ensure JWT_SECRET is set
- Check that migrations ran successfully

### Database connection errors
- Verify DATABASE_URL includes SSL parameters
- Railway PostgreSQL requires SSL by default
- Your DATABASE_URL should look like:
  ```
  postgresql://user:password@host:port/dbname?sslmode=require
  ```

### Frontend can't connect to backend
- Verify VITE_API_URL is set correctly
- Check CORS settings in backend
- Ensure FRONTEND_URL matches your frontend domain

### Prisma errors
- Run `railway run npx prisma generate`
- Run `railway run npx prisma migrate deploy`
- Check that DATABASE_URL is accessible

## Environment Variables Summary

### Backend (.env)
```
DATABASE_URL=<railway-postgres-url>
JWT_SECRET=<secure-random-string-32+chars>
NODE_ENV=production
FRONTEND_URL=<your-frontend-url>
PORT=<auto-set-by-railway>
```

### Frontend (Railway/Vercel/Netlify)
```
VITE_API_URL=<your-backend-railway-url>
```

## Quick Deploy Script

Create a `deploy.sh` script:

```bash
#!/bin/bash
# Deploy to Railway

echo "Deploying backend..."
cd backend
railway up

echo "Running migrations..."
railway run npx prisma migrate deploy
railway run npx prisma generate

echo "Deployment complete!"
```

Make it executable:
```bash
chmod +x deploy.sh
```

## Monitoring

- Check Railway dashboard for logs and metrics
- Monitor database usage
- Set up alerts for errors
- Track deployment history

## Cost Considerations

- Railway offers a free tier with $5 credit/month
- PostgreSQL database is included
- Monitor usage to avoid overages
- Consider upgrading for production workloads

## Next Steps

1. Set up monitoring and alerts
2. Configure backups for PostgreSQL
3. Set up CI/CD pipeline
4. Add custom domains
5. Configure SSL certificates (automatic on Railway)

