module.exports = {
  apps: [
    {
      name: 'ibef-scraper-cron',
      script: 'npm',
      args: 'run scrape',
      env_file: '.env',
      out_file: './logs/combined.log',
      error_file: './logs/error.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      instances: 1,
      exec_mode: 'fork',
      // 20:30 UTC = 02:00 IST (Azure VMs default to UTC)
      cron_restart: '30 20 * * *',
      max_memory_restart: '2G',
      autorestart: false,
    },
  ],
};
