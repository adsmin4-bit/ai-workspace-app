-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable vector extension for embeddings
CREATE EXTENSION IF NOT EXISTS "vector";

-- Create folders table
CREATE TABLE folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'mixed' CHECK (type IN ('urls', 'documents', 'notes', 'mixed')),
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    include_in_context BOOLEAN DEFAULT true,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat_sessions table
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    system_prompt TEXT,
    selected_folders UUID[],
    include_all_sources BOOLEAN DEFAULT true,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('pdf', 'docx', 'txt')),
    size BIGINT NOT NULL,
    content TEXT,
    embeddings VECTOR(1536),
    metadata JSONB,
    processed BOOLEAN DEFAULT false,
    include_in_memory BOOLEAN DEFAULT true,
    folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
    context_weight INTEGER DEFAULT 100 CHECK (context_weight >= 0 AND context_weight <= 100),
    tags TEXT[] DEFAULT '{}',
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notebook_entries table
CREATE TABLE notebook_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'note' CHECK (type IN ('note', 'summary', 'idea', 'task')),
    tags TEXT[] DEFAULT '{}',
    related_chat_id UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
    related_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    include_in_memory BOOLEAN DEFAULT true,
    folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
    context_weight INTEGER DEFAULT 100 CHECK (context_weight >= 0 AND context_weight <= 100),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create settings table
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) NOT NULL UNIQUE,
    value JSONB,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create prompt_templates table
CREATE TABLE prompt_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    prompt TEXT NOT NULL,
    variables TEXT[] DEFAULT '{}',
    category VARCHAR(100),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workflows table
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    steps JSONB NOT NULL,
    enabled BOOLEAN DEFAULT true,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workflow_runs table
CREATE TABLE workflow_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    input_params JSONB,
    output_result JSONB,
    logs TEXT[] DEFAULT '{}',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create web_sources table
CREATE TABLE web_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url VARCHAR(500) NOT NULL,
    title VARCHAR(255),
    content TEXT,
    metadata JSONB,
    tags TEXT[] DEFAULT '{}',
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create youtube_videos table
CREATE TABLE youtube_videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url VARCHAR(500) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    transcript TEXT,
    duration INTEGER,
    metadata JSONB,
    tags TEXT[] DEFAULT '{}',
    include_in_memory BOOLEAN DEFAULT true,
    folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
    context_weight INTEGER DEFAULT 100 CHECK (context_weight >= 0 AND context_weight <= 100),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ai_agents table
CREATE TABLE ai_agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    system_prompt TEXT NOT NULL,
    capabilities TEXT[] DEFAULT '{}',
    workflows TEXT[] DEFAULT '{}',
    enabled BOOLEAN DEFAULT true,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create source_urls table
CREATE TABLE source_urls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL,
    title VARCHAR(255),
    include_in_memory BOOLEAN DEFAULT true,
    folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
    context_weight INTEGER DEFAULT 100 CHECK (context_weight >= 0 AND context_weight <= 100),
    tags TEXT[] DEFAULT '{}',
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create context_chunks table
CREATE TABLE context_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    metadata JSONB,
    embedding VECTOR(1536),
    context_weight INTEGER DEFAULT 100 CHECK (context_weight >= 0 AND context_weight <= 100),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create summaries table
CREATE TABLE summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID NOT NULL,
    source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('document', 'url', 'youtube', 'notebook')),
    summary TEXT NOT NULL,
    word_count INTEGER,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    model_used VARCHAR(100) DEFAULT 'gpt-4',
    metadata JSONB,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat_sources table for multi-source chat toggle
CREATE TABLE chat_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(20) NOT NULL CHECK (type IN ('document', 'notebook', 'url', 'youtube')),
    source_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    selected BOOLEAN DEFAULT true,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat_memory table for persistent chat memory with RAG
