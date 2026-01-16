import { motion } from 'framer-motion';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ShoppingBag
} from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';
import { GoogleAuth } from '../GoogleAuth';

interface LoginCardProps {
  className?: string;
  onSwitchToSignUp?: () => void;
}

const LoginCard: React.FC<LoginCardProps> = ({ className = '', onSwitchToSignUp }): JSX.Element => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { signIn } = useAuth();

  // Form validation
  const validateEmail = (email: string): string => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email is required';
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return '';
  };

  const validatePassword = (password: string): string => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return '';
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setEmail(value);
    setEmailError(validateEmail(value));
    setError(''); // Clear general error when user starts typing
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setPassword(value);
    setPasswordError(validatePassword(value));
    setError(''); // Clear general error when user starts typing
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    // Validate form
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);
    
    setEmailError(emailValidation);
    setPasswordError(passwordValidation);
    
    if (emailValidation || passwordValidation) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: authError } = await signIn(email, password);
      
      if (authError) {
        setError(authError.message || 'Failed to sign in');
      }
      // If successful, the AuthContext will handle the redirect
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const [googleError, setGoogleError] = useState('');

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className={`w-full max-w-md mx-auto ${className}`}
      initial={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
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
            Welcome Back
          </h2>
          <p className="text-gray-700 dark:text-neutral-400 mb-8">
            Sign in to your AI Fashion account
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

        {/* Google Sign In */}
        <GoogleAuth onError={setGoogleError} />

        {/* Separator */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-200 dark:border-neutral-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400">
              or
            </span>
          </div>
        </div>

        {/* Login Form */}
        <form className="space-y-6" onSubmit={(e) => void handleSubmit(e)}>
          {/* Email Field */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300" htmlFor="email">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
              <input
                className={`w-full pl-12 pr-4 py-3 bg-neutral-50 dark:bg-neutral-800 border rounded-xl text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 ${
                  emailError ? 'border-red-300 dark:border-red-600' : 'border-neutral-200 dark:border-neutral-700'
                }`}
                id="email"
                onChange={handleEmailChange}
                placeholder="Enter your email"
                required
                type="email"
                value={email}
              />
            </div>
            {emailError && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-1">{emailError}</p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
              <input
                className={`w-full pl-12 pr-12 py-3 bg-neutral-50 dark:bg-neutral-800 border rounded-xl text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 ${
                  passwordError ? 'border-red-300 dark:border-red-600' : 'border-neutral-200 dark:border-neutral-700'
                }`}
                id="password"
                onChange={handlePasswordChange}
                placeholder="Enter your password"
                required
                type={showPassword ? 'text' : 'password'}
                value={password}
              />
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors duration-200"
                onClick={() => setShowPassword(!showPassword)}
                type="button"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {passwordError && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-1">{passwordError}</p>
            )}
          </div>

          {/* Forgot Password Link */}
          <div className="text-right">
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="text-sm font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:underline transition-colors cursor-pointer bg-transparent border-none p-0"
            >
              Forgot password?
            </button>
          </div>

          {/* Sign In Button */}
          <motion.button
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold rounded-full shadow-md hover:shadow-lg hover:from-purple-700 hover:to-pink-600 hover:scale-[1.01] active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || !email || !password}
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </motion.button>
        </form>

        {/* Sign Up Link */}
        <div className="text-center mt-6">
          <p className="text-neutral-600 dark:text-neutral-400 text-sm">
            Don't have an account?{' '}
            <button
              className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors duration-200"
              onClick={onSwitchToSignUp}
              type="button"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default LoginCard;
