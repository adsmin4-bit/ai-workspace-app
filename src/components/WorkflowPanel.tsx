'use client'

import { useState } from 'react'
import { Workflow, Plus, Play } from 'lucide-react'

export default function WorkflowPanel() {
  const [workflows, setWorkflows] = useState<string[]>([])

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
            <Workflow className="w-4 h-4 text-primary-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Workflows</h2>
            <p className="text-sm text-gray-500">Automate your AI tasks</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="btn-outline flex items-center space-x-2 p-4">
              <Play className="w-4 h-4" />
              <span>Summarize</span>
            </button>
            
            <button className="btn-outline flex items-center space-x-2 p-4">
              <Play className="w-4 h-4" />
              <span>Create Tweet</span>
            </button>
            
            <button className="btn-outline flex items-center space-x-2 p-4">
              <Play className="w-4 h-4" />
              <span>Write Email</span>
            </button>
            
            <button className="btn-outline flex items-center space-x-2 p-4">
              <Play className="w-4 h-4" />
              <span>YouTube Script</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 