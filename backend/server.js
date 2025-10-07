const app = require('./app');
const { pool, testConnection } = require('./config/database');
const ReportAnalyticsWebSocket = require('./websocket/reportAnalyticsSocket');
require('dotenv').config();

const PORT = process.env.PORT;
let server; // HTTP server instance
let analyticsWS = null; // WebSocket server instance
let forceCloseTimer = null;

// Optional: track open sockets to close idle keep-alive during shutdown
const sockets = new Set();

const startServer = async () => {
  try {
    console.log('🔄 Starting server initialization...');

    await testDatabaseConnection(
      Number(process.env.DB_RETRY_ATTEMPTS || 3),
      Number(process.env.DB_RETRY_DELAY_MS || 2000)
    );
    console.log('✅ Database connection established');

    server = app.listen(PORT, () => {
      console.log('🚀 Server started successfully!');
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Server URL: http://localhost:${PORT}`);
      console.log(`💓 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`📖 API Documentation: http://localhost:${PORT}/api/docs`);
      console.log(`📊 Analytics Dashboard: http://localhost:${PORT}/analytics`);
      console.log(`🚀 Real-time Dashboard: http://localhost:${PORT}/analytics/realtime.html`);
      console.log(`⚡ Ready to accept connections`);
    });

    // Initialize WebSocket server for real-time analytics
    try {
      analyticsWS = new ReportAnalyticsWebSocket(server);
      console.log('🔗 WebSocket analytics server initialized');
      console.log(`📡 WebSocket URL: ws://localhost:${PORT}/ws/report-analytics`);
    } catch (error) {
      console.warn('⚠️  Failed to initialize WebSocket server:', error.message);
    }

    // Track sockets (helps closing idle keep-alive sockets on shutdown)
    server.on('connection', (socket) => {
      sockets.add(socket);
      socket.on('close', () => sockets.delete(socket));
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        console.log('💡 Try using a different port or kill the existing process');
      } else if (error.code === 'EACCES') {
        console.error(`❌ Permission denied to bind to port ${PORT}`);
        console.log('💡 Use a port > 1024 or run with elevated privileges');
      } else {
        console.error('❌ Server error:', error);
      }
      process.exit(1);
    });

    // Monitor uncaught errors (log-only monitor)
    process.on('uncaughtExceptionMonitor', (err, origin) => {
      console.error('❌ Uncaught Exception Monitor:', err, 'Origin:', origin);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Database connection refused. Is your database server running?');
    } else if (error.code === 'ENOTFOUND') {
      console.error('💡 Database host not found. Check your database configuration.');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('💡 Database access denied. Check your credentials.');
    }
    process.exit(1);
  }
};

// Database connection test with retry logic
const testDatabaseConnection = async (retries = 3, delay = 2000) => {
  const attempts = Math.max(1, Number.isFinite(retries) ? retries : 3);
  const backoff = Math.max(0, Number.isFinite(delay) ? delay : 2000);

  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      console.log(`🔄 Testing database connection (attempt ${i + 1}/${attempts})...`);
      await testConnection();
      return;
    } catch (error) {
      lastErr = error;
      console.warn(`⚠️  Database connection attempt ${i + 1} failed:`, error.message);
      if (i < attempts - 1 && backoff > 0) {
        console.log(`⏳ Retrying in ${Math.ceil(backoff / 1000)} seconds...`);
        await new Promise(resolve => setTimeout(resolve, backoff));
      }
    }
  }
  const err = new Error(`Failed to connect to database after ${attempts} attempts: ${lastErr?.message || 'Unknown error'}`);
  err.cause = lastErr;
  throw err;
};

// Close idle keep-alive sockets (optional helper)
const closeIdleSockets = () => {
  for (const socket of sockets) {
    // End gracefully; if still open after short delay, destroy
    socket.end();
    setTimeout(() => {
      if (!socket.destroyed) socket.destroy();
    }, 2000);
  }
};

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n👋 ${signal} signal received, starting graceful shutdown...`);

  const closeServer = () => new Promise((resolve) => {
    if (!server) return resolve();
    server.close((err) => {
      if (err) console.error('❌ Error closing HTTP server:', err);
      else console.log('✅ HTTP server closed');
      resolve();
    });
  });

  try {
    // Stop accepting new connections and wait for in-flight to finish
    await closeServer();

    // Close WebSocket server
    if (analyticsWS) {
      console.log('🔄 Closing WebSocket server...');
      analyticsWS.shutdown();
      console.log('✅ WebSocket server closed');
    }

    // Close idle keep-alive sockets so process can exit
    closeIdleSockets(); // helps if clients keep sockets open [5][1]

    // Close DB pool if available
    if (pool && typeof pool.end === 'function') {
      console.log('🔄 Closing database connections...');
      await pool.end();
      console.log('✅ Database connections closed');
    }

    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during graceful shutdown:', err);
    process.exit(1);
  } finally {
    // Force close after timeout
    forceCloseTimer = setTimeout(() => {
      console.error('❌ Forceful shutdown - could not close connections gracefully');
      // As a last resort, try to close all sockets forcefully
      for (const socket of sockets) {
        try { socket.destroy(); } catch (_) {}
      }
      process.exit(1);
    }, Number(process.env.SHUTDOWN_TIMEOUT_MS || 30000));
    forceCloseTimer.unref?.();
  }
};

// Global error handlers -> initiate graceful shutdown
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Promise Rejection at:', promise);
  console.error('❌ Reason:', reason);
  if (reason && reason.stack) console.error('❌ Stack:', reason.stack);
  gracefulShutdown('unhandledRejection');
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
  console.error('❌ Stack:', error.stack);
  gracefulShutdown('uncaughtException');
});

// Termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Windows-specific signal
if (process.platform === 'win32') {
  process.on('SIGBREAK', () => gracefulShutdown('SIGBREAK'));
}

// Development helper - nodemon restarts
if (process.env.NODE_ENV === 'development') {
  // Some setups require exiting on SIGUSR2 for nodemon to restart cleanly
  process.on('SIGUSR2', () => {
    console.log('🔄 SIGUSR2 received - preparing for restart (nodemon)');
    gracefulShutdown('SIGUSR2');
  });
}

// Dev memory monitoring (non-blocking)
if (process.env.NODE_ENV === 'development') {
  const memTimer = setInterval(() => {
    const mem = process.memoryUsage();
    const mbUsed = Math.round(mem.heapUsed / 1024 / 1024);
    const mbTotal = Math.round(mem.heapTotal / 1024 / 1024);
    if (mbUsed > 100) {
      console.log(`📊 Memory usage: ${mbUsed}MB / ${mbTotal}MB`);
    }
  }, 60000);
  memTimer.unref?.();
}

// Export server for testing and start if run directly
module.exports = { server, startServer };

if (require.main === module) {
  startServer();
}
