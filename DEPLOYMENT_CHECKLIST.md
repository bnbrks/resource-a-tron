# Deployment Checklist

Use this checklist to ensure a smooth deployment to Railway.

## Pre-Deployment

- [ ] Code is pushed to GitHub repository
- [ ] All environment variables documented
- [ ] Database migrations are ready
- [ ] Sample data script tested locally
- [ ] Build commands tested locally

## Railway Setup

- [ ] Created Railway account
- [ ] Created new Railway project
- [ ] Added PostgreSQL database service
- [ ] Copied DATABASE_URL from PostgreSQL service

## Backend Deployment

- [ ] Created backend service from GitHub repo
- [ ] Set root directory to `backend`
- [ ] Configured build command: `npm install && npm run build`
- [ ] Configured start command: `npm start`
- [ ] Added environment variables:
  - [ ] DATABASE_URL
  - [ ] JWT_SECRET (32+ characters)
  - [ ] NODE_ENV=production
  - [ ] FRONTEND_URL (set after frontend deploys)
- [ ] Backend deployed successfully
- [ ] Checked backend logs for errors

## Database Setup

- [ ] Installed Railway CLI: `npm i -g @railway/cli`
- [ ] Logged into Railway: `railway login`
- [ ] Linked to project: `railway link`
- [ ] Ran migrations: `railway run npx prisma migrate deploy`
- [ ] Generated Prisma client: `railway run npx prisma generate`
- [ ] (Optional) Seeded data: `railway run npm run seed`

## Frontend Deployment

- [ ] Created frontend service from GitHub repo
- [ ] Set root directory to `frontend`
- [ ] Configured build command: `npm install && npm run build`
- [ ] Configured start command: `npx serve -s dist -l $PORT`
- [ ] Added environment variable: `VITE_API_URL=<backend-url>`
- [ ] Frontend deployed successfully
- [ ] Checked frontend logs for errors

## Post-Deployment

- [ ] Updated backend FRONTEND_URL with frontend URL
- [ ] Tested authentication flow
- [ ] Tested API endpoints
- [ ] Verified database connections
- [ ] Checked CORS configuration
- [ ] Tested all major features:
  - [ ] User login
  - [ ] Project creation
  - [ ] Task creation
  - [ ] Time tracking
  - [ ] Resource allocation
  - [ ] Analytics
  - [ ] Resource suggestions

## Security

- [ ] JWT_SECRET is strong and unique
- [ ] Database credentials are secure
- [ ] CORS is properly configured
- [ ] Environment variables are not exposed
- [ ] HTTPS is enabled (automatic on Railway)

## Monitoring

- [ ] Set up Railway monitoring
- [ ] Configured error alerts
- [ ] Set up database backups (if needed)
- [ ] Documented deployment process

## Documentation

- [ ] Updated README with deployment info
- [ ] Documented environment variables
- [ ] Created runbook for common issues
- [ ] Shared credentials securely with team

## Rollback Plan

- [ ] Know how to rollback deployments
- [ ] Have previous working version tagged
- [ ] Database backup strategy in place

## Notes

Add any deployment-specific notes here:

