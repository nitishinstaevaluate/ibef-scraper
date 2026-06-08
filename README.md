# IBEF Scraper

A plain TypeScript CLI that scrapes industry data from [IBEF](https://www.ibef.org) and stores it in MongoDB. The main backend (`Develop/backend`) reads this data from the `ibefscraper` collection for startup valuation reports.

---

## How it fits in the system

```
ibef.org  →  ibef-scraper (CLI)  →  MongoDB (ibefscraper)  →  Develop/backend  →  Startup PDF
```

---

## Project structure

```
src/
├── config.ts                  # Environment config
├── db/
│   ├── connection.ts          # MongoDB connect/disconnect
│   └── industry.model.ts      # Mongoose schema
├── scraper/
│   ├── ibef-fetch.ts          # Axios + RSS discovery
│   ├── industry-parser.ts     # Cheerio HTML parsing
│   ├── industry-repository.ts # MongoDB upsert
│   └── scrape-orchestrator.ts # Coordinates the scrape flow
├── common/
│   ├── types/ibef.ts
│   └── utils/data-processor.ts
└── scripts/
    ├── scrape.ts              # Scrape all industries
    └── scrape-single.ts       # Scrape one industry
```

---

## Setup

```bash
npm install
```

Create `.env`:

```env
MONGODB_URI=mongodb://localhost:27017/ifin
IBEF_BASE_URL=https://www.ibef.org
IBEF_INDUSTRY_LIST_URL=https://www.ibef.org/industry
IBEF_INDUSTRY_FEED_URL=https://www.ibef.org/industry/feed
SCRAPING_DELAY=2000
REQUEST_TIMEOUT=30000
USER_AGENT=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36
```

---

## Usage

### Daily scrape at 2 AM (production)

Requires **PM2 installed globally** on the server (`npm install -g pm2`).

One-time setup on your Azure VM:

```bash
npm install
pm2 start ecosystem.config.js
pm2 save
pm2 startup   # run the command it prints, so cron survives reboots
```

The cron is set to `30 20 * * *` UTC, which equals **2:00 AM IST** (Azure VMs use UTC by default).

Every day at **2:00 AM IST**, it will automatically:
1. Build the project
2. Scrape all IBEF industries
3. Save to MongoDB
4. Exit until the next day

Useful commands:

```bash
pm2 logs ibef-scraper-cron          # live stream
tail -f logs/combined.log           # scrape output (stdout)
tail -f logs/error.log              # errors only
pm2 stop ibef-scraper-cron
pm2 restart ibef-scraper-cron       # after code or .env changes
npm run scrape                      # manual one-off scrape (anytime)
```

**Logs:** The scraper uses `console.log` (no Winston). PM2 writes that output to `logs/combined.log` and `logs/error.log` in the project folder. After updating `ecosystem.config.js`, restart PM2 so the new log paths take effect:

```bash
pm2 delete ibef-scraper-cron
pm2 start ecosystem.config.js
pm2 save
```

### Manual / debugging

```bash
# Scrape all industries now
npm run scrape

# Scrape one industry
npm run scrape:single https://www.ibef.org/industry/india-automobiles
```

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 18+ |
| Language | TypeScript |
| HTTP | Axios |
| Parsing | Cheerio |
| Database | Mongoose |

No web framework. No NestJS. Just scripts.

---

## License

MIT
