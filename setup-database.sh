#!/bin/bash
# Database Setup Script for Ads Reporting Software
# Run this on the server after uploading files

set -e

echo "=========================================="
echo "Database Setup for Ads Reporting Software"
echo "=========================================="
echo ""

DB_NAME="ads_management"
DB_USER="adsuser"
DB_PASSWORD="AdsPass123!"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    echo -e "${RED}MySQL is not installed!${NC}"
    echo "Install MySQL first:"
    echo "  apt-get update"
    echo "  apt-get install mysql-server"
    exit 1
fi

echo -e "${YELLOW}This script will:${NC}"
echo "  1. Create database: $DB_NAME"
echo "  2. Create user: $DB_USER"
echo "  3. Grant permissions"
echo "  4. Import database schema"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
fi

# Get MySQL root password
echo ""
echo -e "${YELLOW}Enter MySQL root password:${NC}"
read -s MYSQL_ROOT_PASSWORD

# Create database and user
echo ""
echo -e "${YELLOW}Creating database and user...${NC}"

mysql -u root -p"$MYSQL_ROOT_PASSWORD" <<EOF
-- Create database
CREATE DATABASE IF NOT EXISTS $DB_NAME;

-- Create user
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';

-- Grant privileges
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;

-- Show databases
SHOW DATABASES LIKE '$DB_NAME';
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Database and user created successfully!${NC}"
else
    echo -e "${RED}Failed to create database and user.${NC}"
    exit 1
fi

# Import schema if database.sql exists
if [ -f "database.sql" ]; then
    echo ""
    echo -e "${YELLOW}Importing database schema...${NC}"
    mysql -u root -p"$MYSQL_ROOT_PASSWORD" $DB_NAME < database.sql
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Database schema imported successfully!${NC}"
    else
        echo -e "${RED}Failed to import database schema.${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}database.sql not found. Skipping schema import.${NC}"
fi

# Verify database
echo ""
echo -e "${YELLOW}Verifying database...${NC}"
mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "USE $DB_NAME; SHOW TABLES;"

echo ""
echo -e "${GREEN}Database setup complete!${NC}"
echo ""
echo "Database details:"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo "  Password: $DB_PASSWORD"
echo "  Host: localhost"
echo ""
echo "These credentials are already configured in .env.production"
