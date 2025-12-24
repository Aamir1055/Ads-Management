#!/bin/bash
# Fix CORS configuration

cd /var/www/ads-reporting

# Add CORS configuration
echo "" >> .env
echo "# CORS Configuration - Allow frontend to access API" >> .env
echo "CORS_ALLOWLIST=http://77.42.45.79:8080,http://77.42.45.79" >> .env

echo "Updated .env file:"
cat .env

echo ""
echo "Restarting application..."
pm2 restart ads-reporting-api

echo ""
echo "Waiting for startup..."
sleep 3

echo "Application status:"
pm2 list

echo ""
echo "Recent logs:"
pm2 logs ads-reporting-api --lines 5 --nostream
