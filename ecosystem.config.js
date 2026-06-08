module.exports = {
  apps: [
    {
      name: 'ibef-scraper-cron',
      script: 'npm',
      args: 'run scrape',
      env_file: '.env',
      instances: 1,
      exec_mode: 'fork',
      cron_restart: '0 2 * * *',
      max_memory_restart: '2G',
      autorestart: false,
    },
  ],
};
