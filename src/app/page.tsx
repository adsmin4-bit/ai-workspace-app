'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import AuthForm from '@/components/AuthForm'
import ChatInterface from '@/components/ChatInterface'
import DocumentUpload from '@/components/DocumentUpload'
import NotebookPanel from '@/components/NotebookPanel'
import WorkflowPanel from '@/components/WorkflowPanel'
import WebSourcesPanel from '@/components/WebSourcesPanel'
import YouTubePanel from '@/components/YouTubePanel'
import SettingsPanel from '@/components/SettingsPanel'
import AccountPanel from '@/components/AccountPanel'
import FolderManager from '@/components/FolderManager'
import AgentsPanel from '@/components/AgentsPanel'
import { Folder, FileText, BookOpen, Zap, Globe, Youtube, Settings, User, Bot, Loader2 } from 'lucide-react'

type TabType = 'chat' | 'documents' | 'notebook' | 'workflows' | 'agents' | 'web-sources' | 'youtube' | 'settings' | 'account'

export default function Home() {
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('chat')
  const [showFolderManager, setShowFolderManager] = useState(false)

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show authentication form if not signed in
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <AuthForm mode="signin" />
      </div>
    )
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'chat':
        return <ChatInterface />
      case 'documents':
        return <DocumentUpload />
      case 'notebook':
        return <NotebookPanel />
      case 'workflows':
        return <WorkflowPanel />
      case 'agents':
        return <AgentsPanel />
      case 'web-sources':
        return <WebSourcesPanel />
      case 'youtube':
        return <YouTubePanel />
      case 'settings':
        return <SettingsPanel />
      case 'account':
        return <AccountPanel />
      default:
        return <ChatInterface />
    }
  }

  const tabs = [
    { id: 'chat' as TabType, label: 'Chat', icon: <Folder className="w-5 h-5" /> },
    { id: 'documents' as TabType, label: 'Documents', icon: <FileText className="w-5 h-5" /> },
    { id: 'notebook' as TabType, label: 'Notebook', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'workflows' as TabType, label: 'Workflows', icon: <Zap className="w-5 h-5" /> },
    { id: 'agents' as TabType, label: 'Agents', icon: <Bot className="w-5 h-5" /> },
    { id: 'web-sources' as TabType, label: 'Web Sources', icon: <Globe className="w-5 h-5" /> },
    { id: 'youtube' as TabType, label: 'YouTube', icon: <Youtube className="w-5 h-5" /> },
    { id: 'settings' as TabType, label: 'Settings', icon: <Settings className="w-5 h-5" /> },
    { id: 'account' as TabType, label: 'Account', icon: <User className="w-5 h-5" /> },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-900">AI Workspace</h1>
            <button
              onClick={() => setShowFolderManager(true)}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Manage Folders
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              {user.email}
            </span>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <nav className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <div className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  {tab.icon}
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          {renderContent()}
        </main>
      </div>

      {/* Folder Manager Modal */}
      <FolderManager
        isOpen={showFolderManager}
        onClose={() => setShowFolderManager(false)}
      />
    </div>
  )
} 