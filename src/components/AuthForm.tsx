'use client'

import { useState } from 'react'
import { useAuth } from './AuthProvider'
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface AuthFormProps {
    mode: 'signin' | 'signup'
    onSuccess?: () => void
}

export default function AuthForm({ mode, onSuccess }: AuthFormProps) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const { signIn, signUp } = useAuth()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { error } = mode === 'signin'
                ? await signIn(email, password)
                : await signUp(email, password)

            if (error) {
                toast.error(error.message)
            } else {
                if (mode === 'signup') {
                    toast.success('Account created! Please check your email to verify your account.')
                } else {
                    toast.success('Signed in successfully!')
                    onSuccess?.()
                }
            }
        } catch (error) {
            toast.error('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <p className="text-gray-600">
                        {mode === 'signin'
                            ? 'Sign in to your account to continue'
                            : 'Create a new account to get started'
                        }
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter your email"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                            Password
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter your password"
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                                {showPassword ? (
                                    <EyeOff className="h-5 w-5 text-gray-400" />
                                ) : (
                                    <Eye className="h-5 w-5 text-gray-400" />
                                )}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            mode === 'signin' ? 'Sign In' : 'Create Account'
                        )}
                    </button>
                </form>

                {mode === 'signin' && (
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Don't have an account?{' '}
                            <button
                                onClick={() => window.location.href = '/signup'}
                                className="font-medium text-blue-600 hover:text-blue-500"
                            >
                                Sign up here
                            </button>
                        </p>
                    </div>
                )}

                {mode === 'signup' && (
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Already have an account?{' '}
                            <button
                                onClick={() => window.location.href = '/signin'}
                                className="font-medium text-blue-600 hover:text-blue-500"
                            >
                                Sign in here
                            </button>
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
} 