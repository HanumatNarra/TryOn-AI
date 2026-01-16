import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session from the URL (Supabase sets this automatically)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          setError('Authentication failed: ' + sessionError.message);
          // Wait 3 seconds then redirect to login
          setTimeout(() => navigate('/login?error=auth_failed'), 3000);
          return;
        }

        if (session?.user) {
          // User successfully authenticated
          // Redirect to wardrobe (main dashboard page)
          navigate('/wardrobe', { replace: true });
        } else {
          setError('No session created');
          // No session found, redirect to login
          setTimeout(() => navigate('/login?error=no_session'), 2000);
        }
      } catch (err) {
        setError('Unexpected error occurred');
        setTimeout(() => navigate('/login?error=unexpected'), 3000);
      }
    };

    // Small delay to ensure Supabase has processed the callback
    const timer = setTimeout(handleAuthCallback, 500);

    return () => clearTimeout(timer);
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-purple-50 to-purple-100">
        <div className="text-center">
          <p className="text-red-600 font-semibold mb-4">{error}</p>
          <p className="text-gray-700">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-purple-50 to-purple-100">
      <div className="text-center">
        <div className="inline-block w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-700 font-semibold">Completing sign in...</p>
      </div>
    </div>
  );
};
