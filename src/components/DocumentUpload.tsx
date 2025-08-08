'use client'

import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2, RefreshCw, MessageCircle, Tag } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Document, FileUpload } from '@/types'
import toast from 'react-hot-toast'
import QAModal from './QAModal'
import MemoryToggle from './MemoryToggle'
import SummaryGenerator from './SummaryGenerator'
import SingleSourceChat from './SingleSourceChat'

interface DocumentUploadProps { }

export default function DocumentUpload({ }: DocumentUploadProps) {
  const [uploads, setUploads] = useState<FileUpload[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true)

  // Q&A Modal state
  const [qaModalOpen, setQaModalOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)

  // Single Source Chat state
  const [singleSourceChatOpen, setSingleSourceChatOpen] = useState(false)
  const [selectedSourceForChat, setSelectedSourceForChat] = useState<{ id: string; type: 'document' | 'youtube' | 'url'; title: string } | null>(null)

  // Fetch documents from Supabase on component mount
  useEffect(() => {
    fetchDocuments()
  }, []) // Empty dependency array ensures this runs only on mount

  const fetchDocuments = async () => {
    setIsLoadingDocuments(true)
    try {
      const response = await fetch('/api/documents')
      if (response.ok) {
        const result = await response.json()
        console.log('Documents API response:', result)
        console.log('Documents data:', result.documents)
        setDocuments(result.documents || [])
      } else {
        console.error('Failed to fetch documents')
        toast.error('Failed to load documents')
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
      toast.error('Failed to load documents')
    } finally {
      setIsLoadingDocuments(false)
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newUploads: FileUpload[] = acceptedFiles.map(file => ({
      id: Date.now().toString() + Math.random(),
      file,
      progress: 0,
      status: 'uploading' as const,
    }))

    setUploads(prev => [...prev, ...newUploads])

    // Process each file
    newUploads.forEach(upload => processFile(upload))
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    multiple: true,
  })

  const processFile = async (upload: FileUpload) => {
    try {
      const formData = new FormData()
      formData.append('file', upload.file)

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const result = await response.json()

      // Update upload status
      setUploads(prev => prev.map(u =>
        u.id === upload.id
          ? { ...u, status: 'completed' as const, progress: 100 }
          : u
      ))

      // Add to documents list and refresh
      await fetchDocuments()

      // Auto-generate tags if document was uploaded successfully
      if (result.success && result.document?.content) {
        try {
          const tagResponse = await fetch('/api/tags/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: result.document.content,
              title: result.document.name
            })
          })

          if (tagResponse.ok) {
            const tagData = await tagResponse.json()
            if (tagData.success && tagData.data.tags.length > 0) {
              // Update document with generated tags
              await fetch(`/api/documents/${result.document.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tags: tagData.data.tags })
              })

              toast.success(`Generated tags: ${tagData.data.tags.join(', ')}`)
            }
          }
        } catch (tagError) {
          console.error('Error generating tags:', tagError)
          // Don't fail the upload if tag generation fails
        }
      }

      toast.success(`${upload.file.name} uploaded successfully!`)

    } catch (error) {
      console.error('Upload error:', error)

      setUploads(prev => prev.map(u =>
        u.id === upload.id
          ? { ...u, status: 'error' as const, error: 'Upload failed' }
          : u
      ))

      toast.error(`Failed to upload ${upload.file.name}`)
    }
  }

  const removeUpload = (id: string) => {
    setUploads(prev => prev.filter(u => u.id !== id))
  }

  const removeDocument = async (id: string) => {
    try {
      await fetch(`/api/documents/${id}`, { method: 'DELETE' })
      await fetchDocuments() // Refresh the list
      toast.success('Document removed successfully!')
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to remove document')
    }
  }

  const getFileIcon = (type: string) => {
    try {
      if (!type) return <FileText className="w-6 h-6 text-gray-400" />

      switch (type.toLowerCase()) {
        case 'pdf':
          return <FileText className="w-6 h-6 text-red-500" />
        case 'docx':
          return <FileText className="w-6 h-6 text-blue-500" />
        case 'txt':
          return <FileText className="w-6 h-6 text-gray-500" />
        default:
          return <FileText className="w-6 h-6 text-gray-400" />
      }
    } catch (error) {
      console.error('Error getting file icon:', error, type)
      return <FileText className="w-6 h-6 text-gray-400" />
    }
  }

  const formatFileSize = (bytes: number) => {
    try {
      if (!bytes || bytes === 0) return '0 Bytes'
      if (isNaN(bytes) || bytes < 0) return 'Invalid size'

      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    } catch (error) {
      console.error('Error formatting file size:', error, bytes)
      return 'Invalid size'
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return 'Invalid date'
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      console.error('Error formatting date:', error, dateString)
      return 'Invalid date'
    }
  }

  const openQAModal = (document: Document) => {
    setSelectedDocument(document)
    setQaModalOpen(true)
  }

  const closeQAModal = () => {
    setQaModalOpen(false)
    setSelectedDocument(null)
  }

  const handleMemoryToggle = async (documentId: string, enabled: boolean) => {
    try {
      const response = await fetch('/api/memory/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: documentId,
          itemType: 'document',
          enabled: enabled
        })
      })

      if (response.ok) {
        // Update the document in the local state
        setDocuments(prev => prev.map(doc =>
          doc.id === documentId
            ? { ...doc, includeInMemory: enabled }
            : doc
        ))
        toast.success(`Document ${enabled ? 'included in' : 'excluded from'} AI memory`)
      } else {
        throw new Error('Failed to update memory toggle')
      }
    } catch (error) {
      console.error('Error toggling memory inclusion:', error)
      toast.error('Failed to update memory toggle')
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
            <FileText className="w-4 h-4 text-primary-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Documents</h2>
            <p className="text-sm text-gray-500">
              Upload and manage your documents for AI processing
            </p>
          </div>
        </div>
        <button
          onClick={fetchDocuments}
          disabled={isLoadingDocuments}
          className="btn-outline text-sm flex items-center space-x-2 disabled:opacity-50"
          title="Refresh documents"
        >
          <RefreshCw className={`w-4 h-4 ${isLoadingDocuments ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-gray-400'
            }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">
            {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
          </p>
          <p className="text-sm text-gray-500 mb-4">
            or click to select files
          </p>
          <p className="text-xs text-gray-400">
            Supports PDF, DOCX, and TXT files (max 10MB each)
          </p>
        </div>

        {/* Upload Progress */}
        <AnimatePresence>
          {uploads.map(upload => (
            <motion.div
              key={upload.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-lg border border-gray-200 p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {upload.status === 'uploading' && (
                    <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
                  )}
                  {upload.status === 'completed' && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  {upload.status === 'error' && (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}

                  <div>
                    <p className="font-medium text-gray-900">{upload.file.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(upload.file.size)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => removeUpload(upload.id)}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Remove upload"
                  title="Remove upload"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {upload.status === 'uploading' && (
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`bg-primary-600 h-2 rounded-full progress-bar`}
                      data-progress={Math.round(upload.progress / 5) * 5}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Uploading... {upload.progress}%
                  </p>
                </div>
              )}

              {upload.status === 'error' && (
                <p className="text-sm text-red-600 mt-2">
                  {upload.error}
                </p>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Documents List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Uploaded Documents ({documents.length})
            </h3>
          </div>

          {isLoadingDocuments ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-primary-500 animate-spin mr-2" />
              <span className="text-gray-600">Loading documents...</span>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">No documents uploaded yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((document, index) => (
                <motion.div
                  key={document.id || `document-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getFileIcon(document.type || 'txt')}
                      <div>
                        <p className="font-medium text-gray-900">{document.name || 'Unknown Document'}</p>
                        <p className="text-sm text-gray-500">
                          {document.size ? formatFileSize(document.size) : 'N/A'} • {document.type?.toUpperCase() || 'UNKNOWN'}
                        </p>
                        <p className="text-xs text-gray-400">
                          Uploaded {document.uploadedAt ? formatDate(document.uploadedAt.toString()) : 'Unknown date'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {document.processed && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Processed
                        </span>
                      )}

                      <MemoryToggle
                        itemId={document.id || ''}
                        itemType="document"
                        isEnabled={document.includeInMemory ?? true}
                        onToggle={(enabled) => document.id && handleMemoryToggle(document.id, enabled)}
                        size="sm"
                      />

                      <button
                        onClick={() => openQAModal(document)}
                        className="text-gray-400 hover:text-blue-500 transition-colors"
                        aria-label="Ask questions about this document"
                        title="Ask questions about this document"
                        disabled={!document.content}
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => document.id && removeDocument(document.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        aria-label="Remove document"
                        title="Remove document"
                        disabled={!document.id}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Tags Display */}
                  {document.tags && document.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {document.tags.map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Summary Generator */}
                  {document.content && document.id && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <SummaryGenerator
                        sourceId={document.id}
                        sourceType="document"
                        sourceTitle={document.name}
                        sourceContent={document.content}
                        size="sm"
                      />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Q&A Modal */}
      {selectedDocument && (
        <QAModal
          isOpen={qaModalOpen}
          onClose={closeQAModal}
          sourceType="document"
          sourceTitle={selectedDocument.name || 'Unknown Document'}
          sourceContent={selectedDocument.content || ''}
        />
      )}
    </div>
  )
} 