CREATE TABLE chat_memory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    embedding VECTOR(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_messages_chat_session_id ON messages(chat_session_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_owner_id ON messages(owner_id);
CREATE INDEX idx_chat_sessions_created_at ON chat_sessions(created_at);
CREATE INDEX idx_chat_sessions_owner_id ON chat_sessions(owner_id);
CREATE INDEX idx_documents_type ON documents(type);
CREATE INDEX idx_documents_processed ON documents(processed);
CREATE INDEX idx_documents_folder_id ON documents(folder_id);
CREATE INDEX idx_documents_include_in_memory ON documents(include_in_memory);
CREATE INDEX idx_documents_tags ON documents USING GIN(tags);
CREATE INDEX idx_documents_owner_id ON documents(owner_id);
CREATE INDEX idx_notebook_entries_type ON notebook_entries(type);
CREATE INDEX idx_notebook_entries_related_chat_id ON notebook_entries(related_chat_id);
CREATE INDEX idx_notebook_entries_related_document_id ON notebook_entries(related_document_id);
CREATE INDEX idx_notebook_entries_folder_id ON notebook_entries(folder_id);
CREATE INDEX idx_notebook_entries_include_in_memory ON notebook_entries(include_in_memory);
CREATE INDEX idx_notebook_entries_tags ON notebook_entries USING GIN(tags);
CREATE INDEX idx_notebook_entries_owner_id ON notebook_entries(owner_id);
CREATE INDEX idx_source_urls_topic ON source_urls(topic);
CREATE INDEX idx_source_urls_created_at ON source_urls(created_at);
CREATE INDEX idx_source_urls_folder_id ON source_urls(folder_id);
CREATE INDEX idx_source_urls_include_in_memory ON source_urls(include_in_memory);
CREATE INDEX idx_source_urls_tags ON source_urls USING GIN(tags);
CREATE INDEX idx_source_urls_owner_id ON source_urls(owner_id);
CREATE INDEX idx_folders_type ON folders(type);
CREATE INDEX idx_folders_created_at ON folders(created_at);
CREATE INDEX idx_folders_owner_id ON folders(owner_id);
CREATE INDEX idx_web_sources_tags ON web_sources USING GIN(tags);
CREATE INDEX idx_web_sources_owner_id ON web_sources(owner_id);
CREATE INDEX idx_youtube_videos_tags ON youtube_videos USING GIN(tags);
CREATE INDEX idx_youtube_videos_owner_id ON youtube_videos(owner_id);
CREATE INDEX idx_context_chunks_embedding ON context_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_context_chunks_owner_id ON context_chunks(owner_id);
CREATE INDEX idx_summaries_source_id ON summaries(source_id);
CREATE INDEX idx_summaries_source_type ON summaries(source_type);
CREATE INDEX idx_summaries_generated_at ON summaries(generated_at);
CREATE INDEX idx_summaries_owner_id ON summaries(owner_id);
CREATE INDEX idx_workflow_runs_workflow_id ON workflow_runs(workflow_id);
CREATE INDEX idx_workflow_runs_status ON workflow_runs(status);
CREATE INDEX idx_workflow_runs_owner_id ON workflow_runs(owner_id);
CREATE INDEX idx_settings_owner_id ON settings(owner_id);
CREATE INDEX idx_prompt_templates_owner_id ON prompt_templates(owner_id);
CREATE INDEX idx_workflows_owner_id ON workflows(owner_id);
CREATE INDEX idx_ai_agents_owner_id ON ai_agents(owner_id);
CREATE INDEX idx_chat_sources_type ON chat_sources(type);
CREATE INDEX idx_chat_sources_source_id ON chat_sources(source_id);
CREATE INDEX idx_chat_sources_selected ON chat_sources(selected);
CREATE INDEX idx_chat_sources_owner_id ON chat_sources(owner_id);

-- Chat memory indexes
CREATE INDEX idx_chat_memory_session_id ON chat_memory(session_id);
CREATE INDEX idx_chat_memory_user_id ON chat_memory(user_id);
CREATE INDEX idx_chat_memory_embedding ON chat_memory USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_chat_memory_created_at ON chat_memory(created_at);

-- Create function to update updated_at column
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
CREATE TRIGGER update_folders_updated_at BEFORE UPDATE ON folders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_sources_updated_at BEFORE UPDATE ON chat_sources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notebook_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE youtube_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_urls ENABLE ROW LEVEL SECURITY;
ALTER TABLE context_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sources ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
-- Folders
CREATE POLICY "Users can view own folders" ON folders FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own folders" ON folders FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own folders" ON folders FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own folders" ON folders FOR DELETE USING (auth.uid() = owner_id);

-- Chat sessions
CREATE POLICY "Users can view own chat sessions" ON chat_sessions FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own chat sessions" ON chat_sessions FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own chat sessions" ON chat_sessions FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own chat sessions" ON chat_sessions FOR DELETE USING (auth.uid() = owner_id);

-- Messages
CREATE POLICY "Users can view own messages" ON messages FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own messages" ON messages FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own messages" ON messages FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own messages" ON messages FOR DELETE USING (auth.uid() = owner_id);

-- Documents
CREATE POLICY "Users can view own documents" ON documents FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own documents" ON documents FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own documents" ON documents FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own documents" ON documents FOR DELETE USING (auth.uid() = owner_id);

-- Notebook entries
CREATE POLICY "Users can view own notebook entries" ON notebook_entries FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own notebook entries" ON notebook_entries FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own notebook entries" ON notebook_entries FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own notebook entries" ON notebook_entries FOR DELETE USING (auth.uid() = owner_id);

-- Settings
CREATE POLICY "Users can view own settings" ON settings FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own settings" ON settings FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own settings" ON settings FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own settings" ON settings FOR DELETE USING (auth.uid() = owner_id);

-- Prompt templates
CREATE POLICY "Users can view own prompt templates" ON prompt_templates FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own prompt templates" ON prompt_templates FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own prompt templates" ON prompt_templates FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own prompt templates" ON prompt_templates FOR DELETE USING (auth.uid() = owner_id);

-- Workflows
CREATE POLICY "Users can view own workflows" ON workflows FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own workflows" ON workflows FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own workflows" ON workflows FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own workflows" ON workflows FOR DELETE USING (auth.uid() = owner_id);

-- Workflow runs
CREATE POLICY "Users can view own workflow runs" ON workflow_runs FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own workflow runs" ON workflow_runs FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own workflow runs" ON workflow_runs FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own workflow runs" ON workflow_runs FOR DELETE USING (auth.uid() = owner_id);

-- Web sources
CREATE POLICY "Users can view own web sources" ON web_sources FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own web sources" ON web_sources FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own web sources" ON web_sources FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own web sources" ON web_sources FOR DELETE USING (auth.uid() = owner_id);

-- YouTube videos
CREATE POLICY "Users can view own youtube videos" ON youtube_videos FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own youtube videos" ON youtube_videos FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own youtube videos" ON youtube_videos FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own youtube videos" ON youtube_videos FOR DELETE USING (auth.uid() = owner_id);

-- AI agents
CREATE POLICY "Users can view own ai agents" ON ai_agents FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own ai agents" ON ai_agents FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own ai agents" ON ai_agents FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own ai agents" ON ai_agents FOR DELETE USING (auth.uid() = owner_id);

-- Source URLs
CREATE POLICY "Users can view own source urls" ON source_urls FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own source urls" ON source_urls FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own source urls" ON source_urls FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own source urls" ON source_urls FOR DELETE USING (auth.uid() = owner_id);

-- Context chunks
CREATE POLICY "Users can view own context chunks" ON context_chunks FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own context chunks" ON context_chunks FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own context chunks" ON context_chunks FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own context chunks" ON context_chunks FOR DELETE USING (auth.uid() = owner_id);

-- Summaries
CREATE POLICY "Users can view own summaries" ON summaries FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own summaries" ON summaries FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own summaries" ON summaries FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own summaries" ON summaries FOR DELETE USING (auth.uid() = owner_id);

-- Chat sources
CREATE POLICY "Users can view own chat sources" ON chat_sources FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own chat sources" ON chat_sources FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own chat sources" ON chat_sources FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own chat sources" ON chat_sources FOR DELETE USING (auth.uid() = owner_id);

-- Enable RLS on chat_memory table
ALTER TABLE chat_memory ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for chat_memory
CREATE POLICY "Users can view own chat memory" ON chat_memory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chat memory" ON chat_memory FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own chat memory" ON chat_memory FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own chat memory" ON chat_memory FOR DELETE USING (auth.uid() = user_id);

-- Create RPC function for context chunk similarity search
CREATE OR REPLACE FUNCTION match_context_embeddings(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  user_id uuid,
  selected_chat_sources uuid[] DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  context_weight integer,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cc.id,
    cc.content,
    cc.metadata,
    cc.context_weight,
    1 - (cc.embedding <=> query_embedding) as similarity
  FROM context_chunks cc
  WHERE cc.owner_id = user_id
    AND 1 - (cc.embedding <=> query_embedding) > match_threshold
    AND (
      selected_chat_sources IS NULL 
      OR cc.metadata->>'source_id' = ANY(selected_chat_sources)
    )
  ORDER BY cc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create RPC function for chat memory similarity search
CREATE OR REPLACE FUNCTION match_chat_memory_embeddings(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  user_id uuid
)
RETURNS TABLE (
  id uuid,
  session_id uuid,
  role text,
  content text,
  created_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cm.id,
    cm.session_id,
    cm.role,
    cm.content,
    cm.created_at,
    1 - (cm.embedding <=> query_embedding) as similarity
  FROM chat_memory cm
  WHERE cm.user_id = user_id
    AND cm.embedding IS NOT NULL
    AND 1 - (cm.embedding <=> query_embedding) > match_threshold
  ORDER BY cm.embedding <=> query_embedding
  LIMIT match_count;
END;
$$; 