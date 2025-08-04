'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  MessageSquare, 
  FileText, 
  Settings, 
  Upload, 
  Brain, 
  Workflow,
  BookOpen,
  Youtube,
  Globe,
  Sparkles
} from 'lucide-react'
import ChatInterface from '@/components/ChatInterface'
import DocumentUpload from '@/components/DocumentUpload'
import SettingsPanel from '@/components/SettingsPanel'
import NotebookPanel from '@/components/NotebookPanel'
import WorkflowPanel from '@/components/WorkflowPanel'
import WebSourcesPanel from '@/components/WebSourcesPanel'
import YouTubePanel from '@/components/YouTubePanel'

type TabType = 'chat' | 'documents' | 'notebook' | 'workflows' | 'web-sources' | 'youtube' | 'settings'

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('chat')

  const tabs = [
    { id: 'chat', label: 'AI Chat', icon: MessageSquare },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'notebook', label: 'Notebook', icon: BookOpen },
    { id: 'workflows', label: 'Workflows', icon: Workflow },
    { id: 'web-sources', label: 'Web Sources', icon: Globe },
    { id: 'youtube', label: 'YouTube', icon: Youtube },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

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
      case 'web-sources':
        return <WebSourcesPanel />
      case 'youtube':
        return <YouTubePanel />
      case 'settings':
        return <SettingsPanel />
      default:
        return <ChatInterface />
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">AI Workspace</h1>
              <p className="text-sm text-gray-500">Your Local AI Assistant</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              
              return (
                <li key={tab.id}>
                  <button
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors duration-200 ${
                      isActive
                        ? 'bg-primary-50 text-primary-700 border border-primary-200'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            <p>AI Workspace v1.0</p>
            <p>Local-first AI Assistant</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-1 overflow-hidden"
        >
          {renderContent()}
        </motion.div>
      </div>
    </div>
  )
} 