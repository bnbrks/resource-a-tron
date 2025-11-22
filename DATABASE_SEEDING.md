# Database Seeding Guide

## Prerequisites

Make sure your database is set up and migrations are applied:

```bash
cd backend
railway run npx prisma migrate deploy
```

## Option 1: Basic Seed (Recommended for First Time)

This creates the essential data:
- Admin user: `admin@example.com` / password: `admin123`
- Team roles (Risk Associate → Managing Director)
- Basic skills

```bash
cd backend
railway run npm run seed
```

## Option 2: Comprehensive Sample Data

This generates a full dataset with:
- Multiple users with skills and team roles
- Projects and activities
- Tasks
- Resource allocations (assignments)
- Time entries

**Important:** Run the basic seed first, then generate sample data:

```bash
cd backend
# First, run basic seed
railway run npm run seed

# Then, generate comprehensive sample data
railway run npm run seed:sample
```

This will create:
- ~20 users with various skills
- Multiple projects and tasks
- Allocations showing resource assignments
- Time tracking entries

## Default Login Credentials

After running `seed:sample`, you can login with:
- **Email**: Check the console output (first generated user)
- **Password**: `password123`

Or use the admin account:
- **Email**: `admin@example.com`
- **Password**: `admin123`

## Local Development

If you're running locally (not on Railway):

```bash
cd backend
# Set up DATABASE_URL in .env file
npm run seed              # Basic seed
npm run seed:sample       # Comprehensive sample data
```

