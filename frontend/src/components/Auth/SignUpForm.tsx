import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Palette,
  Camera,
  Heart,
  User,
  CheckCircle,
  Calendar,
  ShoppingBag
} from 'lucide-react'
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../../contexts/AuthContext'
import { GoogleAuth } from '../GoogleAuth'

interface SignUpFormProps {
  onSwitchToLogin?: () => void;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({ onSwitchToLogin }): JSX.Element => {
  const navigate = useNavigate()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [googleError, setGoogleError] = useState('')
  const { signUp } = useAuth()

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    if (!firstName.trim()) {
      setError('First name is required')
      setLoading(false)
      return
    }

    if (!lastName.trim()) {
      setError('Last name is required')
      setLoading(false)
      return
    }

    if (!dateOfBirth) {
      setError('Date of birth is required')
      setLoading(false)
      return
    }

    try {
      await signUp(email, password, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        Date_Of_Birth: dateOfBirth
      })
      setSuccess('Account created successfully! Please check your email to verify your account.')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create account';
      setError(errorMessage);
    } finally {
    setLoading(false)
    }
  }

  const passwordStrength = (): { score: number; color: string; text: string } => {
    if (password.length === 0) return { score: 0, color: 'bg-gray-200', text: '' }
    if (password.length < 6) return { score: 1, color: 'bg-red-400', text: 'Too short' }
    if (password.length < 8) return { score: 2, color: 'bg-yellow-400', text: 'Weak' }
    if (password.length < 10) return { score: 3, color: 'bg-yellow-500', text: 'Fair' }
    return { score: 4, color: 'bg-green-500', text: 'Strong' }
  }

  const strength = passwordStrength()

  return (
    <div className="w-full">
      <div className="bg-white/85 dark:bg-neutral-900/70 backdrop-blur-xl rounded-xl p-8 shadow-2xl border border-white/10 dark:border-neutral-700/30">
        {/* Logo */}
        <div className="text-center mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-3 mb-6 mx-auto hover:opacity-80 transition-opacity cursor-pointer"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-500 rounded-xl flex items-center justify-center shadow-sm">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              TryOn.AI
            </span>
          </button>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Join TryOn.AI
          </h2>
          <p className="text-gray-700 dark:text-neutral-400 mb-8">
            Create your AI Fashion account
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
            initial={{ opacity: 0, y: -10 }}
          >
            <p className="text-red-700 dark:text-red-400 text-sm text-center">{error}</p>
          </motion.div>
        )}

        {/* Success Display */}
        {success && (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl"
            initial={{ opacity: 0, y: -10 }}
          >
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400 text-sm">
              <CheckCircle className="w-4 h-4" />
              <span>{success}</span>
            </div>
          </motion.div>
        )}

        {/* Google OAuth Error */}
        {googleError && (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
            initial={{ opacity: 0, y: -10 }}
          >
            <p className="text-red-700 dark:text-red-400 text-sm text-center">{googleError}</p>
          </motion.div>
        )}

        {/* Google Sign Up */}
        <GoogleAuth onError={setGoogleError} />

        {/* Separator */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-neutral-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-neutral-900 text-gray-500 dark:text-neutral-400">
              or
            </span>
          </div>
        </div>

        {/* Sign Up Form */}
        <form className="space-y-6" onSubmit={(e) => void handleSubmit(e)}>
          {/* First Name Field */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300" htmlFor="first-name">
              First Name
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
              <input
                className="w-full pl-12 pr-4 py-3 bg-neutral-50 dark:bg-neutral-800 border rounded-xl text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                id="first-name"
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter your first name"
                required
                type="text"
                value={firstName}
              />
            </div>
          </div>

          {/* Last Name Field */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300" htmlFor="last-name">
              Last Name
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
              <input
                className="w-full pl-12 pr-4 py-3 bg-neutral-50 dark:bg-neutral-800 border rounded-xl text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                id="last-name"
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter your last name"
                required
                type="text"
                value={lastName}
              />
            </div>
          </div>

          {/* Date of Birth Field */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300" htmlFor="date-of-birth">
              Date of Birth
            </label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
              <input
                className="w-full pl-12 pr-4 py-3 bg-neutral-50 dark:bg-neutral-800 border rounded-xl text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                id="date-of-birth"
                onChange={(e) => setDateOfBirth(e.target.value)}
                required
                type="date"
                value={dateOfBirth}
              />
            </div>
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300" htmlFor="email">
              Email Address
            </label>
          <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
            <input
                className="w-full pl-12 pr-4 py-3 bg-neutral-50 dark:bg-neutral-800 border rounded-xl text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
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
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300" htmlFor="password">
              Password
            </label>
          <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
            <input
                className="w-full pl-12 pr-12 py-3 bg-neutral-50 dark:bg-neutral-800 border rounded-xl text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                id="password"
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
                required
              type={showPassword ? 'text' : 'password'}
              value={password}
            />
            <button
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-400 transition-colors duration-200"
                onClick={() => setShowPassword(!showPassword)}
              type="button"
            >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

            {/* Password Strength Indicator */}
            {password.length > 0 && (
              <div className="space-y-2">
                <div className="flex gap-1">
                  {[...Array(4)].map((_, i) => (
                    <div
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        i < strength.score ? strength.color : 'bg-neutral-200 dark:bg-neutral-700'
                      }`}
                      key={i}
                    />
                  ))}
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">{strength.text}</p>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300" htmlFor="confirm-password">
              Confirm Password
            </label>
          <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
            <input
                className="w-full pl-12 pr-12 py-3 bg-neutral-50 dark:bg-neutral-800 border rounded-xl text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                id="confirm-password"
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
            />
            <button
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-400 transition-colors duration-200"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              type="button"
            >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

            {/* Password Match Indicator */}
            {confirmPassword.length > 0 && (
              <div className="flex items-center gap-2 text-xs">
                {password === confirmPassword ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-green-600 dark:text-green-400">Passwords match</span>
                  </>
                ) : (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-red-400" />
                    <span className="text-red-600 dark:text-red-400">Passwords don't match</span>
                  </>
                )}
            </div>
          )}
          </div>

          {/* Submit Button */}
          <motion.button
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold rounded-full shadow-md hover:shadow-lg hover:from-purple-700 hover:to-pink-600 hover:scale-[1.01] active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || password !== confirmPassword || password.length < 6}
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </motion.button>
        </form>

        {/* Sign In Link */}
        <div className="mt-8 text-center">
          <p className="text-neutral-600 dark:text-neutral-400">
            Already have an account?{' '}
            <button 
              className="text-purple-600 dark:text-purple-400 font-semibold hover:text-purple-700 dark:hover:text-purple-300 transition-colors duration-200 underline decoration-2 underline-offset-2" 
              onClick={onSwitchToLogin}
              type="button"
            >
            Sign in
            </button>
          </p>
        </div>

        {/* Features Preview */}
        <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-center">
            <div className="space-y-2">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mx-auto">
                <Palette className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">AI Styling</p>
            </div>
            <div className="space-y-2">
              <div className="w-8 h-8 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center mx-auto">
                <Camera className="w-4 h-4 text-pink-600 dark:text-pink-400" />
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">Virtual Try-On</p>
            </div>
            <div className="space-y-2">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mx-auto">
                <Heart className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">Smart Suggestions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}