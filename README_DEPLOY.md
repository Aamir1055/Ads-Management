# 🚀 Quick Deployment Instructions

## Deploy to Server: 77.42.45.79

Your Ads Reporting Software is ready to deploy! Everything has been configured to run alongside your existing HRMS application without any conflicts.

---

## 🎯 One-Command Deployment

Open PowerShell in this directory and run:

\`\`\`powershell
.\deploy-production.ps1 -FullDeploy
\`\`\`

This will:
1. ✅ Package all files
2. ✅ Upload to server
3. ✅ Install dependencies
4. ✅ Configure Nginx
5. ✅ Start with PM2

---

## 📊 Application Ports

| Application | Port | URL |
|-------------|------|-----|
| **Ads Reporting (Frontend)** | 8080 | http://77.42.45.79:8080 |
| **Ads Reporting (Backend)** | 5000 | http://77.42.45.79:5000 |
| **HRMS (Unchanged)** | 80/443 | http://77.42.45.79 |

✅ **No conflicts** - Your HRMS will continue to work normally!

---

## 📖 Need Help?

### Quick Start
Read [DEPLOY_NOW.md](DEPLOY_NOW.md) for step-by-step instructions

### Detailed Guide
Read [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for comprehensive documentation

### Server Management
Use server-management.ps1:
\`\`\`powershell
.\server-management.ps1 -Action status    # Check status
.\server-management.ps1 -Action logs      # View logs
.\server-management.ps1 -Action restart   # Restart app
\`\`\`

---

## 🔑 Server Credentials

- **IP:** 77.42.45.79
- **User:** root
- **Password:** Fasahaty@#786

---

## ✅ What's Ready

- [x] Frontend built (745 KB production bundle)
- [x] Backend configured
- [x] Environment variables set
- [x] Nginx configuration created
- [x] PM2 configuration ready
- [x] Deployment scripts prepared
- [x] Documentation complete

---

## 🚀 Let's Deploy!

Run this now:
\`\`\`powershell
.\deploy-production.ps1 -FullDeploy
\`\`\`

That's it! 🎉
