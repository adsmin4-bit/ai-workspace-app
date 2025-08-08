'use client'

import { useState, useEffect } from 'react'
import { Workflow, Plus, Play } from 'lucide-react'

export default function WorkflowPanel() {
  const [workflows, setWorkflows] = useState<any[]>([])
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('')
  const [input, setInput] = useState('')
  const [result, setResult] = useState('')

  const loadWorkflows = async () => {
    try {
      const response = await fetch('/api/workflows')
      if (response.ok) {
        const data = await response.json()
        setWorkflows(data.workflows || [])
      }
    } catch (error) {
      console.log('Failed to load workflows, using defaults')
      setWorkflows([
        { id: '1', name: 'Summarize Text', description: 'Summarize any text content' },
        { id: '2', name: 'Create Tweet', description: 'Convert content into a tweet format' }
      ])
    }
  }

  const executeWorkflow = async () => {
    if (selectedWorkflow && input.trim()) {
      try {
        const response = await fetch('/api/workflows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workflowId: selectedWorkflow, input: input.trim() }),
        })

        if (response.ok) {
          const data = await response.json()
          setResult(data.result)
        } else {
          setResult('Workflow execution failed')
        }
      } catch (error) {
        setResult('Workflow execution failed')
      }
    }
  }

  // Load workflows on component mount
  useEffect(() => {
    loadWorkflows()
  }, [])

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

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Available Workflows</h3>

          <div className="space-y-3">
            {workflows.map((workflow) => (
              <div key={workflow.id} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900">{workflow.name}</h4>
                <p className="text-sm text-gray-500 mb-3">{workflow.description}</p>
                <button
                  onClick={() => setSelectedWorkflow(workflow.id)}
                  className={`btn-outline text-sm ${selectedWorkflow === workflow.id ? 'bg-primary-50 border-primary-200' : ''
                    }`}
                >
                  Select
                </button>
              </div>
            ))}
          </div>
        </div>

        {selectedWorkflow && (
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Execute Workflow</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Input Text
                </label>
                <textarea
                  rows={4}
                  placeholder="Enter text to process..."
                  className="input-field"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
              </div>

              <button
                onClick={executeWorkflow}
                disabled={!input.trim()}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Execute Workflow
              </button>
            </div>
          </div>
        )}

        {result && (
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Result</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-900 whitespace-pre-wrap">{result}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 