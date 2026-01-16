# Guide: Creating GitHub Repository and Pushing Your Code

Follow these steps to create a GitHub repository and push your Resona project.

## Step 1: Create a GitHub Repository

1. Go to [GitHub.com](https://github.com) and sign in to your account
2. Click the **"+"** icon in the top right corner
3. Select **"New repository"**
4. Fill in the repository details:
   - **Repository name**: `resonaicp` (or your preferred name)
   - **Description**: "The Superfan Commerce OS (Micro Fulfillment Network MVP)"
   - **Visibility**: Choose **Public** or **Private**
   - **DO NOT** initialize with README, .gitignore, or license (we already have files)
5. Click **"Create repository"**

## Step 2: Initialize Git Locally (if not already done)

Open PowerShell in your project directory and run:

```powershell
cd "C:\Users\MOJU Records\Documents\resonaicp"
git init
```

## Step 3: Add All Files to Git

```powershell
git add .
```

## Step 4: Create Your First Commit

```powershell
git commit -m "Initial commit: Resona Commerce Platform"
```

## Step 5: Add GitHub Remote

After creating the repository on GitHub, you'll see a page with setup instructions. Copy the repository URL (it will look like `https://github.com/yourusername/resonaicp.git` or `git@github.com:yourusername/resonaicp.git`).

Then run:

```powershell
git remote add origin https://github.com/yourusername/resonaicp.git
```

**Note**: Replace `yourusername` with your actual GitHub username.

## Step 6: Push to GitHub

```powershell
git branch -M main
git push -u origin main
```

If you're using HTTPS, GitHub will prompt you for your credentials:
- **Username**: Your GitHub username
- **Password**: Use a Personal Access Token (not your GitHub password)
  - To create a token: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token
  - Give it `repo` permissions

## Alternative: Using SSH (Recommended)

If you prefer SSH (no password prompts):

1. Set up SSH keys on GitHub (if not already done)
2. Use the SSH URL instead:
   ```powershell
   git remote add origin git@github.com:yourusername/resonaicp.git
   git push -u origin main
   ```

## Quick Reference Commands

```powershell
# Initialize git (if needed)
git init

# Add all files
git add .

# Commit changes
git commit -m "Your commit message"

# Add remote (first time only)
git remote add origin https://github.com/yourusername/resonaicp.git

# Push to GitHub
git push -u origin main

# For future updates
git add .
git commit -m "Update description"
git push
```

## Troubleshooting

### If you get "remote origin already exists":
```powershell
git remote remove origin
git remote add origin https://github.com/yourusername/resonaicp.git
```

### If you need to change the remote URL:
```powershell
git remote set-url origin https://github.com/yourusername/resonaicp.git
```

### If you get authentication errors:
- Make sure you're using a Personal Access Token (not password) for HTTPS
- Or set up SSH keys for easier authentication

## Next Steps

After pushing:
1. Visit your repository on GitHub to verify all files are there
2. Consider adding a README.md file with project description
3. Set up branch protection rules if working with a team
4. Configure GitHub Actions for CI/CD if needed
