# 🚀 AI Workspace App

A comprehensive, local-first AI workspace that combines chat, document processing, and workflow automation with advanced RAG (Retrieval-Augmented Generation) capabilities.

## ✨ Features

### 🤖 AI Chat with Memory
- **Context-aware conversations** using your documents and notes
- **Real-time streaming responses** from OpenAI, Claude, and Mistral
- **Session management** with conversation history
- **Folder-based context filtering** for focused conversations

### 📄 Document Processing
- **Multi-format support**: PDF, DOCX, TXT files
- **Automatic text extraction** and processing
- **Vector embeddings** for semantic search
- **Auto-tagging** with AI-generated topics
- **Summary generation** for long documents

### 📝 Smart Notebook
- **Auto-save** functionality
- **AI-powered autocomplete** suggestions
- **Multiple entry types**: notes, summaries, ideas, tasks
- **Link to chats and documents**
- **Include in AI memory** toggle

### 🌐 Web Integration
- **Web search** with DuckDuckGo API
- **URL saving** and content processing
- **YouTube video transcription**
- **Automatic content indexing**

### 🗂️ Organization
- **Folder system** for content organization
- **Memory management** with individual toggles
- **Context viewer** to see AI reasoning
- **Advanced filtering** and search

### 🤖 AI Agents
- **Custom AI agents** with specific capabilities and personalities
- **Capability-based access** to different tools and features
- **Real-time agent chat** with streaming responses
- **Agent management** with CRUD operations
- **System prompt configuration** for agent behavior

## 🚀 Quick Start

### 1. Clone and Install
```bash
git clone <your-repo-url>
cd app2
npm install
```

### 2. Environment Setup
```bash
npm run setup
```
This will create a `.env.local` file with placeholder values.

### 3. Configure API Keys
Edit `.env.local` and add your API keys:
```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key

# Optional
ANTHROPIC_API_KEY=your_anthropic_api_key
MISTRAL_API_KEY=your_mistral_api_key
YOUTUBE_API_KEY=your_youtube_api_key
```

### 4. Database Setup
1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL migration from `supabase-migration.sql`
3. Add your Supabase credentials to `.env.local`

### 5. Start Development
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to use your AI workspace!

## 📚 Detailed Setup Guide

For comprehensive setup instructions, see [SETUP_COMPLETION.md](./SETUP_COMPLETION.md)

## 🏗️ Architecture

### Frontend
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Zustand** for state management
- **React Hook Form** for forms
- **Framer Motion** for animations

### Backend
- **Next.js API Routes** for serverless functions
- **Supabase** for database and authentication
- **OpenAI API** for AI capabilities
- **pgvector** for vector similarity search
- **File processing** with PDF, DOCX, TXT support

### Database Schema
- **Chat sessions** with message history
- **Documents** with embeddings and metadata
- **Notebook entries** with auto-save
- **Web sources** and YouTube videos
- **Context chunks** for RAG functionality
- **Folders** for organization
- **Settings** and configurations

## 🎯 Usage Examples

### Chat with Document Context
1. Upload documents in the **Documents** tab
2. Go to **Chat** tab and ask questions
3. AI will use your documents as context for responses

### Create and Organize Notes
1. Use the **Notebook** tab to create notes
2. Organize content into folders
3. Toggle memory inclusion for AI context

### Web Research
1. Search for topics in **Web Sources**
2. Save relevant URLs and content
3. Use web content in AI conversations

### YouTube Analysis
1. Paste YouTube URLs in **YouTube** tab
2. Get video transcripts and metadata
3. Ask AI about video content

## 🔧 Advanced Features

### RAG (Retrieval-Augmented Generation)
- Automatic embedding generation for semantic search
- Context-aware responses using your content
- Folder-based filtering for focused conversations

### Memory Management
- Toggle individual items in/out of AI memory
- Folder-based organization
- Context viewer to see AI reasoning

### Multi-Modal Support
- Document processing (PDF, DOCX, TXT)
- Web content scraping
- YouTube video transcription
- Note-taking with autocomplete

## 🚨 Troubleshooting

### Common Issues
1. **"OpenAI API key not found"** - Check your `.env.local` file
2. **"Supabase connection failed"** - Verify your database credentials
3. **"No context found"** - Upload documents or create notes
4. **"File upload failed"** - Check file size and type

### Getting Help
- Check browser console for errors
- Review server logs in terminal
- See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for detailed solutions

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 🎉 What's Next?

Your AI workspace is ready to help you:
- Build a comprehensive knowledge base
- Automate document analysis
- Create AI-powered workflows
- Organize and search your content
- Generate insights from your data

Start exploring and enjoy the power of local-first AI assistance! 🚀 