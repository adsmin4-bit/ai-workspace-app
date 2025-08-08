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
    contextChunks?: ContextChunk[]
    similarityScores?: { [sourceId: string]: number }
  }
}

export interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
  systemPrompt?: string
  selectedFolders?: string[] // Array of folder IDs for this session
  includeAllSources?: boolean // Whether to include all sources or only selected folders
}

export interface Folder {
  id: string
  name: string
  type: 'urls' | 'documents' | 'notes' | 'mixed'
  description?: string
  color: string
  includeInContext: boolean
  createdAt: Date
  updatedAt: Date
  itemCount?: number
}

// Document Types
export interface Document {
  id: string
  name: string
  type: 'pdf' | 'docx' | 'txt'
  size: number
  uploadedAt: string | Date
  processed: boolean
  content?: string
  embeddings?: number[]
  folderId?: string
  includeInMemory?: boolean // Toggle for AI memory inclusion
  contextWeight?: number // Context weight (0-100)
  tags?: string[] // Auto-generated topic tags
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

// Source URL Types
export interface SourceUrl {
  id: string
  topic: string
  url: string
  title?: string
  folderId?: string
  includeInMemory?: boolean // Toggle for AI memory inclusion
  contextWeight?: number // Context weight (0-100)
  tags?: string[] // Auto-generated topic tags
  createdAt: string | Date
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
  tags?: string[] // Auto-generated topic tags
}

// Notebook Types
export interface NotebookEntry {
  id: string
  title: string
  content: string
  type: 'note' | 'summary' | 'idea' | 'task'
  tags: string[]
  createdAt: string | Date
  updatedAt: string | Date
  relatedChatId?: string
  relatedDocumentId?: string
  folderId?: string
  includeInMemory?: boolean // Toggle for AI memory inclusion
  contextWeight?: number // Context weight (0-100)
  metadata?: {
    source?: string
    session_id?: string
    user_message?: string
    timestamp?: string
    auto_saved?: boolean
  }
}

// NEW: Summary interface for AI-generated summaries
export interface Summary {
  id: string
  sourceId: string
  sourceType: 'document' | 'url' | 'youtube' | 'notebook'
  summary: string
  wordCount?: number
  generatedAt: Date
  modelUsed?: string
  metadata?: {
    source_title?: string
    source_url?: string
    generation_time?: number
    [key: string]: any
  }
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
  type: 'content' | 'done' | 'error' | 'metadata'
  content?: string
  error?: string
  metadata?: {
    usedSources: string[]
    contextChunkCount: number
    contextChunks: ContextChunk[]
    selectedFolders: string[]
    includeAllSources: boolean
    folderFiltered: boolean
    similarityScores?: { [sourceId: string]: number }
  }
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

export interface FolderWithItems extends Folder {
  documents?: Document[]
  urls?: SourceUrl[]
  notes?: NotebookEntry[]
}

export interface SelectedFolders {
  [folderId: string]: boolean
}

// RAG Context Chunks
export interface ContextChunk {
  id: string
  content: string
  metadata?: {
    document_id?: string
    url_id?: string
    notebook_id?: string
    source_type?: 'document' | 'url' | 'notebook' | 'chat'
    title?: string
    url?: string
    tags?: string[]
    created_at?: string
    folder_id?: string
    include_in_memory?: boolean
    context_weight?: number
    [key: string]: any
  }
  embedding?: number[]
  similarity?: number
  contextWeight?: number
  folderName?: string
  createdAt: string | Date
}

export interface ContextSearchResult {
  id: string
  content: string
  metadata?: ContextChunk['metadata']
  similarity: number
  contextWeight: number
  folderName?: string
}

export interface ContextSearchRequest {
  prompt: string
  limit?: number
  threshold?: number
  sourceTypes?: string[]
  selectedFolders?: string[]
  includeAllSources?: boolean
}

export interface ContextSearchResponse {
  success: boolean
  data?: ContextSearchResult[]
  error?: string
}

// New interfaces for folder picker and memory controls
export interface FolderPickerProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (selectedFolders: string[], includeAllSources: boolean) => void
  currentSelection?: {
    selectedFolders: string[]
    includeAllSources: boolean
  }
}

export interface MemoryToggleProps {
  itemId: string
  itemType: 'document' | 'notebook' | 'url'
  isEnabled: boolean
  onToggle: (enabled: boolean) => void
  size?: 'sm' | 'md' | 'lg'
}

// NEW: Summary generation props
export interface SummaryGeneratorProps {
  sourceId: string
  sourceType: 'document' | 'url' | 'youtube' | 'notebook'
  sourceTitle: string
  sourceContent: string
  onSummaryGenerated?: (summary: Summary) => void
  size?: 'sm' | 'md' | 'lg'
}

// NEW: Context viewer props
export interface ContextViewerProps {
  isOpen: boolean
  onClose: () => void
  contextChunks: ContextChunk[]
  sources: {
    documents: Document[]
    urls: SourceUrl[]
    notebook: NotebookEntry[]
  }
  similarityScores?: { [sourceId: string]: number }
}

export interface ChatSessionConfig {
  selectedFolders: string[]
  includeAllSources: boolean
  systemPrompt?: string
}

export interface SourceItem {
  id: string
  type: 'document' | 'url' | 'notebook'
  title: string
  content?: string
  includeInMemory: boolean
  contextWeight: number
  folderId?: string
  folderName?: string
  tags?: string[]
  createdAt: string | Date
}

export interface FolderManagerProps {
  isOpen: boolean
  onClose: () => void
  onFolderCreated?: (folder: Folder) => void
  onFolderUpdated?: (folder: Folder) => void
  onFolderDeleted?: (folderId: string) => void
}

export interface DragDropContext {
  draggedItem?: SourceItem
  targetFolder?: Folder
  isDragging: boolean
}

export interface ContextWeightSliderProps {
  itemId: string
  itemType: 'document' | 'notebook' | 'url'
  weight: number
  onWeightChange: (weight: number) => void
  size?: 'sm' | 'md' | 'lg'
} 