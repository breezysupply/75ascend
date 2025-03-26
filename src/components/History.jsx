import { useState, useEffect } from 'react';
import { dataService } from '../utils/firebaseConfig';

export default function History() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  
  useEffect(() => {
    // Load user data when component mounts
    const loadUserData = async () => {
      try {
        const data = await dataService.getUserData();
        setUserData(data);
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadUserData();
  }, []);
  
  const saveUserData = async (data) => {
    try {
      await dataService.saveUserData(data);
      setUserData(data);
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  };
  
  const handleReset = () => {
    if (!userData || confirmText !== 'RESET') return;
    
    // Add current progress to history as failed
    const startDate = new Date(userData.startDate);
    const endDate = new Date();
    const daysDifference = Math.max(1, userData.currentDay - 1); // Use currentDay - 1 to get completed days
    
    const updatedUserData = {
      ...userData,
      currentDay: 1,
      startDate: new Date().toISOString(),
      history: [
        ...userData.history,
        {
          startDate: userData.startDate,
          endDate: endDate.toISOString(),
          daysCompleted: daysDifference,
          status: 'FAILED!',
        }
      ],
      dailyLogs: []
    };
    
    saveUserData(updatedUserData);
    setShowResetConfirm(false);
    setConfirmText('');
  };
  
  const handleClearHistory = async () => {
    if (!userData) return;
    
    const updatedUserData = {
      ...userData,
      history: []
    };
    
    await saveUserData(updatedUserData);
    setShowClearConfirm(false);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!userData) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
        <p className="text-center text-gray-700 dark:text-gray-300">
          No challenge data found. Start a new challenge from the dashboard.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
        <h2 className="text-xl font-semibold mb-4 dark:text-white">Current Challenge</h2>
        <p className="text-gray-700 dark:text-gray-300">
          <strong>Start Date:</strong> {new Date(userData.startDate).toLocaleDateString()}
        </p>
        <p className="text-gray-700 dark:text-gray-300">
          <strong>Current Day:</strong> {userData.currentDay}
        </p>
      </div>
      
      {userData.history && userData.history.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
          <h2 className="text-xl font-semibold mb-4 dark:text-white">Previous Attempts</h2>
          <div className="space-y-4">
            {userData.history.map((attempt, index) => (
              <div key={index} className="border-b pb-4 dark:border-gray-700 last:border-0">
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Dates:</strong> {new Date(attempt.startDate).toLocaleDateString()} - {new Date(attempt.endDate).toLocaleDateString()}
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Days Completed:</strong> {attempt.daysCompleted}
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Status:</strong> <span className={attempt.status === 'completed' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>{attempt.status}</span>
                </p>
                {attempt.notes && (
                  <p className="text-gray-700 dark:text-gray-300">
                    <strong>Notes:</strong> {attempt.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
          <p className="text-center text-gray-700 dark:text-gray-300">
            No previous challenge attempts found.
          </p>
        </div>
      )}
      
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-red-600 dark:text-red-400">Reset Challenge</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          This will reset your current challenge progress and add it to your history as a failed attempt.
        </p>
        
        {showResetConfirm ? (
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              Type <strong>RESET</strong> to confirm:
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <div className="flex space-x-4">
              <button
                onClick={handleReset}
                disabled={confirmText !== 'RESET'}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50"
              >
                Reset Challenge
              </button>
              <button
                onClick={() => {
                  setShowResetConfirm(false);
                  setConfirmText('');
                }}
                className="flex-1 py-2 border rounded-lg dark:border-gray-700 dark:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="w-full py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg"
          >
            Hard Reset Challenge
          </button>
        )}
      </div>
      
      {userData?.history?.length > 0 && (
        <button
          onClick={() => setShowClearConfirm(true)}
          className="mt-6 text-red-600 dark:text-red-400 text-sm hover:underline"
        >
          Clear All History
        </button>
      )}

      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-xl font-bold mb-4">Clear History</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to clear all history? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleClearHistory}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700"
              >
                Clear History
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 border border-gray-300 dark:border-gray-600 py-2 rounded-lg font-medium dark:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 