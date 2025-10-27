<?php
session_start();

// Check if user is logged in
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    header('Location: login.html');
    exit;
}

// Include database configuration for any additional data needs
require_once 'config/database.php';
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Ads Reporting Software</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f5f5f5;
            color: #333;
            display: flex;
            min-height: 100vh;
        }

        .sidebar {
            width: 280px;
            background: #2c3e50;
            color: white;
            position: fixed;
            height: 100vh;
            display: flex;
            flex-direction: column;
            z-index: 1000;
            transition: transform 0.3s ease;
        }

        .sidebar-header {
            padding: 2rem 1.5rem 1rem;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }

        .sidebar-header h2 {
            font-size: 1.2rem;
            color: #ecf0f1;
            margin-bottom: 0.5rem;
        }

        .sidebar-header .user-info {
            font-size: 0.9rem;
            color: #bdc3c7;
        }

        .sidebar-nav {
            flex: 1;
            padding: 1rem 0;
        }

        .nav-item {
            display: block;
            padding: 1rem 1.5rem;
            color: #ecf0f1;
            text-decoration: none;
            transition: background 0.3s ease;
            border-left: 3px solid transparent;
        }

        .nav-item:hover {
            background: rgba(255,255,255,0.1);
            border-left-color: #667eea;
        }

        .nav-item.active {
            background: rgba(102, 126, 234, 0.2);
            border-left-color: #667eea;
        }

        .nav-item i {
            margin-right: 0.75rem;
            width: 18px;
        }

        .sidebar-footer {
            padding: 1.5rem;
            border-top: 1px solid rgba(255,255,255,0.1);
            display: flex;
            justify-content: flex-end;
        }

        .sidebar-logout {
            background: #e74c3c;
            color: white;
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 6px;
            text-decoration: none;
            font-size: 0.9rem;
            font-weight: 500;
            transition: all 0.3s ease;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
        }

        .sidebar-logout:hover {
            background: #c0392b;
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(231, 76, 60, 0.3);
        }

        .main-content {
            flex: 1;
            margin-left: 280px;
            min-height: 100vh;
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 1.5rem 2rem;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .header h1 {
            font-size: 1.8rem;
            margin-bottom: 0.25rem;
        }

        .header p {
            opacity: 0.9;
            font-size: 0.95rem;
        }

        .container {
            padding: 2rem;
        }

        .mobile-toggle {
            display: none;
            position: fixed;
            top: 1rem;
            left: 1rem;
            z-index: 1001;
            background: #2c3e50;
            color: white;
            border: none;
            padding: 0.75rem;
            border-radius: 6px;
            cursor: pointer;
        }

        .welcome-card {
            background: white;
            padding: 2rem;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 2rem;
            text-align: center;
        }

        .welcome-card h2 {
            color: #667eea;
            margin-bottom: 1rem;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }

        .stat-card {
            background: white;
            padding: 1.5rem;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            border-left: 4px solid #667eea;
        }

        .stat-card h3 {
            color: #666;
            font-size: 0.9rem;
            text-transform: uppercase;
            margin-bottom: 0.5rem;
        }

        .stat-card .value {
            font-size: 2rem;
            font-weight: bold;
            color: #333;
        }

        .session-info {
            background: white;
            padding: 1.5rem;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .session-info h3 {
            margin-bottom: 1rem;
            color: #667eea;
        }

        .info-item {
            display: flex;
            justify-content: space-between;
            padding: 0.5rem 0;
            border-bottom: 1px solid #eee;
        }

        .info-item:last-child {
            border-bottom: none;
        }

        .info-label {
            font-weight: 500;
            color: #666;
        }

        .info-value {
            color: #333;
        }

        @media (max-width: 768px) {
            .sidebar {
                transform: translateX(-100%);
            }

            .sidebar.open {
                transform: translateX(0);
            }

            .main-content {
                margin-left: 0;
            }

            .mobile-toggle {
                display: block;
            }

            .container {
                padding: 1rem;
            }

            .stats-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <!-- Mobile Toggle Button -->
    <button class="mobile-toggle" id="mobileToggle">☰</button>
    
    <!-- Sidebar -->
    <aside class="sidebar" id="sidebar">
        <div class="sidebar-header">
            <h2>Ads Reporting</h2>
            <div class="user-info">
                Welcome, <?php echo htmlspecialchars($_SESSION['username']); ?>
            </div>
        </div>
        
        <nav class="sidebar-nav">
            <a href="dashboard.php" class="nav-item active">
                📊 Dashboard
            </a>
            <a href="#" class="nav-item">
                📈 Reports
            </a>
            <a href="#" class="nav-item">
                🎯 Campaigns
            </a>
            <a href="#" class="nav-item">
                📋 Analytics
            </a>
            <a href="#" class="nav-item">
                ⚙️ Settings
            </a>
            <a href="#" class="nav-item">
                👤 Profile
            </a>
        </nav>
        
        <div class="sidebar-footer">
            <a href="logout.php" class="sidebar-logout">
                🚪 Logout
            </a>
        </div>
    </aside>
    
    <!-- Main Content -->
    <div class="main-content">
        <header class="header">
            <h1>Dashboard</h1>
            <p>Welcome back, <?php echo htmlspecialchars($_SESSION['username']); ?>! Here's what's happening with your ads.</p>
        </header>

        <div class="container">
            <div class="welcome-card">
                <h2>🎉 Login Successful!</h2>
                <p>You have successfully logged into the Ads Reporting Software. Your authentication system is working correctly.</p>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <h3>User ID</h3>
                    <div class="value"><?php echo $_SESSION['user_id']; ?></div>
                </div>
                <div class="stat-card">
                    <h3>Role ID</h3>
                    <div class="value"><?php echo $_SESSION['role_id']; ?></div>
                </div>
                <div class="stat-card">
                    <h3>Session Duration</h3>
                    <div class="value" id="session-duration">0m</div>
                </div>
                <div class="stat-card">
                    <h3>Login Method</h3>
                    <div class="value">
                        <?php 
                        // This is just for demonstration - in a real app you'd track this
                        echo isset($_SESSION['used_2fa']) ? '2FA' : 'Standard';
                        ?>
                    </div>
                </div>
            </div>

            <div class="session-info">
                <h3>Session Information</h3>
                <div class="info-item">
                    <span class="info-label">Username:</span>
                    <span class="info-value"><?php echo htmlspecialchars($_SESSION['username']); ?></span>
                </div>
                <div class="info-item">
                    <span class="info-label">Login Time:</span>
                    <span class="info-value"><?php echo date('Y-m-d H:i:s', $_SESSION['login_time']); ?></span>
                </div>
                <div class="info-item">
                    <span class="info-label">Session ID:</span>
                    <span class="info-value"><?php echo substr(session_id(), 0, 10) . '...'; ?></span>
                </div>
                <div class="info-item">
                    <span class="info-label">IP Address:</span>
                    <span class="info-value"><?php echo $_SERVER['REMOTE_ADDR'] ?? 'Unknown'; ?></span>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Update session duration every minute
        function updateSessionDuration() {
            const loginTime = <?php echo $_SESSION['login_time']; ?>;
            const now = Math.floor(Date.now() / 1000);
            const duration = now - loginTime;
            const minutes = Math.floor(duration / 60);
            const hours = Math.floor(minutes / 60);
            
            let durationText;
            if (hours > 0) {
                durationText = hours + 'h ' + (minutes % 60) + 'm';
            } else {
                durationText = minutes + 'm';
            }
            
            document.getElementById('session-duration').textContent = durationText;
        }

        // Mobile sidebar toggle
        function toggleSidebar() {
            const sidebar = document.getElementById('sidebar');
            sidebar.classList.toggle('open');
        }

        // Initialize
        document.addEventListener('DOMContentLoaded', function() {
            // Mobile toggle button
            const mobileToggle = document.getElementById('mobileToggle');
            if (mobileToggle) {
                mobileToggle.addEventListener('click', toggleSidebar);
            }

            // Close sidebar when clicking outside on mobile
            document.addEventListener('click', function(event) {
                const sidebar = document.getElementById('sidebar');
                const mobileToggle = document.getElementById('mobileToggle');
                
                if (window.innerWidth <= 768) {
                    if (!sidebar.contains(event.target) && !mobileToggle.contains(event.target)) {
                        sidebar.classList.remove('open');
                    }
                }
            });

            // Update session duration immediately and then every minute
            updateSessionDuration();
            setInterval(updateSessionDuration, 60000);
        });
    </script>
</body>
</html>
