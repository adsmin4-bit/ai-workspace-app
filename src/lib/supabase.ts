import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
})

export interface Database {
  public: {
    Tables: {
      chat_sessions: {
        Row: {
          id: string // UUID
          title: string
          system_prompt: string | null
          selected_folders: string[] | null // Array of folder IDs
          include_all_sources: boolean
          owner_id: string // UUID
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string // UUID
          title: string
          system_prompt?: string | null
          selected_folders?: string[] | null
          include_all_sources?: boolean
          owner_id: string // UUID
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string // UUID
          title?: string
          system_prompt?: string | null
          selected_folders?: string[] | null
          include_all_sources?: boolean
          owner_id?: string // UUID
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string // UUID
          chat_session_id: string // UUID
          role: 'user' | 'assistant' | 'system'
          content: string
          metadata: any
          owner_id: string // UUID
          created_at: string
        }
        Insert: {
          id?: string // UUID
          chat_session_id: string // UUID
          role: 'user' | 'assistant' | 'system'
          content: string
          metadata?: any
          owner_id: string // UUID
          created_at?: string
        }
        Update: {
          id?: string // UUID
          chat_session_id?: string // UUID
          role?: 'user' | 'assistant' | 'system'
          content?: string
          metadata?: any
          owner_id?: string // UUID
          created_at?: string
        }
      }
      documents: {
        Row: {
          id: string // UUID
          name: string
          type: 'pdf' | 'docx' | 'txt'
          size: number
          content: string | null
          embeddings: number[] | null
          metadata: any
          processed: boolean
          include_in_memory: boolean
          folder_id: string | null // UUID
          context_weight: number
          tags: string[]
          owner_id: string // UUID
          created_at: string
        }
        Insert: {
          id?: string // UUID
          name: string
          type: 'pdf' | 'docx' | 'txt'
          size: number
          content?: string | null
          embeddings?: number[] | null
          metadata?: any
          processed?: boolean
          include_in_memory?: boolean
          folder_id?: string | null // UUID
          context_weight?: number
          tags?: string[]
          owner_id: string // UUID
          created_at?: string
        }
        Update: {
          id?: string // UUID
          name?: string
          type?: 'pdf' | 'docx' | 'txt'
          size?: number
          content?: string | null
          embeddings?: number[] | null
          metadata?: any
          processed?: boolean
          include_in_memory?: boolean
          folder_id?: string | null // UUID
          context_weight?: number
          tags?: string[]
          owner_id?: string // UUID
          created_at?: string
        }
      }
      notebook_entries: {
        Row: {
          id: string // UUID
          title: string
          content: string
          type: 'note' | 'summary' | 'idea' | 'task'
          tags: string[]
          related_chat_id: string | null // UUID
          related_document_id: string | null // UUID
          include_in_memory: boolean
          folder_id: string | null // UUID
          context_weight: number
          owner_id: string // UUID
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string // UUID
          title: string
          content: string
          type: 'note' | 'summary' | 'idea' | 'task'
          tags?: string[]
          related_chat_id?: string | null // UUID
          related_document_id?: string | null // UUID
          include_in_memory?: boolean
          folder_id?: string | null // UUID
          context_weight?: number
          owner_id: string // UUID
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string // UUID
          title?: string
          content?: string
          type?: 'note' | 'summary' | 'idea' | 'task'
          tags?: string[]
          related_chat_id?: string | null // UUID
          related_document_id?: string | null // UUID
          include_in_memory?: boolean
          folder_id?: string | null // UUID
          context_weight?: number
          owner_id?: string // UUID
          created_at?: string
          updated_at?: string
        }
      }
      prompt_templates: {
        Row: {
          id: string // UUID
          name: string
          description: string
          prompt: string
          variables: string[]
          category: string
          owner_id: string // UUID
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string // UUID
          name: string
          description: string
          prompt: string
          variables?: string[]
          category: string
          owner_id: string // UUID
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string // UUID
          name?: string
          description?: string
          prompt?: string
          variables?: string[]
          category?: string
          owner_id?: string // UUID
          created_at?: string
          updated_at?: string
        }
      }
      workflows: {
        Row: {
          id: string // UUID
          name: string
          description: string
          steps: any
          enabled: boolean
          owner_id: string // UUID
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string // UUID
          name: string
          description: string
          steps: any
          enabled?: boolean
          owner_id: string // UUID
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string // UUID
          name?: string
          description?: string
          steps?: any
          enabled?: boolean
          owner_id?: string // UUID
          created_at?: string
          updated_at?: string
        }
      }
      workflow_runs: {
        Row: {
          id: string // UUID
          workflow_id: string // UUID
          name: string
          status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
          input_params: any
          output_result: any
          logs: string[]
          started_at: string
          completed_at: string | null
          owner_id: string // UUID
          created_at: string
        }
        Insert: {
          id?: string // UUID
          workflow_id: string // UUID
          name: string
          status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
          input_params?: any
          output_result?: any
          logs?: string[]
          started_at?: string
          completed_at?: string | null
          owner_id: string // UUID
          created_at?: string
        }
        Update: {
          id?: string // UUID
          workflow_id?: string // UUID
          name?: string
          status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
          input_params?: any
          output_result?: any
          logs?: string[]
          started_at?: string
          completed_at?: string | null
          owner_id?: string // UUID
          created_at?: string
        }
      }
      web_sources: {
        Row: {
          id: string // UUID
          url: string
          title: string
          content: string
          metadata: any
          tags: string[]
          owner_id: string // UUID
          created_at: string
        }
        Insert: {
          id?: string // UUID
          url: string
          title: string
          content: string
          metadata?: any
          tags?: string[]
          owner_id: string // UUID
          created_at?: string
        }
        Update: {
          id?: string // UUID
          url?: string
          title?: string
          content?: string
          metadata?: any
          tags?: string[]
          owner_id?: string // UUID
          created_at?: string
        }
      }
      youtube_videos: {
        Row: {
          id: string // UUID
          url: string
          title: string
          description: string
          transcript: string
          duration: number
          metadata: any
          tags: string[]
          include_in_memory: boolean
          folder_id: string | null // UUID
          context_weight: number
          owner_id: string // UUID
          created_at: string
        }
        Insert: {
          id?: string // UUID
          url: string
          title: string
          description: string
          transcript: string
          duration: number
          metadata?: any
          tags?: string[]
          include_in_memory?: boolean
          folder_id?: string | null // UUID
          context_weight?: number
          owner_id: string // UUID
          created_at?: string
        }
        Update: {
          id?: string // UUID
          url?: string
          title?: string
          description?: string
          transcript?: string
          duration?: number
          metadata?: any
          tags?: string[]
          include_in_memory?: boolean
          folder_id?: string | null // UUID
          context_weight?: number
          owner_id?: string // UUID
          created_at?: string
        }
      }
      ai_agents: {
        Row: {
          id: string // UUID
          name: string
          description: string
          system_prompt: string
          capabilities: string[]
          workflows: string[]
          enabled: boolean
          owner_id: string // UUID
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string // UUID
          name: string
          description: string
          system_prompt: string
          capabilities?: string[]
          workflows?: string[]
          enabled?: boolean
          owner_id: string // UUID
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string // UUID
          name?: string
          description?: string
          system_prompt?: string
          capabilities?: string[]
          workflows?: string[]
          enabled?: boolean
          owner_id?: string // UUID
          created_at?: string
          updated_at?: string
        }
      }
      settings: {
        Row: {
          id: string // UUID
          key: string
          value: any
          owner_id: string // UUID
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string // UUID
          key: string
          value: any
          owner_id: string // UUID
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string // UUID
          key?: string
          value?: any
          owner_id?: string // UUID
          created_at?: string
          updated_at?: string
        }
      }
      source_urls: {
        Row: {
          id: string // UUID
          topic: string
          url: string
          title: string | null
          include_in_memory: boolean
          folder_id: string | null // UUID
          context_weight: number
          tags: string[]
          owner_id: string // UUID
          created_at: string
        }
        Insert: {
          id?: string // UUID
          topic: string
          url: string
          title?: string | null
          include_in_memory?: boolean
          folder_id?: string | null // UUID
          context_weight?: number
          tags?: string[]
          owner_id: string // UUID
          created_at?: string
        }
        Update: {
          id?: string // UUID
          topic?: string
          url?: string
          title?: string | null
          include_in_memory?: boolean
          folder_id?: string | null // UUID
          context_weight?: number
          tags?: string[]
          owner_id?: string // UUID
          created_at?: string
        }
      }
      folders: {
        Row: {
          id: string // UUID
          name: string
          type: 'urls' | 'documents' | 'notes' | 'mixed'
          description: string | null
          color: string
          include_in_context: boolean
          owner_id: string // UUID
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string // UUID
          name: string
          type: 'urls' | 'documents' | 'notes' | 'mixed'
          description?: string | null
          color?: string
          include_in_context?: boolean
          owner_id: string // UUID
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string // UUID
          name?: string
          type?: 'urls' | 'documents' | 'notes' | 'mixed'
          description?: string | null
          color?: string
          include_in_context?: boolean
          owner_id?: string // UUID
          created_at?: string
          updated_at?: string
        }
      }
      context_chunks: {
        Row: {
          id: string // UUID
          content: string
          metadata: any
          embedding: number[]
          context_weight: number
          owner_id: string // UUID
          created_at: string
        }
        Insert: {
          id?: string // UUID
          content: string
          metadata?: any
          embedding?: number[]
          context_weight?: number
          owner_id: string // UUID
          created_at?: string
        }
        Update: {
          id?: string // UUID
          content?: string
          metadata?: any
          embedding?: number[]
          context_weight?: number
          owner_id?: string // UUID
          created_at?: string
        }
      }
      summaries: {
        Row: {
          id: string // UUID
          source_id: string // UUID
          source_type: 'document' | 'url' | 'youtube' | 'notebook'
          summary: string
          word_count: number | null
          generated_at: string
          model_used: string
          metadata: any
          owner_id: string // UUID
          created_at: string
        }
        Insert: {
          id?: string // UUID
          source_id: string // UUID
          source_type: 'document' | 'url' | 'youtube' | 'notebook'
          summary: string
          word_count?: number | null
          generated_at?: string
          model_used?: string
          metadata?: any
          owner_id: string // UUID
          created_at?: string
        }
        Update: {
          id?: string // UUID
          source_id?: string // UUID
          source_type?: 'document' | 'url' | 'youtube' | 'notebook'
          summary?: string
          word_count?: number | null
          generated_at?: string
          model_used?: string
          metadata?: any
          owner_id?: string // UUID
          created_at?: string
        }
      }
      chat_sources: {
        Row: {
          id: string // UUID
          type: 'document' | 'notebook' | 'url' | 'youtube'
          source_id: string // UUID
          name: string
          selected: boolean
          owner_id: string // UUID
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string // UUID
          type: 'document' | 'notebook' | 'url' | 'youtube'
          source_id: string // UUID
          name: string
          selected?: boolean
          owner_id: string // UUID
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string // UUID
          type?: 'document' | 'notebook' | 'url' | 'youtube'
          source_id?: string // UUID
          name?: string
          selected?: boolean
          owner_id?: string // UUID
          created_at?: string
          updated_at?: string
        }
      }
      chat_memory: {
        Row: {
          id: string // UUID
          session_id: string // UUID
          user_id: string // UUID
          role: 'user' | 'assistant'
          content: string
          embedding: number[] | null
          created_at: string
        }
        Insert: {
          id?: string // UUID
          session_id: string // UUID
          user_id: string // UUID
          role: 'user' | 'assistant'
          content: string
          embedding?: number[] | null
          created_at?: string
        }
        Update: {
          id?: string // UUID
          session_id?: string // UUID
          user_id?: string // UUID
          role?: 'user' | 'assistant'
          content?: string
          embedding?: number[] | null
          created_at?: string
        }
      }
    }
  }
}

