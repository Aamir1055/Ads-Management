# Deployment Guide - Ads Reporting Software
## Server: 77.42.45.79

---

## 🎯 Overview

This guide will help you deploy the Ads Reporting Software to your production server at **77.42.45.79**. 

**Important Note:** Your HRMS application is already running on this server on the default HTTP/HTTPS ports (80/443). This deployment will run the Ads Reporting Software on different ports to avoid conflicts:
- **Frontend:** Port 8080
- **Backend API:** Port 5000

---

## 📋 Prerequisites

### On Your Local Machine (Windows):
1. **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
2. **PowerShell** (comes with Windows)
3. **SCP/SSH Client** (Optional but recommended):
   - [WinSCP](https://winscp.net/) for GUI file transfer
   - [PuTTY](https://www.putty.org/) for SSH and pscp command

### On Your Server (77.42.45.79):
The deployment script will automatically install:
- Node.js (v20)
- PM2 (Process Manager)
- Nginx (Web Server)
- MySQL (if not present)

---

## 🚀 Deployment Steps

### Step 1: Build Frontend

Open PowerShell in the project directory and run:

```powershell
cd "C:\Users\irfan\Desktop\Ads Reporting Software"
.\deploy-production.ps1 -BuildOnly
```

This will:
- Install frontend dependencies
- Build the React application for production
- Create optimized static files in `frontend/dist`

**Expected output:** "Frontend built successfully!"

---

### Step 2: Full Deployment

After successful build, deploy everything:

```powershell
.\deploy-production.ps1 -FullDeploy
```

This will:
1. Create a deployment package with all necessary files
2. Upload files to the server (if SCP is available)
3. Install dependencies on the server
4. Configure Nginx
5. Start the application with PM2

**If SCP is not available:** The script will provide manual upload instructions.

---

### Step 3: Manual Upload (If Needed)

If automated upload fails, use WinSCP:

1. Open WinSCP
2. Create new session:
   - **File protocol:** SCP
   - **Host name:** 77.42.45.79
   - **Port:** 22
   - **User name:** root
   - **Password:** Fasahaty@#786

3. Upload `deployment-package` contents to `/var/www/ads-reporting/`

---

### Step 4: Server Setup

SSH to the server and run setup:

```bash
# Connect via SSH (using PuTTY or built-in Windows SSH)
ssh root@77.42.45.79
# Password: Fasahaty@#786

# Navigate to app directory
cd /var/www/ads-reporting

# Make deployment script executable
chmod +x deploy-to-production.sh

# Run deployment
bash deploy-to-production.sh remote
```

---

## 🗄️ Database Setup

The application requires a MySQL database. Run these commands on the server:

```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE IF NOT EXISTS ads_management;

# Create user
CREATE USER 'adsuser'@'localhost' IDENTIFIED BY 'AdsPass123!';

# Grant privileges
GRANT ALL PRIVILEGES ON ads_management.* TO 'adsuser'@'localhost';
FLUSH PRIVILEGES;

EXIT;

# Import database schema
mysql -u root -p ads_management < /var/www/ads-reporting/database.sql
```

---

## 🔧 Configuration

### Nginx Configuration

The deployment creates a configuration that runs on port 8080. To verify:

```bash
# Test nginx configuration
nginx -t

# Reload nginx
systemctl reload nginx

# Check nginx status
systemctl status nginx
```

### Environment Variables

Edit production environment file if needed:

```bash
nano /var/www/ads-reporting/.env.production
```

Key settings:
- `PORT=5000` - Backend API port
- `DB_HOST=localhost` - Database host
- `JWT_SECRET` - **Change this to a secure random string!**

---

## 🏃 Managing the Application

### PM2 Commands

```bash
# Check application status
pm2 status

# View logs
pm2 logs ads-reporting-api

# Restart application
pm2 restart ads-reporting-api

# Stop application
pm2 stop ads-reporting-api

# Start application
pm2 start ads-reporting-api

# View detailed info
pm2 info ads-reporting-api

# Monitor in real-time
pm2 monit
```

### Application Access

Once deployed, access your application:

- **Frontend:** http://77.42.45.79:8080
- **Backend API:** http://77.42.45.79:5000/api
- **HRMS:** http://77.42.45.79 (unchanged)

---

## 🛡️ Security Checklist

After deployment, ensure:

1. ✅ Change `JWT_SECRET` in `.env.production` to a strong random value
2. ✅ Update database password if using default
3. ✅ Configure firewall rules (allow ports 5000, 8080)
4. ✅ Set up SSL certificate (Let's Encrypt recommended)
5. ✅ Review and update CORS settings if needed
6. ✅ Enable fail2ban for SSH protection
7. ✅ Regular backup schedule for database

### Firewall Configuration

```bash
# Allow necessary ports
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HRMS HTTP
ufw allow 443/tcp   # HRMS HTTPS
ufw allow 5000/tcp  # Ads API
ufw allow 8080/tcp  # Ads Frontend
ufw enable
```

---

## 🔍 Troubleshooting

### Frontend not loading
```bash
# Check if files exist
ls -la /var/www/ads-reporting/frontend/dist

# Check nginx error logs
tail -f /var/log/nginx/ads-reporting-error.log
```

### Backend API not responding
```bash
# Check PM2 logs
pm2 logs ads-reporting-api --lines 50

# Check if port is listening
netstat -tulpn | grep 5000
```

### Database connection issues
```bash
# Test database connection
mysql -u adsuser -p ads_management

# Check MySQL status
systemctl status mysql
```

### HRMS stopped working
This shouldn't happen as we're using different ports, but if it does:
```bash
# Check HRMS application
pm2 list

# Check nginx configuration
nginx -t

# Check ports in use
netstat -tulpn | grep -E '(80|443)'
```

---

## 📊 Monitoring

### Check Server Resources

```bash
# CPU and Memory
htop

# Disk usage
df -h

# Application memory
pm2 status
```

### Log Files

- **Application logs:** `/var/www/ads-reporting/logs/`
- **Nginx logs:** `/var/log/nginx/`
- **PM2 logs:** `~/.pm2/logs/`

---

## 🔄 Updating the Application

To deploy updates:

1. Build on local machine:
   ```powershell
   .\deploy-production.ps1 -BuildOnly
   ```

2. Upload changes:
   ```powershell
   .\deploy-production.ps1 -UploadOnly
   ```

3. Restart on server:
   ```bash
   ssh root@77.42.45.79
   cd /var/www/ads-reporting
   pm2 restart ads-reporting-api
   ```

---

## 📞 Support

If you encounter issues:

1. Check logs: `pm2 logs ads-reporting-api`
2. Verify nginx config: `nginx -t`
3. Check server resources: `htop`
4. Review this guide's troubleshooting section

---

## ✅ Deployment Checklist

- [ ] Built frontend successfully
- [ ] Uploaded files to server
- [ ] Installed Node.js and PM2 on server
- [ ] Created and configured database
- [ ] Configured Nginx
- [ ] Started application with PM2
- [ ] Changed JWT_SECRET
- [ ] Configured firewall
- [ ] Tested frontend access (port 8080)
- [ ] Tested backend API (port 5000)
- [ ] Verified HRMS still works (port 80/443)
- [ ] Set up SSL certificate (optional but recommended)
- [ ] Configured backup schedule

---

## 🎉 Success!

Your Ads Reporting Software should now be running alongside your HRMS application without any conflicts!

**Access URLs:**
- Ads Reporting: http://77.42.45.79:8080
- HRMS: http://77.42.45.79

For production use, consider setting up a domain name and SSL certificate.
