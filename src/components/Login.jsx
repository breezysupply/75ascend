import { useState, useEffect } from 'react';
import { dataService } from '../utils/firebaseConfig';

export default function Login() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuthStatus() {
      try {
        const user = await dataService.getCurrentUser();
        if (user) {
          window.location.href = '/';
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
      } finally {
        setLoading(false);
      }
    }
    
    checkAuthStatus();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      await dataService.signIn();
      window.location.href = '/';
    } catch (error) {
      setError(error.message || 'An error occurred');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
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
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
} 