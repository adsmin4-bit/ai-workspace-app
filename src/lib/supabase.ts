import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database table names
export const TABLES = {
  CHAT_SESSIONS: 'chat_sessions',
  MESSAGES: 'messages',
  DOCUMENTS: 'documents',
  NOTEBOOK_ENTRIES: 'notebook_entries',
  PROMPT_TEMPLATES: 'prompt_templates',
  WORKFLOWS: 'workflows',
  WEB_SOURCES: 'web_sources',
  YOUTUBE_VIDEOS: 'youtube_videos',
  AI_AGENTS: 'ai_agents',
  SETTINGS: 'settings',
} as const

// Database schema types
export interface Database {
  public: {
    Tables: {
      chat_sessions: {
        Row: {
          id: string
          title: string
          system_prompt: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          system_prompt?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          system_prompt?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          chat_session_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          metadata: any
          created_at: string
        }
        Insert: {
          id?: string
          chat_session_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          metadata?: any
          created_at?: string
        }
        Update: {
          id?: string
          chat_session_id?: string
          role?: 'user' | 'assistant' | 'system'
          content?: string
          metadata?: any
          created_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          name: string
          type: 'pdf' | 'docx' | 'txt'
          size: number
          content: string | null
          embeddings: number[] | null
          metadata: any
          processed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          type: 'pdf' | 'docx' | 'txt'
          size: number
          content?: string | null
          embeddings?: number[] | null
          metadata?: any
          processed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: 'pdf' | 'docx' | 'txt'
          size?: number
          content?: string | null
          embeddings?: number[] | null
          metadata?: any
          processed?: boolean
          created_at?: string
        }
      }
      notebook_entries: {
        Row: {
          id: string
          title: string
          content: string
          type: 'note' | 'summary' | 'idea' | 'task'
          tags: string[]
          related_chat_id: string | null
          related_document_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          type: 'note' | 'summary' | 'idea' | 'task'
          tags?: string[]
          related_chat_id?: string | null
          related_document_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          type?: 'note' | 'summary' | 'idea' | 'task'
          tags?: string[]
          related_chat_id?: string | null
          related_document_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      prompt_templates: {
        Row: {
          id: string
          name: string
          description: string
          prompt: string
          variables: string[]
          category: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          prompt: string
          variables?: string[]
          category: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          prompt?: string
          variables?: string[]
          category?: string
          created_at?: string
          updated_at?: string
        }
      }
      workflows: {
        Row: {
          id: string
          name: string
          description: string
          steps: any
          enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          steps: any
          enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          steps?: any
          enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      web_sources: {
        Row: {
          id: string
          url: string
          title: string
          content: string
          metadata: any
          created_at: string
        }
        Insert: {
          id?: string
          url: string
          title: string
          content: string
          metadata?: any
          created_at?: string
        }
        Update: {
          id?: string
          url?: string
          title?: string
          content?: string
          metadata?: any
          created_at?: string
        }
      }
      youtube_videos: {
        Row: {
          id: string
          url: string
          title: string
          description: string
          transcript: string
          duration: number
          metadata: any
          created_at: string
        }
        Insert: {
          id?: string
          url: string
          title: string
          description: string
          transcript: string
          duration: number
          metadata?: any
          created_at?: string
        }
        Update: {
          id?: string
          url?: string
          title?: string
          description?: string
          transcript?: string
          duration?: number
          metadata?: any
          created_at?: string
        }
      }
      ai_agents: {
        Row: {
          id: string
          name: string
          description: string
          system_prompt: string
          capabilities: string[]
          workflows: string[]
          enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          system_prompt: string
          capabilities?: string[]
          workflows?: string[]
          enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          system_prompt?: string
          capabilities?: string[]
          workflows?: string[]
          enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      settings: {
        Row: {
          id: string
          key: string
          value: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: any
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

// Helper functions for database operations
export const db = {
  // Chat sessions
  async createChatSession(title: string, systemPrompt?: string) {
    const { data, error } = await supabase
      .from(TABLES.CHAT_SESSIONS)
      .insert({
        title,
        system_prompt: systemPrompt,
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getChatSessions() {
    const { data, error } = await supabase
      .from(TABLES.CHAT_SESSIONS)
      .select('*')
      .order('updated_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async getChatSession(id: string) {
    const { data, error } = await supabase
      .from(TABLES.CHAT_SESSIONS)
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  // Messages
  async addMessage(chatSessionId: string, role: 'user' | 'assistant' | 'system', content: string, metadata?: any) {
    const { data, error } = await supabase
      .from(TABLES.MESSAGES)
      .insert({
        chat_session_id: chatSessionId,
        role,
        content,
        metadata,
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getMessages(chatSessionId: string) {
    const { data, error } = await supabase
      .from(TABLES.MESSAGES)
      .select('*')
      .eq('chat_session_id', chatSessionId)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    return data
  },

  // Documents
  async createDocument(document: Omit<Database['public']['Tables']['documents']['Insert'], 'id'>) {
    const { data, error } = await supabase
      .from(TABLES.DOCUMENTS)
      .insert(document)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getDocuments() {
    const { data, error } = await supabase
      .from(TABLES.DOCUMENTS)
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Notebook entries
  async createNotebookEntry(entry: Omit<Database['public']['Tables']['notebook_entries']['Insert'], 'id'>) {
    const { data, error } = await supabase
      .from(TABLES.NOTEBOOK_ENTRIES)
      .insert(entry)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getNotebookEntries() {
    const { data, error } = await supabase
      .from(TABLES.NOTEBOOK_ENTRIES)
      .select('*')
      .order('updated_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Settings
  async getSetting(key: string) {
    const { data, error } = await supabase
      .from(TABLES.SETTINGS)
      .select('value')
      .eq('key', key)
      .single()
    
    if (error) return null
    return data?.value
  },

  async setSetting(key: string, value: any) {
    const { data, error } = await supabase
      .from(TABLES.SETTINGS)
      .upsert({ key, value })
      .select()
      .single()
    
    if (error) throw error
    return data
  },
} 