class DatabaseOperations {
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    if (!user) throw new Error('User not authenticated')
    return user
  }

  async createChatSession(title: string, systemPrompt?: string, selectedFolders?: string[], includeAllSources?: boolean) {
    const user = await this.getCurrentUser()
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({
        title,
        system_prompt: systemPrompt,
        selected_folders: selectedFolders,
        include_all_sources: includeAllSources,
        owner_id: user.id
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getChatSessions() {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  async getChatSession(id: string) {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async addMessage(chatSessionId: string, role: 'user' | 'assistant' | 'system', content: string, metadata?: any) {
    const user = await this.getCurrentUser()
    const { data, error } = await supabase
      .from('messages')
      .insert({
        chat_session_id: chatSessionId,
        role,
        content,
        metadata,
        owner_id: user.id
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getMessages(chatSessionId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_session_id', chatSessionId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data
  }

  async createFolder(folder: Omit<Database['public']['Tables']['folders']['Insert'], 'id'>) {
    const user = await this.getCurrentUser()
    const { data, error } = await supabase
      .from('folders')
      .insert({
        ...folder,
        owner_id: user.id
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getFolders(type?: 'urls' | 'documents' | 'notes') {
    let query = supabase
      .from('folders')
      .select('*')
      .order('created_at', { ascending: false })

    if (type) {
      query = query.eq('type', type)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  }

  async getFolder(id: string) {
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async updateFolder(id: string, updates: Partial<Database['public']['Tables']['folders']['Update']>) {
    const { data, error } = await supabase
      .from('folders')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteFolder(id: string) {
    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  async getFolderWithItems(id: string) {
    const { data, error } = await supabase
      .from('folders')
      .select(`
        *,
        documents:documents(*),
        notebook_entries:notebook_entries(*),
        source_urls:source_urls(*)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async createDocument(document: Omit<Database['public']['Tables']['documents']['Insert'], 'id'>) {
    const user = await this.getCurrentUser()
    const { data, error } = await supabase
      .from('documents')
      .insert({
        ...document,
        owner_id: user.id
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getDocuments(folderId?: string) {
    let query = supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false })

    if (folderId) {
      query = query.eq('folder_id', folderId)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  }

  async updateDocument(id: string, updates: Partial<Database['public']['Tables']['documents']['Update']>) {
    const { data, error } = await supabase
      .from('documents')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getDocument(id: string) {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async createNotebookEntry(entry: Omit<Database['public']['Tables']['notebook_entries']['Insert'], 'id'>) {
    const user = await this.getCurrentUser()
    const { data, error } = await supabase
      .from('notebook_entries')
      .insert({
        ...entry,
        owner_id: user.id
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getNotebookEntries(folderId?: string) {
    let query = supabase
      .from('notebook_entries')
      .select('*')
      .order('created_at', { ascending: false })

    if (folderId) {
      query = query.eq('folder_id', folderId)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  }

  async updateNotebookEntry(id: string, updates: Partial<Database['public']['Tables']['notebook_entries']['Update']>) {
    const { data, error } = await supabase
      .from('notebook_entries')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async createSourceUrl(sourceUrl: Omit<Database['public']['Tables']['source_urls']['Insert'], 'id'>) {
    const user = await this.getCurrentUser()
    const { data, error } = await supabase
      .from('source_urls')
      .insert({
        ...sourceUrl,
        owner_id: user.id
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getSourceUrls(folderId?: string) {
    let query = supabase
      .from('source_urls')
      .select('*')
      .order('created_at', { ascending: false })

    if (folderId) {
      query = query.eq('folder_id', folderId)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  }

  async updateSourceUrl(id: string, updates: Partial<Database['public']['Tables']['source_urls']['Update']>) {
    const { data, error } = await supabase
      .from('source_urls')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getWebSource(id: string) {
    const { data, error } = await supabase
      .from('web_sources')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async getYouTubeVideo(id: string) {
    const { data, error } = await supabase
      .from('youtube_videos')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async getSetting(key: string) {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', key)
      .single()

    if (error) throw error
    return data?.value
  }

  async setSetting(key: string, value: any) {
    const user = await this.getCurrentUser()
    const { data, error } = await supabase
      .from('settings')
      .upsert({
        key,
        value,
        owner_id: user.id
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async saveContextChunk(content: string, metadata?: any, embedding?: number[]) {
    const user = await this.getCurrentUser()
    const { data, error } = await supabase
      .from('context_chunks')
      .insert({
        content,
        metadata,
        embedding,
        owner_id: user.id
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async queryContextChunks(embedding: number[], limit: number = 5, threshold: number = 0.7) {
    const { data, error } = await supabase
      .rpc('match_documents', {
        query_embedding: embedding,
        match_threshold: threshold,
        match_count: limit
      })

    if (error) throw error
    return data
  }

  async deleteContextChunksByMetadata(metadataFilter: any) {
    const { error } = await supabase
      .from('context_chunks')
      .delete()
      .eq('metadata', metadataFilter)

    if (error) throw error
  }

  async getContextChunksByMetadata(metadataFilter: any) {
    const { data, error } = await supabase
      .from('context_chunks')
      .select('*')
      .eq('metadata', metadataFilter)

    if (error) throw error
    return data
  }

  async createSummary(summary: Omit<Database['public']['Tables']['summaries']['Insert'], 'id'>) {
    const user = await this.getCurrentUser()
    const { data, error } = await supabase
      .from('summaries')
      .insert({
        ...summary,
        owner_id: user.id
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getSummary(sourceId: string, sourceType: 'document' | 'url' | 'youtube' | 'notebook') {
    const { data, error } = await supabase
      .from('summaries')
      .select('*')
      .eq('source_id', sourceId)
      .eq('source_type', sourceType)
      .single()

    if (error) throw error
    return data
  }

  async updateSummary(id: string, updates: Partial<Database['public']['Tables']['summaries']['Update']>) {
    const { data, error } = await supabase
      .from('summaries')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteSummary(id: string) {
    const { error } = await supabase
      .from('summaries')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  async getSummariesBySourceType(sourceType: 'document' | 'url' | 'youtube' | 'notebook') {
    const { data, error } = await supabase
      .from('summaries')
      .select('*')
      .eq('source_type', sourceType)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  // New methods for YouTube videos
  async createYouTubeVideo(video: Omit<Database['public']['Tables']['youtube_videos']['Insert'], 'id'>) {
    const user = await this.getCurrentUser()
    const { data, error } = await supabase
      .from('youtube_videos')
      .insert({
        ...video,
        owner_id: user.id
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getYouTubeVideos(folderId?: string) {
    let query = supabase
      .from('youtube_videos')
      .select('*')
      .order('created_at', { ascending: false })

    if (folderId) {
      query = query.eq('folder_id', folderId)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  }

  async updateYouTubeVideo(id: string, updates: Partial<Database['public']['Tables']['youtube_videos']['Update']>) {
    const { data, error } = await supabase
      .from('youtube_videos')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // New methods for workflow runs
  async createWorkflowRun(run: Omit<Database['public']['Tables']['workflow_runs']['Insert'], 'id'>) {
    const user = await this.getCurrentUser()
    const { data, error } = await supabase
      .from('workflow_runs')
      .insert({
        ...run,
        owner_id: user.id
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getWorkflowRuns(workflowId?: string) {
    let query = supabase
      .from('workflow_runs')
      .select('*')
      .order('created_at', { ascending: false })

    if (workflowId) {
      query = query.eq('workflow_id', workflowId)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  }

  async updateWorkflowRun(id: string, updates: Partial<Database['public']['Tables']['workflow_runs']['Update']>) {
    const { data, error } = await supabase
      .from('workflow_runs')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // AI Agents operations
  async createAgent(agent: Omit<Database['public']['Tables']['ai_agents']['Insert'], 'id' | 'owner_id'>) {
    const user = await this.getCurrentUser()
    const { data, error } = await supabase
      .from('ai_agents')
      .insert({
        ...agent,
        owner_id: user.id
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getAgents() {
    const { data, error } = await supabase
      .from('ai_agents')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  async getAgent(id: string) {
    const { data, error } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async updateAgent(id: string, updates: Partial<Database['public']['Tables']['ai_agents']['Update']>) {
    const { data, error } = await supabase
      .from('ai_agents')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteAgent(id: string) {
    const { error } = await supabase
      .from('ai_agents')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // Chat sources operations
  async createChatSource(chatSource: Omit<Database['public']['Tables']['chat_sources']['Insert'], 'id' | 'owner_id'>) {
    const user = await this.getCurrentUser()
    const { data, error } = await supabase
      .from('chat_sources')
      .insert({
        ...chatSource,
        owner_id: user.id
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getChatSources() {
    const { data, error } = await supabase
      .from('chat_sources')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  async updateChatSource(id: string, updates: Partial<Database['public']['Tables']['chat_sources']['Update']>) {
    const { data, error } = await supabase
      .from('chat_sources')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getSelectedChatSources() {
    const { data, error } = await supabase
      .from('chat_sources')
      .select('*')
      .eq('selected', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  async deleteChatSource(id: string) {
    const { error } = await supabase
      .from('chat_sources')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // Helper function to create chat source entry
  async createChatSourceForContent(type: 'document' | 'notebook' | 'url' | 'youtube', sourceId: string, name: string) {
    const user = await this.getCurrentUser()
    const { data, error } = await supabase
      .from('chat_sources')
      .insert({
        type,
        source_id: sourceId,
        name,
        selected: true,
        owner_id: user.id
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Chat Memory Operations
  async saveChatMemory(sessionId: string, role: 'user' | 'assistant', content: string, embedding?: number[]) {
    const user = await this.getCurrentUser()
    const { data, error } = await supabase
      .from('chat_memory')
      .insert({
        session_id: sessionId,
        user_id: user.id,
        role,
        content,
        embedding
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getChatMemory(sessionId: string, limit: number = 20) {
    const { data, error } = await supabase
      .from('chat_memory')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(limit)

    if (error) throw error
    return data
  }

  async searchChatMemory(queryEmbedding: number[], userId: string, limit: number = 15, threshold: number = 0.7) {
    const { data, error } = await supabase
      .rpc('match_chat_memory_embeddings', {
        query_embedding: queryEmbedding,
        match_threshold: threshold,
        match_count: limit,
        user_id: userId
      })

    if (error) throw error
    return data || []
  }

  async clearChatMemory(sessionId: string) {
    const user = await this.getCurrentUser()
    const { error } = await supabase
      .from('chat_memory')
      .delete()
      .eq('session_id', sessionId)
      .eq('user_id', user.id)

    if (error) throw error
    return { success: true }
  }

  async clearAllChatMemory() {
    const user = await this.getCurrentUser()
    const { error } = await supabase
      .from('chat_memory')
      .delete()
      .eq('user_id', user.id)

    if (error) throw error
    return { success: true }
  }
}

export const db = new DatabaseOperations() 