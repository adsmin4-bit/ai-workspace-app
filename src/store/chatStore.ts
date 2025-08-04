import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Message, ChatSession } from '@/types'

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
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      sessions: [],
      currentSession: null,
      messages: [],

      createNewSession: async (title: string, systemPrompt?: string) => {
        const newSession: ChatSession = {
          id: Date.now().toString(),
          title,
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          systemPrompt,
        }

        set((state) => ({
          sessions: [newSession, ...state.sessions],
          currentSession: newSession,
          messages: [],
        }))

        // Save to database
        try {
          await fetch('/api/chat/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, systemPrompt }),
          })
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