import { useState, useEffect } from 'react';
import DailyChecklist from './DailyChecklist';
import History from './History';
import Rules from './Rules';
import { dataService } from '../utils/firebaseConfig';

// Add this line to define isDevelopment
const isDevelopment = import.meta.env.DEV || process.env.NODE_ENV === 'development';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('checklist');
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        console.log('[Dashboard] Starting dashboard initialization');
        
        if (isDevelopment) {
          const data = await dataService.getUserData();
          if (data) {
            console.log('[Dashboard] Development mode: Loading mock data');
            setUserData(data);
          }
          return;
        }

        const { initializeFirebase, handleAuthState } = await import('../utils/firebaseConfig');
        await initializeFirebase();
        
        console.log('[Dashboard] Checking auth state');
        const user = await handleAuthState(false);
        if (!user) {
          console.log('[Dashboard] No user found, waiting for redirect');
          return;
        }
        
        console.log('[Dashboard] Loading user data');
        const data = await dataService.getUserData();
        if (data) {
          console.log('[Dashboard] User data loaded successfully');
          setUserData(data);
        }
      } catch (err) {
        console.error('[Dashboard] Error in dashboard initialization:', err);
        setError('Failed to load dashboard data. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  const saveUserData = async (data) => {
    try {
      // Use the dataService to save user data to DynamoDB
      await dataService.saveUserData(data);
      setUserData(data);
    } catch (error) {
      console.error('Error saving user data:', error);
      // Fallback to localStorage for development/testing
      localStorage.setItem('75ascend-data', JSON.stringify(data));
      setUserData(data);
    }
  };
  
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('75ascend-darkmode', newDarkMode.toString());
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      await dataService.signOut();
      // signOut method now handles the redirect
    } catch (error) {
      console.error('Error signing out:', error);
      setError('Failed to sign out. Please try again.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 my-4">
        <p className="text-red-700 dark:text-red-400">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 px-4 py-2 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!userData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-md mx-auto p-4 min-h-screen transition-colors duration-200">
      <header className="text-center mb-8 relative">
        <button 
          onClick={toggleDarkMode}
          className="absolute right-10 top-0 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          aria-label="Toggle dark mode"
        >
          {darkMode ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
        
        <button 
          onClick={() => setShowLogoutConfirm(true)}
          className="absolute right-0 top-0 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          aria-label="Logout"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
        
        <h1 className="text-3xl font-bold text-primary dark:text-blue-400">75 ASCEND</h1>
        <p className="text-sm mt-2 dark:text-gray-300">Day {userData.currentDay} of 75</p>
      </header>

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-medium mb-4 dark:text-white">Log out?</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Your progress is saved. You can log back in anytime to continue your challenge.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleLogout}
                className="flex-1 bg-primary text-white py-2 rounded-lg font-medium"
              >
                Yes, Log Out
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 border border-gray-300 dark:border-gray-600 py-2 rounded-lg font-medium dark:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="flex border-b mb-6 dark:border-gray-700">
        <button
          className={`flex-1 py-2 font-medium ${
            activeTab === 'checklist' 
              ? 'text-primary dark:text-blue-400 border-b-2 border-primary dark:border-blue-400' 
              : 'text-gray-500 dark:text-gray-400'
          }`}
          onClick={() => setActiveTab('checklist')}
        >
          Daily Checklist
        </button>
        <button
          className={`flex-1 py-2 font-medium ${
            activeTab === 'history' 
              ? 'text-primary dark:text-blue-400 border-b-2 border-primary dark:border-blue-400' 
              : 'text-gray-500 dark:text-gray-400'
          }`}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
        <button
          className={`flex-1 py-2 font-medium ${
            activeTab === 'rules' 
              ? 'text-primary dark:text-blue-400 border-b-2 border-primary dark:border-blue-400' 
              : 'text-gray-500 dark:text-gray-400'
          }`}
          onClick={() => setActiveTab('rules')}
        >
          Rules
        </button>
      </nav>

      {activeTab === 'checklist' ? (
        <DailyChecklist userData={userData} saveUserData={saveUserData} />
      ) : activeTab === 'history' ? (
        <History userData={userData} saveUserData={saveUserData} />
      ) : (
        <Rules />
      )}
    </div>
  );
} 