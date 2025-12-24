#!/bin/bash

# Deployment Script for Ads Reporting Software
# Server: 77.42.45.79
# Note: HRMS is already running on this server

set -e  # Exit on error

echo "=========================================="
echo "Deploying Ads Reporting Software"
echo "Server: 77.42.45.79"
echo "=========================================="

# Configuration
SERVER_IP="77.42.45.79"
SERVER_USER="root"
APP_DIR="/var/www/ads-reporting"
BACKUP_DIR="/var/backups/ads-reporting"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're on the server or deploying from local
if [ "$1" == "remote" ]; then
    echo -e "${GREEN}Running remote deployment commands...${NC}"
    
    # Create necessary directories
    echo "Creating application directories..."
    mkdir -p $APP_DIR
    mkdir -p $APP_DIR/logs
    mkdir -p $APP_DIR/uploads
    mkdir -p $BACKUP_DIR
    
    # Set permissions
    chmod 755 $APP_DIR
    chmod 755 $APP_DIR/logs
    chmod 755 $APP_DIR/uploads
    
    # Install Node.js if not installed
    if ! command -v node &> /dev/null; then
        echo "Installing Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt-get install -y nodejs
    fi
    
    # Install PM2 globally if not installed
    if ! command -v pm2 &> /dev/null; then
        echo "Installing PM2..."
        npm install -g pm2
        pm2 startup systemd -u root --hp /root
    fi
    
    # Install Nginx if not installed
    if ! command -v nginx &> /dev/null; then
        echo "Installing Nginx..."
        apt-get update
        apt-get install -y nginx
    fi
    
    # Install MySQL if not installed
    if ! command -v mysql &> /dev/null; then
        echo -e "${YELLOW}MySQL not found. Please install MySQL and create the database:${NC}"
        echo "Database: ads_management"
        echo "User: adsuser"
        echo "Password: AdsPass123!"
    fi
    
    # Navigate to app directory
    cd $APP_DIR
    
    # Install backend dependencies
    echo "Installing backend dependencies..."
    npm install --production
    
    # Build frontend (if dist is not present)
    if [ -d "frontend" ]; then
        echo "Building frontend..."
        cd frontend
        npm install
        npm run build
        cd ..
    fi
    
    # Copy nginx configuration
    if [ -f "nginx-ads-reporting.conf" ]; then
        echo "Configuring Nginx..."
        cp nginx-ads-reporting.conf /etc/nginx/sites-available/ads-reporting
        ln -sf /etc/nginx/sites-available/ads-reporting /etc/nginx/sites-enabled/ads-reporting
        nginx -t && systemctl reload nginx
    fi
    
    # Setup database (import schema if needed)
    # You'll need to run this manually:
    # mysql -u root -p ads_management < database.sql
    
    # Start application with PM2
    echo "Starting application with PM2..."
    pm2 delete ads-reporting-api 2>/dev/null || true
    pm2 start ecosystem.config.production.js --env production
    pm2 save
    
    echo -e "${GREEN}Deployment completed!${NC}"
    echo ""
    echo "Application is running on:"
    echo "  - Frontend: http://77.42.45.79:8080"
    echo "  - Backend API: http://77.42.45.79:5000"
    echo ""
    echo "HRMS application remains on default ports (80/443)"
    echo ""
    echo "Useful commands:"
    echo "  pm2 status           - Check application status"
    echo "  pm2 logs             - View logs"
    echo "  pm2 restart all      - Restart application"
    echo "  nginx -t             - Test nginx configuration"
    
else
    # Local machine - upload files to server
    echo -e "${YELLOW}This script should be run on the server.${NC}"
    echo "To deploy:"
    echo "1. Upload files to server using SCP or SFTP"
    echo "2. SSH to server: ssh root@77.42.45.79"
    echo "3. Navigate to deployment directory"
    echo "4. Run: bash deploy-to-production.sh remote"
    echo ""
    echo "Or use the PowerShell deployment script on Windows."
fi
