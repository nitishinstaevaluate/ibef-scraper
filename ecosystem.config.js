module.exports = {
  apps: [
    {
      name: 'ibef-scraper-api',
      script: 'dist/app.js',
      env_file: '.env',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '1G',
      autorestart: true
    },
    {
      name: 'ibef-scraper-cron',
      script: 'dist/scripts/scrape.js',
      env_file: '.env',
      instances: 1,
      exec_mode: 'fork',
      cron_restart: '0 2 * * *',
      max_memory_restart: '2G',
      autorestart: false
    }
  ]
};
