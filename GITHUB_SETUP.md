# GitHub Setup Guide

This guide will help you push your Resource Management Application to GitHub.

## Prerequisites

- Git installed on your computer
- GitHub account (sign up at https://github.com if you don't have one)

## Step 1: Create a GitHub Repository

1. Go to https://github.com and sign in
2. Click the "+" icon in the top right → "New repository"
3. Fill in the details:
   - **Repository name**: `resource-a-tron` (or your preferred name)
   - **Description**: "Resource management application for Moody's Insurance Advisory team"
   - **Visibility**: Choose Public or Private
   - **DO NOT** check "Initialize with README" (we already have files)
   - **DO NOT** add .gitignore or license (we already have these)
4. Click "Create repository"

## Step 2: Initialize Git in Your Project

Open your terminal in the project directory (`/Users/brookesb/Downloads/resource-a-tron`) and run:

```bash
# Initialize git repository
git init

# Add all files
git add .

# Make your first commit
git commit -m "Initial commit: Resource Management Application"
```

## Step 3: Connect to GitHub

Replace `YOUR_USERNAME` with your GitHub username and `YOUR_REPO_NAME` with your repository name:

```bash
# Add GitHub as remote origin
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Or if you prefer SSH (requires SSH key setup):
# git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 4: Verify

1. Go to your GitHub repository page
2. You should see all your files
3. Check that sensitive files (like `.env`) are NOT visible (they should be in .gitignore)

## Common Commands

### Daily workflow:

```bash
# Check status of your files
git status

# Add specific files
git add filename.js

# Add all changes
git add .

# Commit changes
git commit -m "Description of your changes"

# Push to GitHub
git push

# Pull latest changes (if working with others)
git pull
```

### If you need to update your remote URL:

```bash
# Check current remote
git remote -v

# Update remote URL
git remote set-url origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

## Troubleshooting

### "Repository not found" error
- Check that the repository name is correct
- Verify you have access to the repository
- Make sure you're using the correct GitHub username

### "Permission denied" error
- You may need to authenticate with GitHub
- Use GitHub CLI: `gh auth login`
- Or set up SSH keys: https://docs.github.com/en/authentication/connecting-to-github-with-ssh

### Large file errors
- Check `.gitignore` is working
- Remove large files: `git rm --cached largefile.zip`
- Consider using Git LFS for large files

### Authentication issues
- Use GitHub Personal Access Token instead of password
- Generate token: GitHub Settings → Developer settings → Personal access tokens
- Use token as password when pushing

## Next Steps After GitHub Setup

1. **Connect to Railway**: Railway can deploy directly from GitHub
2. **Set up GitHub Actions**: For CI/CD (optional)
3. **Add collaborators**: Invite team members
4. **Create branches**: For feature development

## Quick Reference

```bash
# First time setup
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main

# Regular updates
git add .
git commit -m "Your commit message"
git push
```

