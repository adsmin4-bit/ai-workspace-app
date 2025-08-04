'use client'

import { useState } from 'react'
import { Globe, Search, Plus } from 'lucide-react'

export default function WebSourcesPanel() {
  const [topic, setTopic] = useState('')
  const [sources, setSources] = useState<string[]>([])

  const searchSources = () => {
    if (topic.trim()) {
      // Placeholder for web source search
      setSources([`Source 1 for ${topic}`, `Source 2 for ${topic}`])
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
            <Globe className="w-4 h-4 text-primary-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Web Sources</h2>
            <p className="text-sm text-gray-500">Find and analyze web content</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Search Web Sources</h3>
          
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Enter a topic to search..."
              className="input-field flex-1"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
            <button
              onClick={searchSources}
              className="btn-primary flex items-center space-x-2"
            >
              <Search className="w-4 h-4" />
              <span>Search</span>
            </button>
          </div>
        </div>

        {sources.length > 0 && (
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Found Sources</h3>
            <div className="space-y-2">
              {sources.map((source, index) => (
                <div key={index} className="p-3 border border-gray-200 rounded-lg">
                  <p className="text-gray-900">{source}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 