# Quick Deploy to Railway

## Fast Track Deployment

### 1. Push to GitHub
```bash
git add .
git commit -m "Ready for Railway deployment"
git push origin main
```

### 2. Create Railway Project
1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will auto-detect the Dockerfile

### 3. Add PostgreSQL
1. In your Railway project, click "New" → "Database" → "PostgreSQL"
2. Railway creates the database automatically

### 4. Set Environment Variables
In Railway project → Variables tab, add:

```
NODE_ENV=production
PORT=3000
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
CORS_ORIGIN=${{RAILWAY_PUBLIC_DOMAIN}}
```

**Note:** Railway automatically provides `${{Postgres.DATABASE_URL}}` and `${{RAILWAY_PUBLIC_DOMAIN}}` - just use those!

### 5. Run Migrations (One-time)
After first deployment, in Railway:
1. Go to your service
2. Click "Deployments" → Latest deployment → "View Logs"
3. Or use Railway CLI:
```bash
railway run npx prisma migrate deploy
```

### 6. Seed Database (Optional)
```bash
railway run npm run seed
```

### 7. Done!
Your app will be live at: `https://<your-app-name>.railway.app`

## Railway CLI (Optional but Recommended)

Install Railway CLI for easier management:
```bash
npm i -g @railway/cli
railway login
railway link  # Link to your project
railway up    # Deploy
```

## Troubleshooting

**Build fails?**
- Check Railway logs
- Ensure all files are committed

**Database connection error?**
- Verify DATABASE_URL is set correctly
- Run migrations: `railway run npx prisma migrate deploy`

**App not loading?**
- Check service logs in Railway dashboard
- Verify PORT is set to 3000
- Check CORS_ORIGIN matches your Railway URL

## Next Steps

1. Visit your Railway URL
2. Test: `https://your-app.railway.app/api/health`
3. Set up custom domain (optional)
4. Configure monitoring and alerts

That's it! Your app is deployed! 🚀

