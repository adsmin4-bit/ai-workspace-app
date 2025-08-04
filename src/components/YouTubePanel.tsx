'use client'

import { useState } from 'react'
import { Youtube, Play, Download } from 'lucide-react'

export default function YouTubePanel() {
  const [url, setUrl] = useState('')
  const [transcripts, setTranscripts] = useState<string[]>([])

  const processVideo = () => {
    if (url.trim()) {
      // Placeholder for YouTube processing
      setTranscripts([`Transcript for ${url}`])
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
            <Youtube className="w-4 h-4 text-primary-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">YouTube</h2>
            <p className="text-sm text-gray-500">Process YouTube videos</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Process YouTube Video</h3>
          
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Enter YouTube URL..."
              className="input-field flex-1"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <button
              onClick={processVideo}
              className="btn-primary flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Process</span>
            </button>
          </div>
        </div>

        {transcripts.length > 0 && (
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Transcripts</h3>
            <div className="space-y-2">
              {transcripts.map((transcript, index) => (
                <div key={index} className="p-3 border border-gray-200 rounded-lg">
                  <p className="text-gray-900">{transcript}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 