import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Message, ChatSession } from '@/types'
import { v4 as uuidv4 } from 'uuid'

interface ChatState {
  sessions: ChatSession[]
  currentSession: ChatSession | null
  messages: Message[]

  // Actions
  createNewSession: (title: string, systemPrompt?: string) => Promise<void>
  loadSession: (sessionId: string) => void
  deleteSession: (sessionId: string) => void
  updateSessionTitle: (sessionId: string, title: string) => void
  addMessage: (message: Message) => void
  clearMessages: () => void
  setCurrentSession: (session: ChatSession | null) => void
  clearInvalidSessions: () => void
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      sessions: [],
      currentSession: null,
      messages: [],

      createNewSession: async (title: string, systemPrompt?: string) => {
        // Create session in database first
        try {
          const response = await fetch('/api/chat/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, systemPrompt }),
          })

          if (response.ok) {
            const result = await response.json()
            const newSession: ChatSession = {
              id: result.session.id, // Use the database-generated UUID
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
          } else {
            console.error('Failed to create session in database')
          }
        } catch (error) {
          console.error('Failed to save session:', error)
        }
      },

      loadSession: (sessionId: string) => {
        const session = get().sessions.find(s => s.id === sessionId)
        if (session) {
          set({
            currentSession: session,
            messages: session.messages,
          })
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
        if (get().currentSession) {
          fetch('/api/chat/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: get().currentSession!.id,
              role: message.role,
              content: message.content,
              metadata: message.metadata,
            }),
          }).catch(error => {
            console.error('Failed to save message:', error)
          })
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