# Document-Aware AI Chat Feature

## Overview

The AI Chat now has the ability to use your uploaded documents, saved URLs, and notebook entries as context when answering questions. This creates a personalized knowledge base that the AI can reference to provide more accurate and relevant responses.

## Features

### ✅ **Source Selection Controls**
- **Collapsible Interface**: Click "Knowledge Sources" to expand/collapse the source selection panel
- **Individual Toggles**: Enable/disable each source type independently
- **Real-time Counts**: See how many items are available in each source
- **Visual Indicators**: Color-coded icons for each source type

### ✅ **Smart Context Building**
- **Automatic Fetching**: Retrieves all relevant data from Supabase
- **Text Chunking**: Breaks long documents into 1000-token blocks for optimal processing
- **Source Attribution**: Each piece of context is clearly labeled with its source
- **Intelligent Filtering**: Only includes selected sources in the AI prompt

### ✅ **Enhanced AI Responses**
- **Context-Aware Answers**: AI references specific sources when answering
- **Source Citations**: Responses mention which documents, URLs, or notes informed the answer
- **Fallback Behavior**: Uses general knowledge when context isn't available
- **Streaming Responses**: Real-time AI responses with context integration

## How It Works

### 1. **Source Data Collection**
When you send a message, the system:
- Fetches all documents from the `documents` table
- Retrieves all saved URLs from the `source_urls` table  
- Gets all notebook entries from the `notebook_entries` table
- Only processes sources that are currently selected

### 2. **Context Processing**
For each selected source:
- **Documents**: Extracts text content and chunks into ~1000-token blocks
- **URLs**: Includes title, topic, and URL information
- **Notebook Entries**: Extracts content and chunks into manageable pieces
- **Formatting**: Labels each piece with source type and identifier

### 3. **AI Prompt Enhancement**
The system creates an enhanced system prompt:
```
You are a helpful AI assistant.

You have access to the following information that may be relevant to the user's question. Use this information to provide more accurate and helpful responses:

[DOCUMENT: document-name.pdf - Part 1]
Document content here...

[URL: Wikipedia Article]
Topic: artificial intelligence
URL: https://en.wikipedia.org/wiki/Artificial_intelligence

[NOTEBOOK: AI Research Notes - note - Part 1]
Notebook content here...

When answering, reference the specific sources (documents, URLs, or notebook entries) that informed your response. If the information isn't in the provided context, you can still answer based on your general knowledge, but prioritize the provided context when available.
```

### 4. **Response Generation**
The AI:
- Processes the enhanced prompt with context
- Generates responses that reference specific sources
- Streams the response in real-time
- Maintains conversation context

## User Interface

### **Knowledge Sources Panel**
Located between the header and messages area:

```
┌─ Knowledge Sources (2 selected) ▼ ─┐
│ Select which sources to include:    │
│ ☑ Documents (3)                     │
│ ☑ Saved URLs (5)                    │
│ ☐ Notebook Entries (0)              │
│                                     │
│ The AI will use information from    │
│ selected sources to provide more    │
│ relevant and accurate responses.    │
└─────────────────────────────────────┘
```

### **Source Types**
- **📄 Documents** (Blue): Uploaded PDF, DOCX, and TXT files
- **🌐 Saved URLs** (Green): URLs found through topic searches
- **📖 Notebook Entries** (Purple): Notes, summaries, ideas, and tasks

## Example Usage

### **Scenario 1: Document-Based Q&A**
1. Upload a research paper about machine learning
2. Enable "Documents" in Knowledge Sources
3. Ask: "What are the main findings in this paper?"
4. AI responds with specific references to the document content

### **Scenario 2: Multi-Source Research**
1. Have documents about AI, saved URLs about neural networks, and notebook notes
2. Enable all three source types
3. Ask: "What are the latest developments in AI?"
4. AI combines information from all sources for a comprehensive answer

### **Scenario 3: Focused Responses**
1. Disable "Documents" and "URLs", keep only "Notebook Entries"
2. Ask: "What ideas did I write down about this topic?"
3. AI focuses only on your personal notes and ideas

## Technical Implementation

### **Backend Changes**
- **Enhanced Chat API**: `/api/chat` now accepts `selectedSources` parameter
- **Context Building**: `buildContext()` function processes selected sources
- **Text Chunking**: `chunkText()` function breaks long content into manageable pieces
- **Database Integration**: Fetches data from all relevant tables

### **Frontend Changes**
- **Source Controls**: Collapsible panel with checkboxes
- **Real-time Counts**: Fetches and displays source counts
- **State Management**: Tracks selected sources and UI state
- **Enhanced Requests**: Sends source preferences with each message

### **Data Flow**
```
User Input → Source Selection → Context Building → AI Prompt → Response
     ↓              ↓                ↓              ↓          ↓
  Message    Selected Sources   Fetch Data    Enhanced    Streamed
  Content    (documents, URLs,  from DB      System      AI Response
             notebook)                       Prompt
```

## Performance Considerations

### **Token Management**
- **Chunking**: Long documents are split into ~1000-token blocks
- **Efficient Processing**: Only selected sources are processed
- **Context Limits**: System respects OpenAI's context window limits

### **Database Optimization**
- **Selective Fetching**: Only fetches data for selected sources
- **Error Handling**: Graceful fallback if database queries fail
- **Caching**: Source counts are fetched once on component mount

### **Response Quality**
- **Source Attribution**: AI clearly references which sources informed responses
- **Context Prioritization**: AI prioritizes provided context over general knowledge
- **Fallback Behavior**: Uses general knowledge when context is insufficient

## Troubleshooting

### **If AI responses don't seem to use your sources:**
1. Check that the relevant source type is enabled
2. Verify that you have data in the selected sources
3. Look for source citations in the AI response
4. Check browser console for any errors

### **If source counts show 0:**
1. Verify that you have uploaded documents, saved URLs, or notebook entries
2. Check that the database tables exist and have data
3. Ensure your Supabase connection is working

### **If the feature isn't working:**
1. Check that the development server is running
2. Verify all API routes are accessible
3. Check browser console for error messages
4. Ensure your OpenAI API key is valid

## Future Enhancements

- **Semantic Search**: Find most relevant content chunks for specific questions
- **Source Highlighting**: Visual indicators showing which sources were used
- **Context Summarization**: AI-generated summaries of available context
- **Source Filtering**: Filter by date, type, or tags
- **Context Memory**: Remember which sources were useful for follow-up questions
- **Export Context**: Save context used for specific conversations

## API Reference

### **POST /api/chat**
Enhanced to accept source selection:

```json
{
  "message": "Your question here",
  "sessionId": "uuid",
  "systemPrompt": "Custom system prompt",
  "model": "gpt-3.5-turbo",
  "temperature": 0.7,
  "maxTokens": 2000,
  "selectedSources": {
    "documents": true,
    "urls": true,
    "notebook": true
  }
}
```

The AI will now provide more personalized, context-aware responses based on your knowledge base! 