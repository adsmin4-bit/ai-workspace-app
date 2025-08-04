import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AppSettings, AIProvider } from '@/types'

interface SettingsState {
  settings: AppSettings
  systemPrompt: string
  providers: AIProvider[]
  
  // Actions
  updateSettings: (settings: Partial<AppSettings>) => void
  setSystemPrompt: (prompt: string) => void
  addProvider: (provider: AIProvider) => void
  updateProvider: (id: string, updates: Partial<AIProvider>) => void
  removeProvider: (id: string) => void
  setDefaultProvider: (id: string) => void
}

const defaultSettings: AppSettings = {
  defaultProvider: 'gpt-3.5-turbo',
  systemPrompt: 'You are a helpful AI assistant. You help users with their questions and tasks.',
  maxTokens: 2000,
  temperature: 0.7,
  enableStreaming: true,
  autoSave: true,
  theme: 'light',
}

const defaultProviders: AIProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    type: 'openai',
    models: ['gpt-4', 'gpt-3.5-turbo', 'gpt-4-turbo'],
    enabled: true,
  },
  {
    id: 'anthropic',
    name: 'Claude',
    type: 'anthropic',
    models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
    enabled: false,
  },
  {
    id: 'mistral',
    name: 'Mistral',
    type: 'mistral',
    models: ['mistral-large', 'mistral-medium', 'mistral-small'],
    enabled: false,
  },
]

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      systemPrompt: defaultSettings.systemPrompt,
      providers: defaultProviders,

      updateSettings: (newSettings: Partial<AppSettings>) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }))
      },

      setSystemPrompt: (prompt: string) => {
        set({ systemPrompt: prompt })
      },

      addProvider: (provider: AIProvider) => {
        set((state) => ({
          providers: [...state.providers, provider],
        }))
      },

      updateProvider: (id: string, updates: Partial<AIProvider>) => {
        set((state) => ({
          providers: state.providers.map(p =>
            p.id === id ? { ...p, ...updates } : p
          ),
        }))
      },

      removeProvider: (id: string) => {
        set((state) => ({
          providers: state.providers.filter(p => p.id !== id),
        }))
      },

      setDefaultProvider: (id: string) => {
        set((state) => ({
          settings: { ...state.settings, defaultProvider: id },
        }))
      },
    }),
    {
      name: 'settings-storage',
      partialize: (state) => ({
        settings: state.settings,
        systemPrompt: state.systemPrompt,
        providers: state.providers,
      }),
    }
  )
) 