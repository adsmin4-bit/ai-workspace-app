# AI Workspace - Local-First AI Assistant

A comprehensive AI workspace application that combines features from LibreChat, AnythingLLM, and NotebookLM. Built with Next.js, Supabase, and LangChain for a modern, local-first AI experience.

## 🚀 Features

### Core Features
- **AI Chat Interface** - Multi-provider support (OpenAI, Claude, Mistral) with streaming responses
- **Document Processing** - Upload and chat with PDF, DOCX, and TXT files
- **Notebook Memory** - Save chats, AI notes, and summaries to Supabase
- **Workflow Automation** - Quick action buttons for common tasks
- **Web Sources** - Search and analyze web content
- **YouTube Integration** - Transcribe and process YouTube videos
- **System Prompt Editor** - Customize AI personality and behavior

### Technical Features
- **Local-First Architecture** - Works completely locally with optional cloud deployment
- **Real-time Streaming** - Instant AI responses with streaming support
- **Secure API Management** - Encrypted API key storage
- **Modern UI/UX** - Clean, responsive interface built with Tailwind CSS
- **TypeScript Support** - Full type safety throughout the application
- **Modular Design** - Easy to extend and customize

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes, LangChain.js
- **Database**: Supabase (PostgreSQL with pgvector)
- **AI Providers**: OpenAI, Anthropic (Claude), Mistral
- **State Management**: Zustand
- **File Processing**: PDF.js, Mammoth.js
- **UI Components**: Lucide React, React Markdown

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js 18+ and npm
- Git
- A Supabase account (free tier works)
- API keys for your preferred AI providers

## 🚀 Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd ai-workspace-app

# Install dependencies
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from the project settings
3. Create the following tables in your Supabase database:

```sql
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

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;
```

### 3. Configure Environment Variables

Copy the example environment file and fill in your values:

```bash
cp env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Anthropic Configuration (Claude)
ANTHROPIC_API_KEY=your_anthropic_api_key

# Mistral Configuration
MISTRAL_API_KEY=your_mistral_api_key

# YouTube API (for video transcription)
YOUTUBE_API_KEY=your_youtube_api_key

# Bing Search API (for web sources)
BING_SEARCH_API_KEY=your_bing_search_api_key
```

### 4. Run the Application

```bash
# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 How to Use

### AI Chat
1. Navigate to the "AI Chat" tab
2. Enter your message in the input field
3. The AI will respond with streaming text
4. Chat history is automatically saved

### Document Processing
1. Go to the "Documents" tab
2. Drag and drop PDF, DOCX, or TXT files
3. Files are automatically processed and indexed
4. Ask questions about your documents in the chat

### Notebook
1. Use the "Notebook" tab to save notes and ideas
2. Create different types of entries (notes, summaries, tasks)
3. Link entries to specific chats or documents

### Workflows
1. Access the "Workflows" tab for quick actions
2. Use predefined workflows like "Summarize" or "Create Tweet"
3. Customize workflows in the settings

### Web Sources
1. Enter a topic in the "Web Sources" tab
2. The system will search for relevant web content
3. Use the found sources as context for AI conversations

### YouTube Processing
1. Paste a YouTube URL in the "YouTube" tab
2. The system will transcribe the video
3. Use the transcript for analysis or Q&A

### Settings
1. Configure your AI providers and API keys
2. Customize the system prompt
3. Adjust chat parameters (temperature, max tokens)
4. Enable/disable features as needed

## 🔧 API Routes

The application includes several API routes for backend functionality:

- `/api/chat` - Main chat endpoint with streaming support
- `/api/documents/upload` - Document upload and processing
- `/api/documents/[id]` - Document management
- `/api/chat/sessions` - Chat session management
- `/api/chat/messages` - Message storage
- `/api/web/search` - Web source search
- `/api/youtube/transcribe` - YouTube video transcription

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── components/            # React components
│   ├── ChatInterface.tsx  # Main chat component
│   ├── DocumentUpload.tsx # Document upload
│   ├── SettingsPanel.tsx  # Settings management
│   └── ...               # Other components
├── lib/                   # Utility libraries
│   └── supabase.ts       # Supabase client
├── store/                 # State management
│   ├── chatStore.ts      # Chat state
│   └── settingsStore.ts  # Settings state
└── types/                 # TypeScript types
    └── index.ts          # Type definitions
```

## 🚀 Deployment

### Local Development
The app runs locally by default. No additional setup required beyond the initial configuration.

### Vercel Deployment
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Railway Deployment
1. Connect your GitHub repository to Railway
2. Add environment variables
3. Deploy with one click

## 🔒 Security

- API keys are stored securely in environment variables
- Supabase provides built-in security features
- All API routes include proper validation
- File uploads are sanitized and validated

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:

1. Check the console for error messages
2. Verify your environment variables are set correctly
3. Ensure your Supabase database is properly configured
4. Check that your API keys are valid and have sufficient credits

## 🔮 Future Features

- [ ] Advanced workflow builder
- [ ] Custom AI agent creation
- [ ] Real-time collaboration
- [ ] Advanced document analysis
- [ ] Integration with more AI providers
- [ ] Mobile app support
- [ ] Advanced search and filtering
- [ ] Export and backup functionality

## 📚 Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [LangChain.js Documentation](https://js.langchain.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

Built with ❤️ using modern web technologies for a seamless AI experience. 