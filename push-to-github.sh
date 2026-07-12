#!/bin/bash
# Alpha Whisper v2.0 - GitHub Push Script
# Usage: ./push-to-github.sh YOUR_GITHUB_TOKEN

TOKEN="$1"
REPO="https://github.com/JonLin-dotcom/Alpha-Whisper"

if [ -z "$TOKEN" ]; then
    echo "Usage: ./push-to-github.sh YOUR_GITHUB_TOKEN"
    echo ""
    echo "To create a GitHub Personal Access Token:"
    echo "1. Go to https://github.com/settings/tokens"
    echo "2. Click 'Generate new token (classic)'"
    echo "3. Select 'repo' scope (full control of private repositories)"
    echo "4. Click Generate token"
    echo "5. Copy the token and run: ./push-to-github.sh ghp_xxxxxxxx"
    exit 1
fi

echo "Pushing Alpha Whisper v2.0 to GitHub..."
echo "Repository: $REPO"
echo ""

# Remove old remote if exists
git remote remove origin 2>/dev/null

# Add remote with token
git remote add origin "https://${TOKEN}@github.com/JonLin-dotcom/Alpha-Whisper.git"

# Force push to overwrite v1.0
git push -f origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "Successfully pushed Alpha Whisper v2.0 to GitHub!"
    echo "URL: https://github.com/JonLin-dotcom/Alpha-Whisper"
    echo ""
    echo "Files pushed:"
    git ls-files | head -20
else
    echo "Push failed. Check your token has 'repo' permission."
fi
