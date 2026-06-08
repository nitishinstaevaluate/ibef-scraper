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

Every day at **2:00 AM** (server local time), it will automatically:
1. Build the project
2. Scrape all IBEF industries
3. Save to MongoDB
4. Exit until the next day

Useful commands:

```bash
pm2 logs ibef-scraper-cron
pm2 stop ibef-scraper-cron
pm2 restart ibef-scraper-cron   # after code or .env changes
npm run scrape                  # manual one-off scrape (anytime)
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
