// Chat Types
export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata?: {
    sources?: string[]
    model?: string
    tokens?: number
  }
}

export interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
  systemPrompt?: string
}

// Document Types
export interface Document {
  id: string
  name: string
  type: 'pdf' | 'docx' | 'txt'
  size: number
  uploadedAt: Date
  processed: boolean
  content?: string
  embeddings?: number[]
  metadata?: {
    pages?: number
    author?: string
    summary?: string
  }
}

// AI Provider Types
export interface AIProvider {
  id: string
  name: string
  type: 'openai' | 'anthropic' | 'mistral' | 'local'
  apiKey?: string
  baseUrl?: string
  models: string[]
  enabled: boolean
}

// Workflow Types
export interface Workflow {
  id: string
  name: string
  description: string
  steps: WorkflowStep[]
  createdAt: Date
  updatedAt: Date
  enabled: boolean
}

export interface WorkflowStep {
  id: string
  type: 'prompt' | 'api_call' | 'condition' | 'loop'
  name: string
  config: Record<string, any>
  order: number
}

// Prompt Template Types
export interface PromptTemplate {
  id: string
  name: string
  description: string
  prompt: string
  variables: string[]
  category: string
  createdAt: Date
  updatedAt: Date
}

// Web Source Types
export interface WebSource {
  id: string
  url: string
  title: string
  content: string
  scrapedAt: Date
  metadata?: {
    author?: string
    publishedAt?: Date
    tags?: string[]
  }
}

// YouTube Types
export interface YouTubeVideo {
  id: string
  url: string
  title: string
  description: string
  transcript: string
  duration: number
  uploadedAt: Date
  processedAt: Date
}

// Notebook Types
export interface NotebookEntry {
  id: string
  title: string
  content: string
  type: 'note' | 'summary' | 'idea' | 'task'
  tags: string[]
  createdAt: Date
  updatedAt: Date
  relatedChatId?: string
  relatedDocumentId?: string
}

// Settings Types
export interface AppSettings {
  defaultProvider: string
  systemPrompt: string
  maxTokens: number
  temperature: number
  enableStreaming: boolean
  autoSave: boolean
  theme: 'light' | 'dark' | 'auto'
}

// API Response Types
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Chat Stream Types
export interface ChatStreamChunk {
  type: 'content' | 'done' | 'error'
  content?: string
  error?: string
}

// File Upload Types
export interface FileUpload {
  id: string
  file: File
  progress: number
  status: 'uploading' | 'processing' | 'completed' | 'error'
  error?: string
}

// Agent Types
export interface AIAgent {
  id: string
  name: string
  description: string
  systemPrompt: string
  capabilities: string[]
  workflows: string[]
  createdAt: Date
  updatedAt: Date
  enabled: boolean
} 