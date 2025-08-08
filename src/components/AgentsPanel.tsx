'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Play, Edit, Trash2, Bot, Settings, Loader2 } from 'lucide-react'
import AgentChatModal from './AgentChatModal'

interface Agent {
    id: string
    name: string
    description: string
    system_prompt: string
    capabilities: string[]
    workflows: string[]
    enabled: boolean
    created_at: string
    updated_at: string
}

interface AgentFormData {
    name: string
    description: string
    system_prompt: string
    capabilities: string[]
    workflows: string[]
    enabled: boolean
}

const AVAILABLE_CAPABILITIES = [
    'web_search',
    'document_search',
    'youtube_search',
    'workflows',
    'notebook_access',
    'context_retrieval',
    'summarization',
    'tag_generation'
]

export default function AgentsPanel() {
    const [agents, setAgents] = useState<Agent[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [editingAgent, setEditingAgent] = useState<Agent | null>(null)
    const [formData, setFormData] = useState<AgentFormData>({
        name: '',
        description: '',
        system_prompt: '',
        capabilities: [],
        workflows: [],
        enabled: true
    })
    const [submitting, setSubmitting] = useState(false)
    const [runningAgent, setRunningAgent] = useState<string | null>(null)
    const [chatModalAgent, setChatModalAgent] = useState<Agent | null>(null)

    useEffect(() => {
        fetchAgents()
    }, [])

    const fetchAgents = async () => {
        try {
            const response = await fetch('/api/agents')
            if (response.ok) {
                const data = await response.json()
                setAgents(data.data || [])
            }
        } catch (error) {
            console.error('Error fetching agents:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateAgent = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)

        try {
            const response = await fetch('/api/agents', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            })

            if (response.ok) {
                const data = await response.json()
                setAgents([data.data, ...agents])
                resetForm()
                setShowCreateForm(false)
            } else {
                const error = await response.json()
                alert(error.error || 'Failed to create agent')
            }
        } catch (error) {
            console.error('Error creating agent:', error)
            alert('Failed to create agent')
        } finally {
            setSubmitting(false)
        }
    }

    const handleUpdateAgent = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingAgent) return

        setSubmitting(true)

        try {
            const response = await fetch(`/api/agents/${editingAgent.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            })

            if (response.ok) {
                const data = await response.json()
                setAgents(agents.map(agent =>
                    agent.id === editingAgent.id ? data.data : agent
                ))
                resetForm()
                setEditingAgent(null)
            } else {
                const error = await response.json()
                alert(error.error || 'Failed to update agent')
            }
        } catch (error) {
            console.error('Error updating agent:', error)
            alert('Failed to update agent')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeleteAgent = async (agentId: string) => {
        if (!confirm('Are you sure you want to delete this agent?')) return

        try {
            const response = await fetch(`/api/agents/${agentId}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                setAgents(agents.filter(agent => agent.id !== agentId))
            } else {
                const error = await response.json()
                alert(error.error || 'Failed to delete agent')
            }
        } catch (error) {
            console.error('Error deleting agent:', error)
            alert('Failed to delete agent')
        }
    }

    const handleRunAgent = async (agent: Agent) => {
        setChatModalAgent(agent)
    }

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            system_prompt: '',
            capabilities: [],
            workflows: [],
            enabled: true
        })
    }

    const openEditForm = (agent: Agent) => {
        setEditingAgent(agent)
        setFormData({
            name: agent.name,
            description: agent.description,
            system_prompt: agent.system_prompt,
            capabilities: agent.capabilities,
            workflows: agent.workflows,
            enabled: agent.enabled
        })
    }

    const toggleCapability = (capability: string) => {
        setFormData(prev => ({
            ...prev,
            capabilities: prev.capabilities.includes(capability)
                ? prev.capabilities.filter(c => c !== capability)
                : [...prev.capabilities, capability]
        }))
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString()
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        )
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">AI Agents</h1>
                    <p className="text-gray-600">Create and manage AI agents with specific capabilities</p>
                </div>
                <button
                    onClick={() => setShowCreateForm(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    New Agent
                </button>
            </div>

            {/* Create/Edit Form Modal */}
            {(showCreateForm || editingAgent) && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-semibold mb-4">
                            {editingAgent ? 'Edit Agent' : 'Create New Agent'}
                        </h2>

                        <form onSubmit={editingAgent ? handleUpdateAgent : handleCreateAgent}>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="agent-name" className="block text-sm font-medium text-gray-700 mb-1">
                                        Name *
                                    </label>
                                    <input
                                        id="agent-name"
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        className="input-field"
                                        placeholder="Enter agent name"
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="agent-description" className="block text-sm font-medium text-gray-700 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        id="agent-description"
                                        value={formData.description}
                                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                        className="input-field"
                                        rows={2}
                                        placeholder="Enter agent description"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        System Prompt *
                                    </label>
                                    <textarea
                                        value={formData.system_prompt}
                                        onChange={(e) => setFormData(prev => ({ ...prev, system_prompt: e.target.value }))}
                                        className="input-field"
                                        rows={6}
                                        placeholder="Define the agent's personality, capabilities, and behavior..."
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Capabilities
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {AVAILABLE_CAPABILITIES.map(capability => (
                                            <label key={capability} className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.capabilities.includes(capability)}
                                                    onChange={() => toggleCapability(capability)}
                                                    className="rounded border-gray-300"
                                                    title={`Enable ${capability.replace('_', ' ')} capability`}
                                                />
                                                <span className="text-sm text-gray-700 capitalize">
                                                    {capability.replace('_', ' ')}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="enabled"
                                        checked={formData.enabled}
                                        onChange={(e) => setFormData(prev => ({ ...prev, enabled: e.target.checked }))}
                                        className="rounded border-gray-300"
                                        title="Enable this agent"
                                    />
                                    <label htmlFor="enabled" className="text-sm text-gray-700">
                                        Enabled
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateForm(false)
                                        setEditingAgent(null)
                                        resetForm()
                                    }}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="btn-primary flex items-center gap-2"
                                >
                                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {editingAgent ? 'Update Agent' : 'Create Agent'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Agents List */}
            <div className="grid gap-4">
                {agents.length === 0 ? (
                    <div className="text-center py-12">
                        <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No agents yet</h3>
                        <p className="text-gray-600 mb-4">Create your first AI agent to get started</p>
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="btn-primary"
                        >
                            Create Agent
                        </button>
                    </div>
                ) : (
                    agents.map(agent => (
                        <div key={agent.id} className="card">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Bot className="w-5 h-5 text-blue-600" />
                                        <h3 className="text-lg font-semibold text-gray-900">{agent.name}</h3>
                                        {!agent.enabled && (
                                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                                                Disabled
                                            </span>
                                        )}
                                    </div>

                                    {agent.description && (
                                        <p className="text-gray-600 mb-3">{agent.description}</p>
                                    )}

                                    <div className="mb-3">
                                        <p className="text-sm text-gray-500 mb-1">Capabilities:</p>
                                        <div className="flex flex-wrap gap-1">
                                            {agent.capabilities.length > 0 ? (
                                                agent.capabilities.map(capability => (
                                                    <span
                                                        key={capability}
                                                        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded"
                                                    >
                                                        {capability.replace('_', ' ')}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-sm text-gray-400">No capabilities defined</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="text-sm text-gray-500">
                                        Created: {formatDate(agent.created_at)}
                                        {agent.updated_at !== agent.created_at && (
                                            <span> • Updated: {formatDate(agent.updated_at)}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 ml-4">
                                    <button
                                        onClick={() => handleRunAgent(agent)}
                                        disabled={runningAgent === agent.id}
                                        className="btn-primary flex items-center gap-1 text-sm"
                                        title="Run Agent"
                                    >
                                        {runningAgent === agent.id ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                            <Play className="w-3 h-3" />
                                        )}
                                        Run
                                    </button>

                                    <button
                                        onClick={() => openEditForm(agent)}
                                        className="btn-secondary flex items-center gap-1 text-sm"
                                        title="Edit Agent"
                                    >
                                        <Edit className="w-3 h-3" />
                                        Edit
                                    </button>

                                    <button
                                        onClick={() => handleDeleteAgent(agent.id)}
                                        className="btn-secondary text-red-600 hover:text-red-700 flex items-center gap-1 text-sm"
                                        title="Delete Agent"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Agent Chat Modal */}
            {chatModalAgent && (
                <AgentChatModal
                    isOpen={!!chatModalAgent}
                    onClose={() => setChatModalAgent(null)}
                    agent={chatModalAgent}
                />
            )}
        </div>
    )
} 