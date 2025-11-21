# Resource Management Application

A comprehensive resourcing application for Moody's Insurance Advisory team (50 professionals) built with React, Node.js, and PostgreSQL.

## Features

- Project definition and entry
- Task definition and entry (training, PTO, other activities)
- Project planning and visualization
- User definition with skills and development areas
- Project time tracking and visualization
- User utilization tracking and visualization
- Activity tracking and visualization
- Automated resource allocation suggestions

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (via Railway)
- **ORM**: Prisma
- **UI**: Tailwind CSS + shadcn/ui
- **Charts**: Recharts

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Railway account (for PostgreSQL)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cd backend
cp .env.example .env
# Edit .env with your Railway database URL and JWT_SECRET
```

3. Run database migrations:
```bash
cd backend
npx prisma migrate dev
```

4. Generate Prisma client:
```bash
cd backend
npx prisma generate
```

5. (Optional) Seed database with sample data:
```bash
cd backend
npm run seed
```
This will create:
- 50 users with varied skills
- 18 projects with different statuses
- 30+ tasks (projects, training, PTO, other)
- Allocations and time entries for the last 6 months

Default login credentials (after seeding):
- Email: `james.smith@moodys.com` (or any user email from seed data)
- Password: `password123`

6. Start development servers:
```bash
npm run dev
```

The frontend will be available at http://localhost:5173
The backend API will be available at http://localhost:3001

## Project Structure

```
resource-a-tron/
├── frontend/          # React frontend application
├── backend/           # Node.js backend API
└── README.md
```

## Deployment

Deployed on Railway. See [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) for detailed deployment instructions.

Quick steps:
1. Create Railway project and PostgreSQL database
2. Deploy backend service (set root directory to `backend`)
3. Run database migrations via Railway CLI
4. Deploy frontend service (set root directory to `frontend`)
5. Configure environment variables

See [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for a complete checklist.

