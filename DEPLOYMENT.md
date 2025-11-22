# Deployment Guide - Railway

This guide will help you deploy Resource-A-Tron to Railway.

## Prerequisites

1. A Railway account (sign up at https://railway.app)
2. A GitHub account with the repository
3. PostgreSQL database (Railway provides this)

## Step 1: Prepare Your Repository

1. Make sure all your code is committed and pushed to GitHub:
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

## Step 2: Create Railway Project

1. Go to https://railway.app and sign in
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Railway will automatically detect the Dockerfile

## Step 3: Add PostgreSQL Database

1. In your Railway project, click "New"
2. Select "Database" → "Add PostgreSQL"
3. Railway will create a PostgreSQL database
4. Note the connection details (you'll need the DATABASE_URL)

## Step 4: Configure Environment Variables

In your Railway project settings, add these environment variables:

### Required Variables:

```
NODE_ENV=production
PORT=3000
DATABASE_URL=<from Railway PostgreSQL service>
JWT_SECRET=<generate a strong random string>
CORS_ORIGIN=<your Railway app URL, e.g., https://your-app.railway.app>
```

### Optional Variables:

```
LOG_LEVEL=info
```

### How to get DATABASE_URL:

1. Click on your PostgreSQL service in Railway
2. Go to the "Variables" tab
3. Copy the `DATABASE_URL` value

### Generate JWT_SECRET:

You can generate a secure JWT secret using:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 5: Run Database Migrations

1. In Railway, go to your service
2. Click on the "Deployments" tab
3. Find the latest deployment
4. Click on it to open the logs
5. You can run migrations manually using Railway's CLI or add a migration script

Alternatively, you can add a migration step to your deployment:

1. In Railway, go to your service settings
2. Add a "Deploy Command" or use the Railway CLI:

```bash
railway run --service <your-service-name> npx prisma migrate deploy
```

Or add this to your package.json scripts and run it on first deploy.

## Step 6: Seed Initial Data (Optional)

After migrations, you can seed the database:

```bash
railway run --service <your-service-name> npm run seed
```

Or manually through Railway's console.

## Step 7: Deploy

1. Railway will automatically deploy when you push to your main branch
2. You can also trigger a manual deployment from the Railway dashboard
3. Wait for the deployment to complete
4. Railway will provide you with a URL (e.g., `https://your-app.railway.app`)

## Step 8: Verify Deployment

1. Visit your Railway app URL
2. Check the health endpoint: `https://your-app.railway.app/api/health`
3. You should see: `{"status":"ok","message":"Resource-A-Tron API is running"}`

## Step 9: Set Up Custom Domain (Optional)

1. In Railway, go to your service settings
2. Click on "Settings" → "Networking"
3. Add your custom domain
4. Railway will provide DNS instructions

## Troubleshooting

### Database Connection Issues

- Verify DATABASE_URL is correct
- Check that PostgreSQL service is running
- Ensure migrations have run

### Build Failures

- Check Railway build logs
- Verify all dependencies are in package.json
- Ensure Dockerfile is correct

### Runtime Errors

- Check Railway service logs
- Verify all environment variables are set
- Check that Prisma client is generated

### CORS Issues

- Update CORS_ORIGIN to include your Railway URL
- For multiple origins, use comma-separated values

## Monitoring

Railway provides:
- Real-time logs
- Metrics and analytics
- Automatic restarts on failure
- Health checks

## Updating Your Deployment

Simply push to your main branch and Railway will automatically redeploy:

```bash
git add .
git commit -m "Update application"
git push origin main
```

## Database Backups

Railway automatically backs up PostgreSQL databases. You can:
- View backups in the PostgreSQL service
- Restore from backups if needed
- Export data manually using Railway CLI

## Cost Considerations

Railway offers:
- Free tier with $5 credit monthly
- Pay-as-you-go pricing
- Automatic scaling

Monitor your usage in the Railway dashboard.

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Railway Status: https://status.railway.app

