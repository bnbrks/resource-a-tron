# Deployment Checklist

## Pre-Deployment

- [x] Dockerfile configured for production
- [x] Backend serves frontend static files
- [x] Environment variables documented
- [x] Database migrations ready
- [x] Railway configuration files created
- [x] CORS configured for production
- [x] Prisma client generation in Dockerfile

## Deployment Steps

### 1. GitHub Setup
- [ ] Initialize git repository (if not done)
- [ ] Create GitHub repository
- [ ] Push code to GitHub
  ```bash
  git remote add origin <your-github-repo-url>
  git push -u origin main
  ```

### 2. Railway Setup
- [ ] Sign up/login to Railway (https://railway.app)
- [ ] Create new project
- [ ] Connect GitHub repository
- [ ] Railway will auto-detect Dockerfile

### 3. Database Setup
- [ ] Add PostgreSQL service in Railway
- [ ] Note the DATABASE_URL (auto-provided)

### 4. Environment Variables
Set these in Railway → Variables:

- [ ] `NODE_ENV=production`
- [ ] `PORT=3000`
- [ ] `DATABASE_URL=${{Postgres.DATABASE_URL}}` (Railway auto-provides)
- [ ] `JWT_SECRET=<generate secure random string>`
- [ ] `CORS_ORIGIN=${{RAILWAY_PUBLIC_DOMAIN}}` (Railway auto-provides)
- [ ] `RUN_MIGRATIONS=true` (optional, for auto-migration on deploy)

### 5. First Deployment
- [ ] Railway will build and deploy automatically
- [ ] Wait for build to complete
- [ ] Check deployment logs for errors

### 6. Database Migrations
- [ ] Run migrations (one-time):
  ```bash
  railway run npx prisma migrate deploy
  ```
  Or use Railway dashboard → Deployments → Run command

### 7. Seed Database (Optional)
- [ ] Seed initial data:
  ```bash
  railway run npm run seed
  ```

### 8. Verify Deployment
- [ ] Visit Railway app URL
- [ ] Test health endpoint: `/api/health`
- [ ] Test frontend loads
- [ ] Test API endpoints

### 9. Post-Deployment
- [ ] Set up custom domain (optional)
- [ ] Configure monitoring
- [ ] Set up alerts
- [ ] Document production URL

## Quick Commands

### Generate JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Railway CLI (if installed)
```bash
npm i -g @railway/cli
railway login
railway link
railway up
```

### Run Migrations
```bash
railway run npx prisma migrate deploy
```

### Seed Database
```bash
railway run npm run seed
```

### View Logs
```bash
railway logs
```

## Troubleshooting

### Build Fails
- Check Railway build logs
- Verify Dockerfile syntax
- Ensure all dependencies in package.json

### Database Connection Error
- Verify DATABASE_URL is correct
- Check PostgreSQL service is running
- Run migrations manually

### App Not Loading
- Check service logs
- Verify PORT is 3000
- Check CORS_ORIGIN matches Railway URL
- Verify frontend build succeeded

### 404 on Routes
- Verify frontend static files are being served
- Check SPA routing is configured
- Verify build output directory

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| NODE_ENV | Yes | Environment | `production` |
| PORT | Yes | Server port | `3000` |
| DATABASE_URL | Yes | PostgreSQL connection | `postgresql://...` |
| JWT_SECRET | Yes | JWT signing secret | `random-hex-string` |
| CORS_ORIGIN | Yes | Allowed origins | `https://app.railway.app` |
| RUN_MIGRATIONS | No | Auto-run migrations | `true` |
| LOG_LEVEL | No | Logging level | `info` |

## Support Resources

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Project README: See README.md
- Full Deployment Guide: See DEPLOYMENT.md

