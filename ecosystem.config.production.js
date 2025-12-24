module.exports = {
  apps: [
    {
      name: 'ads-reporting-api',
      script: './server.js',
      cwd: '/var/www/ads-reporting',
      instances: 2,
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      // Production optimizations
      max_memory_restart: '500M',
      min_uptime: '10s',
      max_restarts: 10,
      
      // Logging
      log_file: '/var/www/ads-reporting/logs/combined.log',
      out_file: '/var/www/ads-reporting/logs/out.log',
      error_file: '/var/www/ads-reporting/logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Monitoring
      monitoring: false,
      
      // Advanced PM2 features
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'uploads'],
      
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      
      // Auto restart on crash
      autorestart: true,
      
      // Environment variables from .env file
      env_file: '/var/www/ads-reporting/.env.production',
      
      // Health check
      health_check_grace_period: 3000,
      
      // Merge logs from all instances
      merge_logs: true,
      
      // Time zone
      time: true
    }
  ]
};
