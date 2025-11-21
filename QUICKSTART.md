# Quick Start Guide

## Prerequisites
- Node.js 18+ installed
- Railway account (for PostgreSQL database)
- npm or yarn

## Setup Steps

### 1. Install Dependencies
```bash
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### 2. Set Up Railway Database
1. Create a new PostgreSQL database on Railway
2. Copy the DATABASE_URL from Railway
3. Create `backend/.env` file:
```bash
cd backend
cp .env.example .env
```

4. Edit `backend/.env` and add:
   - Your Railway DATABASE_URL
   - A secure JWT_SECRET (at least 32 characters)
   - FRONTEND_URL (default: http://localhost:5173)

### 3. Initialize Database
```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
```

### 4. Seed Sample Data (Optional but Recommended)
```bash
cd backend
npm run seed
```

This creates:
- 50 users with realistic skills
- 18 projects with various statuses
- 30+ tasks (projects, training, PTO, other)
- Allocations and 6 months of time entries

**Default login after seeding:**
- Email: `james.smith@moodys.com` (or any user from seed data)
- Password: `password123`

### 5. Start Development Servers
From the root directory:
```bash
npm run dev
```

This starts:
- Backend API on http://localhost:3001
- Frontend on http://localhost:5173

## Features Implemented

✅ **Stage 1**: Foundation & Core Data Models
- Monorepo structure
- PostgreSQL database with Prisma ORM
- Express API server
- React frontend with TypeScript

✅ **Stage 2**: User Management & Authentication
- JWT-based authentication
- User CRUD operations
- Skills and development areas management

✅ **Stage 3**: Project & Task Management
- Project CRUD with status tracking
- Task management (Projects, Training, PTO, Other)
- Project timeline visualization

✅ **Stage 4**: Time Tracking
- Time entry creation and management
- Weekly time tracking view
- Time entry validation
- Time summaries

✅ **Stage 5**: Resource Allocation & Planning
- Resource allocation CRUD
- Monthly allocation calendar view
- Capacity planning
- Conflict detection

✅ **Stage 6**: Utilization & Analytics
- User utilization calculations
- Team utilization dashboard
- Activity tracking
- Charts and visualizations

✅ **Stage 7**: Smart Resource Suggestion Engine
- Automated resource recommendations
- Skills matching algorithm
- Availability checking
- Start date estimation

✅ **Stage 9**: Sample Data
- Comprehensive test data generation
- Realistic scenarios for Insurance Advisory domain

## Deployment to Railway

1. Connect your GitHub repository to Railway
2. Add PostgreSQL service
3. Add Node.js service for backend
4. Set environment variables in Railway:
   - DATABASE_URL (from PostgreSQL service)
   - JWT_SECRET
   - FRONTEND_URL
   - NODE_ENV=production
   - PORT (Railway will set this)

5. For frontend, you can deploy to:
   - Railway (if supported)
   - Vercel
   - Netlify
   - Or any static hosting

## Next Steps

- Customize the application for your specific needs
- Add more visualizations (Stage 8)
- Implement role-based access control enhancements
- Add email notifications
- Integrate with calendar systems

## Troubleshooting

**Database connection issues:**
- Verify DATABASE_URL is correct
- Check Railway database is running
- Run `npx prisma generate` again

**Authentication issues:**
- Ensure JWT_SECRET is set
- Check token expiration settings

**Build issues:**
- Run `npm install` in both frontend and backend
- Clear node_modules and reinstall if needed

