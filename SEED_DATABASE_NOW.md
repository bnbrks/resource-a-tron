# Quick Database Seeding Instructions

## Step 1: Install Railway CLI (if you haven't already)

```bash
npm i -g @railway/cli
```

## Step 2: Login and Link to Your Project

```bash
railway login
cd backend
railway link
```

When prompted, select your Railway project.

## Step 3: Run Database Migrations

```bash
railway run npx prisma migrate deploy
```

This ensures your database schema is up to date.

## Step 4: Run Basic Seed (Creates admin user and roles)

```bash
railway run npm run seed
```

This creates:
- Admin user: `admin@example.com` / password: `admin123`
- 7 team roles (Risk Associate → Managing Director)
- 5 basic skills

## Step 5: Generate Comprehensive Sample Data

```bash
railway run npm run seed:sample
```

This will create:
- **150 users** with skills and team roles
- **50 projects** with scopes
- **Hundreds of tasks** (project tasks, training, PTO, etc.)
- **Hundreds of allocations** (resource assignments)
- **Full year of time entries**

**Note:** This may take 2-5 minutes to complete as it's generating a lot of data.

## Step 6: Refresh Your Browser

After seeding, refresh your browser and you should see all the data populated!

## Login Credentials

After seeding, you can login with:
- **Admin**: `admin@example.com` / `admin123`
- **Any generated user**: Check the console output for the first user's email / `password123`

## Troubleshooting

If you get errors:
1. Make sure you're in the `backend` directory
2. Make sure Railway CLI is linked to the correct project
3. Check that `DATABASE_URL` is set in Railway's environment variables
4. Verify migrations ran successfully first

