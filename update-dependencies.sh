#!/bin/bash

echo "🔄 Updating IBEF Scraper Dependencies to Latest Versions..."

# Clean install to ensure fresh dependencies
echo "🧹 Cleaning existing node_modules and package-lock.json..."
rm -rf node_modules package-lock.json

# Install latest dependencies
echo "📦 Installing latest dependencies..."
npm install

# Check for outdated packages
echo "🔍 Checking for outdated packages..."
npm outdated

echo "✅ Dependencies updated successfully!"
echo ""
echo "📋 Updated packages:"
echo "• Puppeteer: ^22.0.0 (latest)"
echo "• Mongoose: ^8.0.0 (latest)"
echo "• Cheerio: ^1.0.0 (latest)"
echo "• Express: ^4.19.0 (latest)"
echo "• TypeScript: ^5.6.0 (latest)"
echo "• ESLint: ^9.0.0 (latest)"
echo "• And many more..."
echo ""
echo "🚀 You can now run:"
echo "  npm run build    # Build the project"
echo "  npm run dev      # Start development server"
echo "  npm run scrape   # Run the scraper"
