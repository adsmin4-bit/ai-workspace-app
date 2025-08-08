import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ChatSession, Message } from '@/types'

interface ChatState {
  sessions: ChatSession[]
  currentSession: ChatSession | null
  messages: Message[]

  // Memory Context Settings
  useMemoryContext: boolean
  memorySourceTypes: string[]
  selectedSources: {
    documents: boolean
    urls: boolean
    notebook: boolean
  }
  selectedFolders: string[] // New: selected folders for RAG filtering

  // Actions
  createNewSession: (title: string, systemPrompt?: string) => Promise<string>
  loadSession: (sessionId: string) => void
  deleteSession: (sessionId: string) => void
  updateSessionTitle: (sessionId: string, title: string) => void
  addMessage: (message: Message) => void
  clearMessages: () => void
  setCurrentSession: (session: ChatSession | null) => void
  clearInvalidSessions: () => void

  // Memory Context Actions
  setUseMemoryContext: (use: boolean) => void
  setMemorySourceTypes: (types: string[]) => void
  setSelectedSources: (sources: { documents: boolean; urls: boolean; notebook: boolean }) => void
  toggleMemorySourceType: (type: string) => void

  // Folder Selection Actions
  setSelectedFolders: (folders: string[]) => void
  toggleFolder: (folderId: string) => void
  clearSelectedFolders: () => void
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      sessions: [],
      currentSession: null,
      messages: [],

      // Memory Context Settings
      useMemoryContext: true,
      memorySourceTypes: ['document', 'url', 'notebook', 'chat'],
      selectedSources: {
        documents: true,
        urls: true,
        notebook: true
      },
      selectedFolders: [], // New: selected folders for RAG filtering

