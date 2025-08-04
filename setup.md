# AI Workspace Setup Guide

This guide will walk you through setting up your AI workspace application step by step.

## Prerequisites

Before starting, make sure you have:
- Node.js 18+ installed
- A Supabase account (free at supabase.com)
- API keys for your preferred AI providers

## Step 1: Install Dependencies

```bash
npm install
```

This will install all the required packages including:
- Next.js 14 for the framework
- React 18 for the UI
- Supabase client for database
- LangChain for AI processing
- Tailwind CSS for styling
- And many more...

## Step 2: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once created, go to Settings > API to get your project URL and anon key
3. In the SQL Editor, run the following commands to create the database schema:

```sql
-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Chat sessions table
CREATE TABLE chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  system_prompt TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents table
CREATE TABLE documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('pdf', 'docx', 'txt')),
  size INTEGER NOT NULL,
  content TEXT,
  embeddings VECTOR(1536),
  metadata JSONB,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notebook entries table
CREATE TABLE notebook_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('note', 'summary', 'idea', 'task')),
  tags TEXT[],
  related_chat_id UUID REFERENCES chat_sessions(id),
  related_document_id UUID REFERENCES documents(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Settings table
CREATE TABLE settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Step 3: Configure Environment Variables

1. Copy the example environment file:
```bash
cp env.example .env.local
```

2. Edit `.env.local` and add your configuration:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI Configuration (Required for basic functionality)
OPENAI_API_KEY=your_openai_api_key

# Optional: Other AI Providers
ANTHROPIC_API_KEY=your_anthropic_api_key
MISTRAL_API_KEY=your_mistral_api_key

# Optional: Additional Features
YOUTUBE_API_KEY=your_youtube_api_key
BING_SEARCH_API_KEY=your_bing_search_api_key
```

## Step 4: Get API Keys

### OpenAI (Required)
1. Go to [platform.openai.com](https://platform.openai.com)
2. Create an account and add billing information
3. Go to API Keys and create a new key
4. Copy the key to your `.env.local` file

### Anthropic (Claude) - Optional
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an account and add billing
3. Create an API key
4. Add to your `.env.local` file

### Mistral - Optional
1. Go to [console.mistral.ai](https://console.mistral.ai)
2. Create an account
3. Generate an API key
4. Add to your `.env.local` file

## Step 5: Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 6: First Time Setup

1. **Configure AI Providers**: Go to Settings and add your API keys
2. **Test Chat**: Try sending a message in the AI Chat tab
3. **Upload Documents**: Test document upload in the Documents tab
4. **Create Notes**: Try the Notebook feature

## Troubleshooting

### Common Issues

**"Module not found" errors**
- Run `npm install` again
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`

**Supabase connection errors**
- Verify your Supabase URL and keys are correct
- Check that you've created all the required tables
- Ensure your Supabase project is active

**API key errors**
- Verify your API keys are correct and have sufficient credits
- Check that the keys are properly added to `.env.local`
- Restart the development server after adding new environment variables

**File upload issues**
- Ensure you're using supported file types (PDF, DOCX, TXT)
- Check file size limits (10MB max)
- Verify Supabase storage is configured

### Getting Help

1. Check the browser console for error messages
2. Look at the terminal output for server errors
3. Verify all environment variables are set correctly
4. Ensure your Supabase database schema is properly set up

## Next Steps

Once you have the basic application running:

1. **Customize the System Prompt**: Go to Settings to modify the AI's personality
2. **Add More AI Providers**: Configure additional providers in Settings
3. **Upload Your Documents**: Start building your knowledge base
4. **Create Workflows**: Set up automated tasks
5. **Explore Advanced Features**: Try web sources and YouTube integration

## Production Deployment

When ready to deploy:

1. **Vercel**: Push to GitHub and connect to Vercel
2. **Railway**: Connect your repository to Railway
3. **Self-hosted**: Build with `npm run build` and deploy the output

Remember to add your environment variables to your production platform's settings.

---

Your AI workspace is now ready! Start exploring the features and customizing it to your needs. 