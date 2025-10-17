# IBEF Scraper

A comprehensive TypeScript web scraper for extracting industry data from the India Brand Equity Foundation (IBEF) website and storing it in MongoDB.

## Features

- 🚀 **Web Scraping**: Uses Puppeteer for robust web scraping
- 📊 **Data Extraction**: Comprehensive extraction of industry data including:
  - Industry overview and key statistics
  - Government schemes and policies
  - Statutory bodies and contacts
  - Related news and achievements
  - MSME-specific data (for MSME industry)
- 🗄️ **MongoDB Storage**: Efficient data storage with proper indexing
- 🔄 **REST API**: Full REST API for data access and management
- 📈 **Statistics**: Built-in analytics and reporting
- 🛡️ **Error Handling**: Robust error handling and retry mechanisms
- 📝 **Logging**: Comprehensive logging with Winston
- ⚡ **Performance**: Optimized for speed and reliability

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Installation

1. **Clone or navigate to the project directory:**
   ```bash
   cd /Users/bhooshanpatil/Develop/Pavin/ibef-scraper
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/ibef_scraper
   MONGODB_DATABASE=ibef_scraper

   # Scraping Configuration
   IBEF_BASE_URL=https://ibef.org
   IBEF_INDUSTRY_LIST_URL=https://ibef.org/industry
   SCRAPING_DELAY=2000
   MAX_RETRIES=3
   REQUEST_TIMEOUT=30000

   # Server Configuration
   PORT=3001
   NODE_ENV=development

   # Logging Configuration
   LOG_LEVEL=info
   LOG_FILE=logs/scraper.log

   # User Agent for Scraping
   USER_AGENT=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36
   ```

4. **Build the project:**
   ```bash
   npm run build
   ```

## Usage

### 1. Start the API Server

```bash
npm start
```

The server will start on `http://localhost:3001` (or your configured PORT).

### 2. Scrape All Industries

```bash
npm run scrape
```

This will scrape all available industries from the IBEF website.

### 3. Scrape a Single Industry

```bash
npm run scrape:single https://ibef.org/industry/msme
```

### 4. Development Mode

```bash
npm run dev
```

## API Endpoints

### Health Check
- `GET /api/health` - Check service health

### Scraping Operations
- `POST /api/scrape/start` - Start scraping all industries
- `POST /api/scrape/single` - Scrape a single industry
- `GET /api/scrape/status` - Get scraping status

### Industry Data
- `GET /api/industries` - Get all industries
- `GET /api/industries/recent` - Get recent industries
- `GET /api/industries/search?q=query` - Search industries
- `GET /api/industries/:slug` - Get industry by slug
- `DELETE /api/industries/:slug` - Delete industry

### Statistics
- `GET /api/stats` - Get scraping statistics

## Data Structure

The scraper extracts the following data for each industry:

```typescript
interface IBEFIndustryData {
  industryName: string;
  industrySlug: string;
  url: string;
  lastUpdated: Date;
  scrapedAt: Date;
  
  overview: {
    title: string;
    description: string;
    keyStats: KeyStat[];
    advantageIndia: AdvantageIndia;
  };
  
  sectorOverview: {
    title: string;
    content: string;
    keyPoints: string[];
  };
  
  statutoryBodies: {
    title: string;
    description: string;
    bodies: string[];
  };
  
  governmentSchemes: {
    title: string;
    description: string;
    schemes: Scheme[];
  };
  
  policySupport: {
    title: string;
    description: string;
    policies: Policy[];
  };
  
  achievements: {
    title: string;
    description: string;
    achievements: string[];
  };
  
  roadAhead: {
    title: string;
    description: string;
    goals: string[];
  };
  
  relatedNews: NewsItem[];
  industryContacts: Contact[];
  msmeData?: MSMEData; // Only for MSME industry
  metadata: {
    totalSections: number;
    hasImages: boolean;
    hasVideos: boolean;
    hasDownloads: boolean;
    wordCount: number;
  };
}
```

## Configuration

### Scraping Configuration

- `SCRAPING_DELAY`: Delay between requests in milliseconds (default: 2000)
- `MAX_RETRIES`: Maximum retry attempts for failed requests (default: 3)
- `REQUEST_TIMEOUT`: Request timeout in milliseconds (default: 30000)
- `USER_AGENT`: User agent string for requests

### MongoDB Configuration

- `MONGODB_URI`: MongoDB connection string
- `MONGODB_DATABASE`: Database name

### Server Configuration

- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment (development/production)

## Logging

Logs are written to:
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only
- Console output (in development mode)

## Error Handling

The scraper includes comprehensive error handling:
- Retry mechanism for failed requests
- Graceful handling of missing data
- Detailed error logging
- Validation of extracted data

## Performance Considerations

- Uses request interception to block unnecessary resources (images, CSS, etc.)
- Implements delays between requests to be respectful to the target website
- Optimized MongoDB queries with proper indexing
- Memory-efficient data processing

## Monitoring

The scraper provides several monitoring endpoints:
- Health check endpoint
- Scraping status tracking
- Statistics and analytics
- Recent activity monitoring

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in `.env`
   - Verify database permissions

2. **Scraping Failures**
   - Check internet connection
   - Verify target website is accessible
   - Increase timeout values if needed
   - Check for rate limiting

3. **Memory Issues**
   - Reduce concurrent requests
   - Increase delay between requests
   - Monitor system resources

### Debug Mode

Set `LOG_LEVEL=debug` in your `.env` file for detailed logging.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the logs
3. Create an issue with detailed information

## Changelog

### v1.0.0
- Initial release
- Full scraping functionality
- MongoDB integration
- REST API
- Comprehensive data extraction
