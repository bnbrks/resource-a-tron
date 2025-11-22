#!/bin/bash

# GitHub Setup Script for Resource Management Application
# This script helps you push your code to GitHub

echo "🚀 GitHub Setup Script"
echo "======================"
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first:"
    echo "   macOS: brew install git"
    echo "   Windows: https://git-scm.com/download/win"
    exit 1
fi

echo "✅ Git is installed"
echo ""

# Check if already a git repository
if [ -d ".git" ]; then
    echo "⚠️  This directory is already a git repository"
    read -p "Do you want to continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "📦 Initializing git repository..."
    git init
fi

echo ""
echo "📝 Please provide your GitHub repository details:"
echo "   (You can create a new repo at https://github.com/new)"
echo ""

read -p "GitHub username: " GITHUB_USERNAME
read -p "Repository name: " REPO_NAME
read -p "Repository URL (https://github.com/$GITHUB_USERNAME/$REPO_NAME.git): " REPO_URL

# Use default URL if not provided
if [ -z "$REPO_URL" ]; then
    REPO_URL="https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
fi

echo ""
echo "📋 Summary:"
echo "   Username: $GITHUB_USERNAME"
echo "   Repository: $REPO_NAME"
echo "   URL: $REPO_URL"
echo ""

read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 1
fi

echo ""
echo "📦 Adding files..."
git add .

echo ""
echo "💾 Creating initial commit..."
git commit -m "Initial commit: Resource Management Application"

echo ""
echo "🔗 Adding remote origin..."
git remote add origin "$REPO_URL" 2>/dev/null || git remote set-url origin "$REPO_URL"

echo ""
echo "🌿 Setting default branch to main..."
git branch -M main

echo ""
echo "📤 Pushing to GitHub..."
echo "   (You may be prompted for GitHub credentials)"
echo ""

git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Success! Your code has been pushed to GitHub."
    echo "   View it at: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
    echo ""
    echo "📚 Next steps:"
    echo "   1. Connect Railway to this GitHub repository"
    echo "   2. See RAILWAY_DEPLOYMENT.md for deployment instructions"
else
    echo ""
    echo "❌ Push failed. Common issues:"
    echo "   - Repository doesn't exist on GitHub (create it first)"
    echo "   - Authentication failed (use GitHub Personal Access Token)"
    echo "   - Wrong repository URL"
    echo ""
    echo "💡 Tips:"
    echo "   - Create the repository on GitHub first: https://github.com/new"
    echo "   - Use a Personal Access Token instead of password"
    echo "   - Generate token: GitHub Settings → Developer settings → Personal access tokens"
fi

