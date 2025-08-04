'use client'

import { useState } from 'react'
import { BookOpen, Plus, Save } from 'lucide-react'

export default function NotebookPanel() {
  const [notes, setNotes] = useState<string[]>([])
  const [currentNote, setCurrentNote] = useState('')

  const addNote = () => {
    if (currentNote.trim()) {
      setNotes([...notes, currentNote])
      setCurrentNote('')
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-primary-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Notebook</h2>
            <p className="text-sm text-gray-500">Save your thoughts and ideas</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add Note</h3>
          <textarea
            rows={4}
            placeholder="Write your note here..."
            className="input-field"
            value={currentNote}
            onChange={(e) => setCurrentNote(e.target.value)}
          />
          <div className="flex justify-end mt-4">
            <button
              onClick={addNote}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Note</span>
            </button>
          </div>
        </div>

        {notes.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Your Notes</h3>
            <div className="space-y-3">
              {notes.map((note, index) => (
                <div key={index} className="card">
                  <p className="text-gray-900 whitespace-pre-wrap">{note}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 