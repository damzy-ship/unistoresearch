#!/bin/bash

# Script to clear and populate realtime products
echo "🚀 Clearing and populating realtime products..."

# Get database URL from environment or use default
DATABASE_URL=${DATABASE_URL:-"postgresql://postgres:password@localhost:5432/unistore"}

# Run the SQL file
psql "$DATABASE_URL" -f scripts/clear-and-populate-realtime.sql

echo "✅ Realtime products cleared and populated successfully!"
echo "📊 Added 15 new products:"
echo "   - 6 Text posts with colored backgrounds"
echo "   - 6 Image products (electronics, books, furniture, etc.)"
echo "   - 3 Video tutorials from W3Schools"
echo ""
echo "🎨 Text post colors: Orange, Teal, Blue, Green, Yellow, Purple"
echo "📱 Check the realtime feed to see the new products!" 