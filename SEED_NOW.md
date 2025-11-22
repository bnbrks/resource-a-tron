# Seed Database - Quick Instructions

## Option 1: Use the Automated Script (Easiest)

Run this from your project root:

```bash
./seed-database.sh
```

The script will:
1. Check if Railway CLI is installed (install if needed)
2. Check if project is linked
3. Run migrations
4. Run basic seed
5. Run comprehensive sample data

## Option 2: Manual Commands

If you prefer to run commands manually:

### Step 1: Install Railway CLI (if not installed)
```bash
npm install -g @railway/cli
```

### Step 2: Login and Link
```bash
railway login
cd backend
railway link
# Select your Railway project when prompted
```

### Step 3: Run Migrations
```bash
railway run npx prisma migrate deploy
```

### Step 4: Basic Seed
```bash
railway run npm run seed
```

This creates:
- Admin user: `admin@example.com` / password: `admin123`
- 7 team roles (Risk Associate → Managing Director)
- 5 basic skills

### Step 5: Comprehensive Sample Data
```bash
railway run npm run seed:sample
```

This takes 2-5 minutes and creates:
- **150 users** with skills and team roles
- **50 projects** with activity scopes
- **Hundreds of tasks** (project tasks, training, PTO, etc.)
- **Hundreds of allocations** (resource assignments)
- **Full year of time entries** (365 days)

## Option 3: Using Railway Dashboard

If you don't want to use CLI:

1. Go to your Railway project
2. Click on your **backend** service
3. Go to **Deployments** tab
4. Click on the latest deployment
5. Click **Shell** or **Run Command** tab
6. Run these commands one by one:

```bash
npx prisma migrate deploy
npm run seed
npm run seed:sample
```

## After Seeding

1. **Refresh your browser** - the dashboard should now show data
2. **Login** with:
   - Email: `admin@example.com`
   - Password: `admin123`
   - Or check console output for first generated user email / password: `password123`

## Troubleshooting

### "railway: command not found"
- Install Railway CLI: `npm install -g @railway/cli`

### "No project linked"
- Run `railway link` in the backend directory
- Select your Railway project

### "Cannot connect to database"
- Check that `DATABASE_URL` is set in Railway backend service variables
- Verify PostgreSQL service is running

### Seed script fails
- Check Railway logs for errors
- Make sure migrations ran successfully first
- Try running each step individually to see where it fails

