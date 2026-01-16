import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const TestAuth = () => {
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check current session
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user || null);
      } catch (err) {
        // Error handling - user will see loading state
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user || null);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return (
    <div className="p-8 max-w-2xl mx-auto min-h-screen bg-gradient-to-br from-white via-purple-50 to-purple-100">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Authentication Debug</h1>

      {loading ? (
        <p className="text-gray-600">Loading...</p>
      ) : user ? (
        <div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <p className="text-green-600 font-semibold text-lg mb-4">
              ✅ User is Authenticated
            </p>
            <div className="space-y-2 text-sm">
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>User ID:</strong> {user.id}</p>
              <p><strong>Provider:</strong> {user.app_metadata?.provider || 'email'}</p>
              <p><strong>Created At:</strong> {user.created_at}</p>
              <p><strong>Last Sign In:</strong> {user.last_sign_in_at}</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <p className="text-blue-600 font-semibold mb-4">Session Details:</p>
            <pre className="text-xs bg-white p-4 rounded border border-blue-200 overflow-auto max-h-40">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>

          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.reload();
            }}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
      ) : (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-600 font-semibold text-lg">
            ❌ No User Authenticated
          </p>
          <p className="text-red-600 mt-2">
            Go to <a href="/login" className="underline">/login</a> to sign in
          </p>
        </div>
      )}
    </div>
  );
};
