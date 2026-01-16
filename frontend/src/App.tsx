import { ShoppingBag, Loader2 } from 'lucide-react'
import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'

import LoginPage from './components/Auth/LoginPage'
import SignUpPage from './components/Auth/SignUpPage'
import { ErrorBoundary } from './components/ErrorBoundary'
import LandingPage from './components/LandingPage'
import Layout from './components/Layout'
import Profile from './components/Profile/Profile'
import { SeamlessRouteTransition } from './components/SeamlessRouteTransition'
import OutfitSuggestions from './components/Suggestions/OutfitSuggestions'
import { VirtualTryOn } from './components/TryOn/VirtualTryOn'
import { AddItemForm } from './components/Wardrobe/AddItemForm'
import WardrobeGrid from './components/Wardrobe/WardrobeGrid'
import { useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthCallback } from './pages/AuthCallback'
import { ForgotPassword } from './pages/ForgotPassword'
import { ResetPassword } from './pages/ResetPassword'
import { TestAuth } from './pages/TestAuth'


const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }): JSX.Element => {
  const { user, loading } = useAuth()
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    if (loading) {
      setIsTransitioning(true)
    } else if (user) {
      // Add a small delay to ensure smooth transition
      const timer = setTimeout(() => setIsTransitioning(false), 100)
      return (): void => clearTimeout(timer)
    }
  }, [loading, user])

  if (loading) {
    return (
      <SeamlessRouteTransition isTransitioning={isTransitioning}>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500 dark:text-purple-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-300">Styling your session...</p>
          </div>
        </div>
      </SeamlessRouteTransition>
    )
  }

  if (!user) {
    return <Navigate replace to="/login" />
  }

  return <>{children}</>
}

const AuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }): JSX.Element => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500 dark:text-purple-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    )
  }

  if (user) {
    return <Navigate replace to="/wardrobe" />
  }

  return <>{children}</>
}

const AuthPages: React.FC<{ children: React.ReactNode }> = ({ children }): JSX.Element => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-blue-500 to-purple-600 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <ShoppingBag className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">TryOn.AI</h1>
          <p className="text-white/90 text-lg">Your AI-Powered Virtual Wardrobe</p>
        </div>
        {children}
      </div>
    </div>
  )
}

function App(): JSX.Element {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Router>
          <Routes>
            {/* Landing Page - accessible to everyone */}
            <Route element={<LandingPage />} path="/" />

            {/* Auth Callback - MUST be before any catch-all routes */}
            <Route element={<AuthCallback />} path="/auth/callback" />

            {/* Public routes - only accessible when NOT logged in */}
            <Route
              element={
                <AuthRoute>
                  <LoginPage />
                </AuthRoute>
              }
              path="/login"
            />
            <Route
              element={
                <AuthRoute>
                  <SignUpPage />
                </AuthRoute>
              }
              path="/signup"
            />
            <Route element={<ForgotPassword />} path="/forgot-password" />
            <Route element={<ResetPassword />} path="/reset-password" />

            {/* Debug/Test route - accessible to everyone */}
            <Route element={<TestAuth />} path="/test-auth" />
            
            {/* Protected routes - only accessible when logged in */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout>
                    <WardrobeGrid />
                  </Layout>
                </ProtectedRoute>
              }
              path="/wardrobe"
            />
            <Route
              element={
                <ProtectedRoute>
                  <Layout>
                    <AddItemForm />
                  </Layout>
                </ProtectedRoute>
              }
              path="/add-item"
            />
            <Route
              element={
                <ProtectedRoute>
                  <Layout>
                    <OutfitSuggestions />
                  </Layout>
                </ProtectedRoute>
              }
              path="/suggestions"
            />
            <Route
              element={
                <ProtectedRoute>
                  <Layout>
                    <VirtualTryOn />
                  </Layout>
                </ProtectedRoute>
              }
              path="/try-on"
            />
            <Route
              element={
                <ProtectedRoute>
                  <Layout>
                    <Profile />
                  </Layout>
                </ProtectedRoute>
              }
              path="/profile"
            />
            
            {/* Catch-all route */}
            <Route element={<Navigate replace to="/" />} path="*" />
          </Routes>
        </Router>
        

      </ThemeProvider>
    </ErrorBoundary>
  )
}



export default App