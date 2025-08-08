# Source URLs Feature Setup

## Overview

The "Find URLs by Topic" feature allows users to search for URLs related to specific topics and save them to the database for future reference.

## Current Status

✅ **Frontend**: Complete - Users can search for URLs by topic
✅ **API Routes**: Complete - POST and GET endpoints are working
✅ **Database Schema**: Defined but table needs to be created
✅ **Real Search**: Using DuckDuckGo API for real search results
⚠️ **Database Table**: Not created yet (feature works without it)

## Database Setup

To enable URL saving to the database, you need to create the `source_urls` table in your Supabase database.

### Option 1: Run the Migration SQL

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Run the following SQL:

```sql
-- Source URLs table with UUID primary key
CREATE TABLE IF NOT EXISTS source_urls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  url TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_source_urls_topic ON source_urls(topic);
CREATE INDEX IF NOT EXISTS idx_source_urls_created_at ON source_urls(created_at);
```

### Option 2: Use the Migration File

The table definition is already included in `supabase-migration.sql`. You can run that file in your Supabase SQL Editor.

## How It Works

### Without Database Table (Current State)
- Users can search for URLs by topic
- The API uses DuckDuckGo Instant Answer API for real search results
- URLs are displayed but not saved to database
- Feature works completely for demonstration

### With Database Table (After Setup)
- URLs are saved to the `source_urls` table
- Users can view all saved URLs grouped by topic
- URLs persist between sessions
- Full functionality enabled

## Search Implementation

The feature now uses **DuckDuckGo Instant Answer API** for real search results:

1. **Real Search Results**: Uses DuckDuckGo API to find actual URLs related to the topic
2. **Fallback Sources**: Includes reliable sources like Wikipedia, Google, YouTube, and GitHub
3. **Duplicate Prevention**: Avoids saving duplicate URLs
4. **Error Handling**: Graceful fallback if API is unavailable

### Search Sources
- **DuckDuckGo API**: Real search results with abstracts and related topics
- **Wikipedia**: Direct links to Wikipedia articles
- **Google Search**: Search result pages
- **YouTube**: Video search results
- **GitHub**: Repository topic pages

## API Endpoints

### POST `/api/sources/find-urls`
- **Purpose**: Find URLs for a given topic
- **Body**: `{ "topic": "your topic here" }`
- **Response**: Array of URLs with metadata
- **Source**: DuckDuckGo API + fallback sources

### GET `/api/sources/find-urls`
- **Purpose**: Get all saved URLs grouped by topic
- **Response**: Object with topics as keys and URL arrays as values

## Frontend Features

1. **Find URLs by Topic**: Search input with "🔍 Find URLs" button
2. **Saved URLs Display**: Shows URLs grouped by topic
3. **Refresh Button**: Reloads saved URLs from database
4. **External Links**: All URLs open in new tabs

## Example Usage

1. Enter a topic like "artificial intelligence"
2. Click "🔍 Find URLs"
3. View the real search results from DuckDuckGo API
4. See additional sources like Wikipedia, Google, YouTube, and GitHub
5. Click any URL to open it in a new tab

## Troubleshooting

### If URLs aren't saving to database:
- Check that the `source_urls` table exists in Supabase
- Verify your Supabase connection settings
- Check the browser console for error messages

### If the feature isn't working:
- Ensure the development server is running
- Check that all API routes are accessible
- Verify the WebSourcesPanel component is properly imported

### If search results are limited:
- The DuckDuckGo API may have rate limits
- Fallback sources will still provide useful URLs
- Check the browser console for API errors

## Future Enhancements

- Integration with more search APIs (Google Custom Search, Bing Search)
- URL validation and filtering
- Bulk URL import/export
- URL categorization and tagging
- Integration with AI chat for URL analysis
- Web scraping of found URLs for content extraction 