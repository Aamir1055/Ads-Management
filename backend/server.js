// ----------------------------
// 🌐 Ads Management Server.js
// ----------------------------

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mysql = require("mysql2/promise");
const path = require("path");
const https = require("https");
const fs = require("fs");

// Initialize environment
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ----------------------------
// 🧩 Database Connection
// ----------------------------
let db;
async function connectDB() {
  try {
    db = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      port: process.env.DB_PORT,
    });
    console.log("✅ MySQL Database connected successfully");
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
    process.exit(1);
  }
}

// ----------------------------
// 📦 Routes Initialization
// ----------------------------
const brandRoutes = require("./routes/brandRoutes");
const roleRoutes = require("./routes/roleRoutes");
const bmRoutes = require("./routes/bmRoutes");
const adsManagerRoutes = require("./routes/adsManagerRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const campaignRoutes = require("./routes/campaignRoutes");
const campaignDataRoutes = require("./routes/campaignDataRoutes");
const campaignTypeRoutes = require("./routes/campaignTypeRoutes");
const reportRoutes = require("./routes/reportRoutes");
const permissionsRoutes = require("./routes/permissionsRoutes");
const cardsRoutes = require("./routes/cardsRoutes");
const cardUsersRoutes = require("./routes/cardUsersRoutes");
const accountsRoutes = require("./routes/accountsRoutes");
const facebookAccountRoutes = require("./routes/facebookAccountRoutes");
const facebookPageRoutes = require("./routes/facebookPageRoutes");
const userManagementRoutes = require("./routes/userManagementRoutes");




// Register routes

app.use("/api/brands", brandRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/bm", bmRoutes);
app.use("/api/ads-managers", adsManagerRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/campaign-data", campaignDataRoutes);
app.use("/api/campaign-types", campaignTypeRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/permissions", permissionsRoutes);
app.use("/api/cards", cardsRoutes);
app.use("/api/card-users", cardUsersRoutes);
app.use("/api/accounts", accountsRoutes);
app.use("/api/facebook-accounts", facebookAccountRoutes);
app.use("/api/facebook-pages", facebookPageRoutes);
app.use("/api/user-management", userManagementRoutes);



// Health check route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running fine 🚀" });
});

// ----------------------------
// 🧱 Serve Frontend Build
// ----------------------------
app.use(express.static(path.join(__dirname, "frontend_dist")));


// Fallback for React Router (SPA)
app.use((req, res, next) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, "frontend_dist", "index.html"), (err) => {
      if (err) {
        next();
      }
    });
  } else {
    next();
  }
});

// ----------------------------
// 🔐 HTTPS Configuration
// ----------------------------
const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, 'server.key')),
  cert: fs.readFileSync(path.join(__dirname, 'server.crt'))
};

// ----------------------------
// 🚀 Start Server
// ----------------------------
const PORT = process.env.PORT || 3004;

// Connect to DB then start server
connectDB().then(() => {
  https.createServer(httpsOptions, app).listen(PORT, "0.0.0.0", () => {
    console.log("------------------------------------------------");
    console.log(`✅ Server started successfully with HTTPS`);
    console.log(`🌐 Running on: https://65.20.84.140:${PORT}`);
    console.log(`💓 Health Check: https://65.20.84.140:${PORT}/api/health`);
    console.log("------------------------------------------------");
  });
}).catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

