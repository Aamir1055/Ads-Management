# Quick Deployment Summary

## ✅ Files Created for Deployment

The following files have been created and configured for your deployment:

### Configuration Files
1. **`.env.production`** - Backend production environment variables
2. **`frontend/.env.production`** - Frontend production environment variables
3. **`ecosystem.config.production.js`** - PM2 process manager configuration
4. **`nginx-ads-reporting.conf`** - Nginx web server configuration (Port 8080)

### Deployment Scripts
1. **`deploy-production.ps1`** - PowerShell deployment script (Windows)
2. **`deploy-to-production.sh`** - Bash deployment script (Linux server)

### Documentation
1. **`DEPLOYMENT_GUIDE.md`** - Complete step-by-step deployment guide

---

## 🚀 Quick Start - Deploy Now!

### Option 1: Automated Deployment (Recommended)

```powershell
cd "C:\Users\irfan\Desktop\Ads Reporting Software"
.\deploy-production.ps1 -FullDeploy
```

### Option 2: Manual Step-by-Step

If automated deployment has issues, follow these steps:

#### Step 1: Upload Files with WinSCP

1. Download and install [WinSCP](https://winscp.net/)
2. Create new connection:
   - Protocol: SCP
   - Host: 77.42.45.79
   - User: root
   - Password: Fasahaty@#786
3. Upload these folders to `/var/www/ads-reporting/`:
   - `routes/`
   - `controllers/`
   - `models/`
   - `middleware/`
   - `services/`
   - `utils/`
   - `config/`
   - `frontend/dist/`
4. Upload these files:
   - `server.js`
   - `app.js`
   - `package.json`
   - `.env.production`
   - `ecosystem.config.production.js`
   - `nginx-ads-reporting.conf`
   - `deploy-to-production.sh`
   - `database.sql`

#### Step 2: SSH to Server and Deploy

Using PuTTY or Windows SSH:

```bash
ssh root@77.42.45.79
# Password: Fasahaty@#786

# Navigate to app directory
cd /var/www/ads-reporting

# Make script executable
chmod +x deploy-to-production.sh

# Run deployment
bash deploy-to-production.sh remote
```

---

## 🎯 Important Configuration

### Ports Used
- **Ads Reporting Frontend:** Port 8080
- **Ads Reporting Backend:** Port 5000
- **HRMS Application:** Ports 80/443 (unchanged)

### Database Configuration
- **Database:** ads_management
- **User:** adsuser
- **Password:** AdsPass123!
- **Host:** localhost
- **Port:** 3306

### Security Note
⚠️ **IMPORTANT:** After deployment, update the JWT_SECRET in `/var/www/ads-reporting/.env.production` to a secure random string!

Generate a secure secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## ✅ Post-Deployment Checklist

After deployment, verify:

- [ ] Frontend loads at http://77.42.45.79:8080
- [ ] Backend API responds at http://77.42.45.79:5000/api
- [ ] HRMS still works at http://77.42.45.79
- [ ] Database connection works
- [ ] PM2 shows application running: `pm2 status`
- [ ] Nginx is configured: `nginx -t`
- [ ] JWT_SECRET has been changed
- [ ] Firewall allows ports 5000 and 8080

---

## 🔧 Useful Commands

### On Server (SSH)

```bash
# Check application status
pm2 status

# View logs
pm2 logs ads-reporting-api

# Restart application
pm2 restart ads-reporting-api

# Check Nginx
nginx -t
systemctl status nginx

# Check database
mysql -u adsuser -p ads_management
```

### On Windows (PowerShell)

```powershell
# Build frontend only
.\deploy-production.ps1 -BuildOnly

# Upload files only
.\deploy-production.ps1 -UploadOnly

# Full deployment
.\deploy-production.ps1 -FullDeploy
```

---

## 📊 Access URLs

After successful deployment:

| Application | URL | Port |
|-------------|-----|------|
| Ads Reporting (Frontend) | http://77.42.45.79:8080 | 8080 |
| Ads Reporting API | http://77.42.45.79:5000 | 5000 |
| HRMS | http://77.42.45.79 | 80/443 |

---

## 🆘 Troubleshooting

### Frontend not accessible
```bash
# Check if files exist
ls -la /var/www/ads-reporting/frontend/dist

# Check nginx
nginx -t
systemctl restart nginx
```

### Backend API errors
```bash
# Check logs
pm2 logs ads-reporting-api --lines 100

# Check if running
pm2 status

# Restart
pm2 restart ads-reporting-api
```

### Database issues
```bash
# Test connection
mysql -u adsuser -p
# Enter password: AdsPass123!

# Import schema if needed
mysql -u adsuser -p ads_management < /var/www/ads-reporting/database.sql
```

---

## 📝 Next Steps

1. **Deploy Now:** Run `.\deploy-production.ps1 -FullDeploy`
2. **Test Access:** Visit http://77.42.45.79:8080
3. **Secure It:** Change JWT_SECRET and enable firewall
4. **SSL (Optional):** Set up Let's Encrypt for HTTPS
5. **Backups:** Schedule regular database backups

---

## 📞 Need Help?

Refer to the complete **DEPLOYMENT_GUIDE.md** for detailed instructions and troubleshooting.

---

## ✨ Ready to Deploy!

Everything is configured and ready. Run the deployment script when you're ready:

```powershell
.\deploy-production.ps1 -FullDeploy
```

Good luck with your deployment! 🚀
