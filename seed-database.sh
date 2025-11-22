#!/bin/bash

# Database Seeding Script
# This script will seed your Railway database with sample data

set -e  # Exit on error

echo "========================================="
echo "Database Seeding Script"
echo "========================================="
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "⚠ Railway CLI is not installed."
    echo ""
    echo "Installing Railway CLI..."
    npm install -g @railway/cli || {
        echo "❌ Failed to install Railway CLI"
        echo "Please install it manually: npm install -g @railway/cli"
        exit 1
    }
fi

# Check if we're in the right directory
if [ ! -d "backend" ]; then
    echo "❌ Error: backend directory not found"
    echo "Please run this script from the project root directory"
    exit 1
fi

cd backend

# Check if Railway project is linked
echo "Checking Railway project link..."
if ! railway status &> /dev/null; then
    echo "⚠ Railway project is not linked."
    echo ""
    echo "Please link to your Railway project:"
    echo "  1. Run: railway login"
    echo "  2. Run: railway link"
    echo "  3. Select your Railway project"
    echo ""
    read -p "Press Enter after you've linked the project..."
fi

echo ""
echo "Step 1: Running database migrations..."
echo "--------------------------------------"
railway run npx prisma migrate deploy || {
    echo "❌ Migrations failed"
    exit 1
}

echo ""
echo "Step 2: Running basic seed (admin user, roles, skills)..."
echo "---------------------------------------------------------"
railway run npm run seed || {
    echo "❌ Basic seed failed"
    exit 1
}

echo ""
echo "Step 3: Generating comprehensive sample data..."
echo "------------------------------------------------"
echo "This will take 2-5 minutes and create:"
echo "  - 150 users"
echo "  - 50 projects"
echo "  - Hundreds of tasks"
echo "  - Hundreds of allocations"
echo "  - Full year of time entries"
echo ""
read -p "Press Enter to continue (or Ctrl+C to cancel)..."

railway run npm run seed:sample || {
    echo "❌ Sample data generation failed"
    exit 1
}

echo ""
echo "========================================="
echo "✅ Database seeding completed!"
echo "========================================="
echo ""
echo "Your database now contains:"
echo "  - Admin user: admin@example.com / password: admin123"
echo "  - 150 users with skills and roles"
echo "  - 50 projects with scopes"
echo "  - Hundreds of tasks, allocations, and time entries"
echo ""
echo "Refresh your browser to see the data!"

