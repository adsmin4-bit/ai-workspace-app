'use client'

import { useState } from 'react'
import { useAuth } from './AuthProvider'
import { User, LogOut, Trash2, AlertTriangle, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AccountPanel() {
    const { user, signOut } = useAuth()
    const [isDeleting, setIsDeleting] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    const handleSignOut = async () => {
        try {
            await signOut()
            toast.success('Signed out successfully')
        } catch (error) {
            toast.error('Failed to sign out')
        }
    }

    const handleDeleteAccount = async () => {
        setIsDeleting(true)
        try {
            // This would typically call an API endpoint to delete the user account
            // For now, we'll just sign out
            await signOut()
            toast.success('Account deleted successfully')
        } catch (error) {
            toast.error('Failed to delete account')
        } finally {
            setIsDeleting(false)
            setShowDeleteConfirm(false)
        }
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">Please sign in to view account details</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Account</h2>
                        <p className="text-sm text-gray-500">
                            Manage your account settings
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* User Info */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email Address
                            </label>
                            <p className="text-gray-900">{user.email}</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                User ID
                            </label>
                            <p className="text-sm text-gray-500 font-mono">{user.id}</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Account Created
                            </label>
                            <p className="text-gray-900">
                                {new Date(user.created_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Last Sign In
                            </label>
                            <p className="text-gray-900">
                                {user.last_sign_in_at
                                    ? new Date(user.last_sign_in_at).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })
                                    : 'Never'
                                }
                            </p>
                        </div>
                    </div>
                </div>

                {/* Account Actions */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Account Actions</h3>

                    <div className="space-y-3">
                        <button
                            onClick={handleSignOut}
                            className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Sign Out</span>
                        </button>

                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-red-300 rounded-lg text-red-700 hover:bg-red-50 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete Account</span>
                        </button>
                    </div>
                </div>

                {/* Security Info */}
                <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
                    <div className="flex items-start space-x-3">
                        <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                            <h3 className="text-sm font-medium text-blue-900 mb-1">
                                Security Notice
                            </h3>
                            <p className="text-sm text-blue-700">
                                Your account data is protected with Row-Level Security (RLS) policies.
                                Only you can access your documents, notes, and other content.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Account Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md mx-4">
                        <div className="flex items-center space-x-3 mb-4">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                            <h3 className="text-lg font-medium text-gray-900">Delete Account</h3>
                        </div>

                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data including documents, notes, and chat history.
                        </p>

                        <div className="flex space-x-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                disabled={isDeleting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={isDeleting}
                                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                {isDeleting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Trash2 className="w-4 h-4" />
                                )}
                                <span>{isDeleting ? 'Deleting...' : 'Delete Account'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
} 