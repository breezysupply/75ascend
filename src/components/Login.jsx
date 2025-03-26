import { useState } from 'react';
import { dataService } from '../utils/firebaseConfig';

export default function Login() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('[Login] Starting Google sign in');
      
      // Clear any existing state
      sessionStorage.removeItem('auth_redirect_pending');
      
      await dataService.signIn();
      
      // If we get here, the redirect hasn't happened yet
      console.log('[Login] Sign in initiated, waiting for redirect');
      
      // Set a timeout to reset if redirect doesn't happen
      setTimeout(() => {
        const isPendingRedirect = sessionStorage.getItem('auth_redirect_pending');
        if (isPendingRedirect && window.location.pathname === '/login') {
          console.log('[Login] Redirect timeout, resetting state');
          sessionStorage.removeItem('auth_redirect_pending');
          setLoading(false);
          setError('Sign in was interrupted. Please try again.');
        }
      }, 5000);
    } catch (error) {
      console.error('[Login] Sign in error:', error);
      setError('An error occurred during sign in. Please try again.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Starting sign in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary dark:text-blue-400">75 ASCEND</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Sign in to continue
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
} 