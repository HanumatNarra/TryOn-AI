import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  Sparkles,
  Palette,
  Camera,
  Heart
} from 'lucide-react'
import React, { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '../../contexts/AuthContext'
import { prefetchModels } from '../../utils/prefetchUtils'

export const LoginForm: React.FC = (): JSX.Element => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn } = useAuth()

  // Prefetch models when form is focused
  const handleFormFocus = useCallback(async (): Promise<void> => {
    try {
      await prefetchModels();
    } catch {
      // Handle error silently
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await signIn(email, password)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in';
      setError(errorMessage);
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white/95 backdrop-blur-xl rounded-xl p-8 shadow-2xl border border-white/30">
        {/* Form Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
              <Palette className="w-6 h-6 text-white" />
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-primary-600 rounded-xl flex items-center justify-center">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-accent-600 rounded-xl flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
          <p className="text-gray-600">Sign in to your AI Fashion account</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-700 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form className="space-y-6" onFocus={() => void handleFormFocus()} onSubmit={(e) => void handleSubmit(e)}>
          {/* Email Field */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700" htmlFor="email">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                id="email"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                type="email"
                value={email}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                id="password"
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                type={showPassword ? 'text' : 'password'}
                value={password}
              />
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                onClick={() => setShowPassword(!showPassword)}
                type="button"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Forgot Password */}
          <div className="text-right">
            <Link 
              className="text-sm text-primary-600 hover:text-primary-700 transition-colors duration-200" 
              to="/forgot-password"
            >
              Forgot your password?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            className="w-full bg-gradient-to-r from-primary-500 to-accent-500 text-white py-4 px-6 rounded-xl font-semibold hover:from-primary-600 hover:to-accent-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md active:scale-95"
            disabled={loading}
            type="submit"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                Signing In...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 inline mr-2" />
                Sign In
              </>
            )}
          </button>
        </form>

        {/* Sign Up Link */}
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link 
              className="text-primary-600 font-semibold hover:text-primary-700 transition-colors duration-200 underline decoration-2 underline-offset-2" 
              to="/signup"
            >
              Sign up
            </Link>
          </p>
        </div>

        {/* Features Preview */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-center">
            <div className="space-y-2">
              <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center mx-auto">
                <Palette className="w-4 h-4 text-primary-600" />
              </div>
              <p className="text-xs text-gray-600">AI Styling</p>
            </div>
            <div className="space-y-2">
              <div className="w-8 h-8 bg-accent-100 rounded-lg flex items-center justify-center mx-auto">
                <Camera className="w-4 h-4 text-accent-600" />
              </div>
              <p className="text-xs text-gray-600">Virtual Try-On</p>
            </div>
            <div className="space-y-2">
              <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center mx-auto">
                <Heart className="w-4 h-4 text-primary-600" />
              </div>
              <p className="text-xs text-gray-600">Smart Suggestions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}