'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Document, FileUpload } from '@/types'
import toast from 'react-hot-toast'

interface DocumentUploadProps {}

export default function DocumentUpload({}: DocumentUploadProps) {
  const [uploads, setUploads] = useState<FileUpload[]>([])
  const [documents, setDocuments] = useState<Document[]>([])

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

      // Add to documents list
      setDocuments(prev => [...prev, result.document])
      
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
      setDocuments(prev => prev.filter(d => d.id !== id))
      toast.success('Document removed successfully!')
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to remove document')
    }
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-6 h-6 text-red-500" />
      case 'docx':
        return <FileText className="w-6 h-6 text-blue-500" />
      case 'txt':
        return <FileText className="w-6 h-6 text-gray-500" />
      default:
        return <FileText className="w-6 h-6 text-gray-400" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragActive
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
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {upload.status === 'uploading' && (
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${upload.progress}%` }}
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
        {documents.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Uploaded Documents ({documents.length})
            </h3>
            
            <div className="space-y-3">
              {documents.map(document => (
                <motion.div
                  key={document.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg border border-gray-200 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getFileIcon(document.type)}
                      <div>
                        <p className="font-medium text-gray-900">{document.name}</p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(document.size)} • {document.type.toUpperCase()}
                        </p>
                        <p className="text-xs text-gray-400">
                          Uploaded {new Date(document.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {document.processed && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Processed
                        </span>
                      )}
                      
                      <button
                        onClick={() => removeDocument(document.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 