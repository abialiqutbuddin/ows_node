#!/bin/bash

# Navigate to the project directory
cd /home/linuxmachineforapp/Desktop/ows_node || exit

# Fetch latest changes from GitHub
git fetch origin

# Check if there are updates
if [[ $(git rev-parse HEAD) != $(git rev-parse @{u}) ]]; then
    echo "Changes detected, pulling latest updates..."
    git pull origin main  # Change 'main' to 'master' if needed

    # Install any new dependencies
    npm install

    # Restart the application with PM2
    pm2 restart owsdev
else
    echo "No changes detected, skipping update."
fi