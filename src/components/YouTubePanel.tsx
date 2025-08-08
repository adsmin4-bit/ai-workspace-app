'use client'

import { useState, useEffect } from 'react'
import { Youtube, Play, ExternalLink, FileText, MessageCircle, Eye, Trash2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import QAModal from './QAModal'
import SingleSourceChat from './SingleSourceChat'

interface YouTubeVideo {
  id: string
  url: string
  title: string
  description: string
  transcript: string
  duration: number
  created_at: string
  include_in_memory?: boolean
  context_weight?: number
  tags?: string[]
}

export default function YouTubePanel() {
  const [url, setUrl] = useState('')
  const [videos, setVideos] = useState<YouTubeVideo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingVideos, setIsLoadingVideos] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null)
  const [showTranscript, setShowTranscript] = useState(false)
  const [showQAModal, setShowQAModal] = useState(false)
  const [showChatModal, setShowChatModal] = useState(false)

  // Load existing videos on component mount
  useEffect(() => {
    fetchVideos()
  }, [])

  const fetchVideos = async () => {
    try {
      const response = await fetch('/api/sources/youtube/transcribe')
      if (response.ok) {
        const result = await response.json()
        setVideos(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching videos:', error)
      toast.error('Failed to load videos')
    } finally {
      setIsLoadingVideos(false)
    }
  }

  const processVideo = async () => {
    if (!url.trim()) {
      toast.error('Please enter a YouTube URL')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/sources/youtube/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })

      if (response.ok) {
        const result = await response.json()
        toast.success('Video transcribed successfully!')
        setUrl('')
        fetchVideos() // Refresh the list
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to transcribe video')
      }
    } catch (error) {
      console.error('Error processing video:', error)
      toast.error('Failed to transcribe video')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      processVideo()
    }
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const openTranscript = (video: YouTubeVideo) => {
    setSelectedVideo(video)
    setShowTranscript(true)
  }

  const openQAModal = (video: YouTubeVideo) => {
    setSelectedVideo(video)
    setShowQAModal(true)
  }

  const openChatModal = (video: YouTubeVideo) => {
    setSelectedVideo(video)
    setShowChatModal(true)
  }

  const deleteVideo = async (videoId: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return

    try {
      const response = await fetch(`/api/sources/youtube/transcribe/${videoId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Video deleted successfully')
        fetchVideos() // Refresh the list
      } else {
        toast.error('Failed to delete video')
      }
    } catch (error) {
      console.error('Error deleting video:', error)
      toast.error('Failed to delete video')
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <Youtube className="w-4 h-4 text-red-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">YouTube Videos</h2>
            <p className="text-sm text-gray-500">Transcribe and analyze YouTube videos</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Add New Video */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add YouTube Video</h3>

          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Enter YouTube URL..."
              className="input-field flex-1"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button
              onClick={processVideo}
              disabled={isLoading || !url.trim()}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4" />
              <span>{isLoading ? 'Transcribing...' : 'Transcribe & Add'}</span>
            </button>
          </div>
        </div>

        {/* Videos List */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Saved Videos</h3>

          {isLoadingVideos ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading videos...</p>
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-8">
              <Youtube className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No videos transcribed yet</p>
              <p className="text-sm text-gray-400">Add a YouTube URL above to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {videos.map((video) => (
                <div key={video.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Youtube className="w-4 h-4 text-red-600" />
                        <h4 className="font-medium text-gray-900">{video.title}</h4>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                        <span>Duration: {formatDuration(video.duration)}</span>
                        <span>Added: {formatDate(video.created_at)}</span>
                        <span>Transcript: {video.transcript.length} characters</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openTranscript(video)}
                          className="btn-outline text-sm flex items-center space-x-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View Transcript</span>
                        </button>
                        <button
                          onClick={() => openQAModal(video)}
                          className="btn-outline text-sm flex items-center space-x-1"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Ask Questions</span>
                        </button>
                        <button
                          onClick={() => openChatModal(video)}
                          className="btn-outline text-sm flex items-center space-x-1"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>Chat with Video</span>
                        </button>
                        <a
                          href={video.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-outline text-sm flex items-center space-x-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Watch</span>
                        </a>
                        <button
                          onClick={() => deleteVideo(video.id)}
                          className="btn-outline text-sm flex items-center space-x-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Transcript Modal */}
      {selectedVideo && showTranscript && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Transcript: {selectedVideo.title}</h3>
              <button
                onClick={() => setShowTranscript(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {selectedVideo.transcript}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* QA Modal */}
      {selectedVideo && showQAModal && (
        <QAModal
          isOpen={showQAModal}
          onClose={() => setShowQAModal(false)}
          sourceType="youtube"
          sourceTitle={selectedVideo.title}
          sourceContent={selectedVideo.transcript}
          sourceUrl={selectedVideo.url}
        />
      )}

      {/* Chat Modal */}
      {selectedVideo && showChatModal && (
        <SingleSourceChat
          isOpen={showChatModal}
          onClose={() => setShowChatModal(false)}
          sourceId={selectedVideo.id}
          sourceType="youtube"
          sourceTitle={selectedVideo.title}
        />
      )}
    </div>
  )
} 