      createNewSession: async (title: string, systemPrompt?: string) => {
        // Generate UUID for session ID using crypto.randomUUID()
        const sessionId = crypto.randomUUID()

        // Create session in database first
        try {
          console.log('Creating session with title:', title, 'ID:', sessionId)
          const response = await fetch('/api/chat/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, systemPrompt }),
          })

          console.log('Session creation response status:', response.status)

          if (response.ok) {
            const result = await response.json()
            console.log('Session creation result:', result)

            const newSession: ChatSession = {
              id: sessionId, // Use our generated UUID
              title,
              messages: [],
              createdAt: new Date(result.session.created_at),
              updatedAt: new Date(result.session.updated_at),
              systemPrompt,
            }

            set((state) => ({
              sessions: [newSession, ...state.sessions],
              currentSession: newSession,
              messages: [],
            }))

            console.log('Session created successfully with ID:', newSession.id)
            return newSession.id
          } else {
            const errorText = await response.text()
            console.error('Failed to create session in database:', response.status, errorText)
            // Create a temporary session with UUID as fallback
            const tempSession: ChatSession = {
              id: sessionId,
              title,
              messages: [],
              createdAt: new Date(),
              updatedAt: new Date(),
              systemPrompt,
            }
            set((state) => ({
              sessions: [tempSession, ...state.sessions],
              currentSession: tempSession,
              messages: [],
            }))
            return tempSession.id
          }
        } catch (error) {
          console.error('Failed to save session:', error)
          // Create a temporary session with UUID as fallback
          const tempSession: ChatSession = {
            id: sessionId,
            title,
            messages: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            systemPrompt,
          }
          set((state) => ({
            sessions: [tempSession, ...state.sessions],
            currentSession: tempSession,
            messages: [],
          }))
          return tempSession.id
        }
      },

      loadSession: async (sessionId: string) => {
        const session = get().sessions.find(s => s.id === sessionId)
        if (session) {
          // Load messages from database
          try {
            const response = await fetch(`/api/chat/messages?sessionId=${sessionId}`)
            if (response.ok) {
              const result = await response.json()
              const messages = result.messages || []

              // Convert database messages to frontend format
              const formattedMessages = messages.map((msg: any) => ({
                id: msg.id,
                role: msg.role,
                content: msg.content,
                timestamp: new Date(msg.created_at),
                metadata: msg.metadata
              }))

              set({
                currentSession: session,
                messages: formattedMessages,
              })

              // Update session with loaded messages
              set((state) => ({
                sessions: state.sessions.map(s =>
                  s.id === sessionId
                    ? { ...s, messages: formattedMessages, updatedAt: new Date() }
                    : s
                ),
              }))
            } else {
              console.error('Failed to load messages for session:', sessionId)
              set({
                currentSession: session,
                messages: session.messages,
              })
            }
          } catch (error) {
            console.error('Error loading messages:', error)
            set({
              currentSession: session,
              messages: session.messages,
            })
          }
        }
      },

      deleteSession: (sessionId: string) => {
        set((state) => ({
          sessions: state.sessions.filter(s => s.id !== sessionId),
          currentSession: state.currentSession?.id === sessionId ? null : state.currentSession,
          messages: state.currentSession?.id === sessionId ? [] : state.messages,
        }))
      },

      updateSessionTitle: (sessionId: string, title: string) => {
        set((state) => ({
          sessions: state.sessions.map(s =>
            s.id === sessionId ? { ...s, title, updatedAt: new Date() } : s
          ),
          currentSession: state.currentSession?.id === sessionId
            ? { ...state.currentSession, title, updatedAt: new Date() }
            : state.currentSession,
        }))
      },

      addMessage: (message: Message) => {
        set((state) => {
          const newMessages = [...state.messages, message]

          // Update current session
          const updatedSession = state.currentSession
            ? {
              ...state.currentSession,
              messages: newMessages,
              updatedAt: new Date(),
            }
            : null

          // Update sessions list
          const updatedSessions = state.sessions.map(s =>
            s.id === state.currentSession?.id
              ? { ...s, messages: newMessages, updatedAt: new Date() }
              : s
          )

          return {
            messages: newMessages,
            currentSession: updatedSession,
            sessions: updatedSessions,
          }
        })

        // Save message to database
        const currentSession = get().currentSession
        if (currentSession && currentSession.id) {
          const sessionId = currentSession.id
          console.log('Saving message for session ID:', sessionId)

          // Only save if sessionId is a valid UUID
          if (sessionId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            fetch('/api/chat/messages', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sessionId: sessionId,
                role: message.role,
                content: message.content,
                metadata: message.metadata,
              }),
            }).then(response => {
              console.log('Message save response status:', response.status)
              if (!response.ok) {
                return response.text().then(text => {
                  console.error('Message save error:', response.status, text)
                })
              }
            }).catch(error => {
              console.error('Failed to save message:', error)
            })
          } else {
            console.error('Invalid session ID format:', sessionId)
          }
        } else {
          console.error('No current session found when trying to save message')
        }
      },

      clearMessages: () => {
        set({ messages: [] })
      },

      setCurrentSession: (session: ChatSession | null) => {
        set({
          currentSession: session,
          messages: session?.messages || [],
        })
      },

      clearInvalidSessions: () => {
        set((state) => ({
          sessions: state.sessions.filter(session =>
            session.id.length === 36 && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(session.id)
          ),
        }))
      },

      // Memory Context Actions
      setUseMemoryContext: (use: boolean) => {
        set({ useMemoryContext: use })
      },

      setMemorySourceTypes: (types: string[]) => {
        set({ memorySourceTypes: types })
      },

      setSelectedSources: (sources: { documents: boolean; urls: boolean; notebook: boolean }) => {
        set({ selectedSources: sources })
      },

      toggleMemorySourceType: (type: string) => {
        set(state => ({
          memorySourceTypes: state.memorySourceTypes.includes(type)
            ? state.memorySourceTypes.filter(t => t !== type)
            : [...state.memorySourceTypes, type]
        }))
      },

      // Folder Selection Actions
      setSelectedFolders: (folders: string[]) => {
        set({ selectedFolders: folders })
      },

      toggleFolder: (folderId: string) => {
        set(state => ({
          selectedFolders: state.selectedFolders.includes(folderId)
            ? state.selectedFolders.filter(id => id !== folderId)
            : [...state.selectedFolders, folderId]
        }))
      },

      clearSelectedFolders: () => {
        set({ selectedFolders: [] })
      }
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({
        sessions: state.sessions,
        currentSession: state.currentSession,
      }),
    }
  )
) 