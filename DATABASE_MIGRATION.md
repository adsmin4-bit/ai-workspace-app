# Database Migration Guide

## UUID Migration for AI Workspace App

This guide will help you update your Supabase database to use proper UUID types for all ID columns.

### What Changed

- **Session ID Generation**: Now uses `crypto.randomUUID()` instead of timestamps
- **Database Schema**: All ID columns now use UUID type with `gen_random_uuid()` default
- **Dependencies**: Removed `uuid` package dependency (using native `crypto.randomUUID()`)

### Migration Steps

#### 1. Apply Database Schema Changes

Run the following SQL in your Supabase SQL Editor:

```sql
-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS chat_sessions CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS notebook_entries CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS prompt_templates CASCADE;
DROP TABLE IF EXISTS workflows CASCADE;
DROP TABLE IF EXISTS web_sources CASCADE;
DROP TABLE IF EXISTS youtube_videos CASCADE;
DROP TABLE IF EXISTS ai_agents CASCADE;

-- Chat sessions table with UUID primary key
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  system_prompt TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table with UUID primary key and UUID foreign key
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents table with UUID primary key
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('pdf', 'docx', 'txt')),
  size INTEGER NOT NULL,
  content TEXT,
  embeddings VECTOR(1536),
  metadata JSONB,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notebook entries table with UUID primary key and UUID foreign keys
CREATE TABLE notebook_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('note', 'summary', 'idea', 'task')),
  tags TEXT[],
  related_chat_id UUID REFERENCES chat_sessions(id),
  related_document_id UUID REFERENCES documents(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Settings table with UUID primary key
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prompt templates table with UUID primary key
CREATE TABLE prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  prompt TEXT NOT NULL,
  variables TEXT[],
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflows table with UUID primary key
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  steps JSONB,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Web sources table with UUID primary key
CREATE TABLE web_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  title TEXT,
  content TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- YouTube videos table with UUID primary key
CREATE TABLE youtube_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  transcript TEXT,
  duration INTEGER,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI agents table with UUID primary key
CREATE TABLE ai_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  system_prompt TEXT,
  capabilities TEXT[],
  workflows TEXT[],
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_messages_chat_session_id ON messages(chat_session_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_chat_sessions_created_at ON chat_sessions(created_at);
CREATE INDEX idx_documents_type ON documents(type);
CREATE INDEX idx_documents_processed ON documents(processed);
CREATE INDEX idx_notebook_entries_type ON notebook_entries(type);
CREATE INDEX idx_notebook_entries_related_chat_id ON notebook_entries(related_chat_id);
CREATE INDEX idx_notebook_entries_related_document_id ON notebook_entries(related_document_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notebook_entries_updated_at BEFORE UPDATE ON notebook_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_prompt_templates_updated_at BEFORE UPDATE ON prompt_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_agents_updated_at BEFORE UPDATE ON ai_agents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### 2. Update Dependencies

Run the following command to remove the uuid dependency:

```bash
npm uninstall uuid
```

#### 3. Clear Browser Storage

Clear your browser's local storage to remove any old session data with timestamp-based IDs:

1. Open browser developer tools (F12)
2. Go to Application/Storage tab
3. Clear Local Storage for your domain
4. Clear Session Storage

#### 4. Restart the Application

```bash
npm run dev
```

### Benefits of This Migration

1. **Proper UUID Generation**: Uses native `crypto.randomUUID()` for better performance
2. **Database Consistency**: All IDs are now proper UUIDs with correct database types
3. **Better Performance**: UUID indexes are more efficient than timestamp-based IDs
4. **Reduced Dependencies**: No longer depends on external UUID library
5. **Type Safety**: Better TypeScript support with proper UUID types

### Verification

After migration, verify that:

1. ✅ New chat sessions are created with proper UUIDs
2. ✅ Messages are saved with correct session IDs
3. ✅ Document uploads work with UUID file IDs
4. ✅ All database operations work without errors
5. ✅ No more "Invalid session ID format" errors in console

### Troubleshooting

If you encounter issues:

1. **Clear all browser storage** (localStorage, sessionStorage)
2. **Restart the development server**
3. **Check browser console** for any remaining errors
4. **Verify database schema** in Supabase dashboard

The migration ensures all session IDs are now proper UUIDs and eliminates the timestamp-based ID issues you were experiencing. 