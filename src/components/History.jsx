import { useState } from 'react';

export default function History({ userData, saveUserData }) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  
  const handleReset = () => {
    if (confirmText !== 'RESET') return;
    
    // Add current progress to history as failed
    const startDate = new Date(userData.startDate);
    const endDate = new Date();
    const daysDifference = Math.max(1, userData.currentDay - 1); // Use currentDay - 1 to get completed days
    
    const updatedUserData = {
      ...userData,
      currentDay: 1,
      startDate: new Date().toISOString(),
      dailyLogs: [],
      history: [
        ...userData.history,
        {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          status: 'FAILED',
          days: daysDifference
        }
      ]
    };
    
    saveUserData(updatedUserData);
    setShowResetConfirm(false);
    setConfirmText('');
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 dark:text-white">Your Progress History</h2>
      
      {/* Current Progress */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 border dark:border-gray-700">
        <h3 className="font-medium text-lg dark:text-white">Current Challenge</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Started: {formatDate(userData.startDate)}</p>
        <p className="mt-2 dark:text-white">Day {userData.currentDay} of 75</p>
        <div className="mt-3 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
          <div 
            className="bg-primary dark:bg-blue-500 h-2.5 rounded-full" 
            style={{ width: `${(userData.currentDay / 75) * 100}%` }}
          ></div>
        </div>
      </div>
      
      {/* Past Attempts */}
      {userData.history.length > 0 ? (
        <div className="space-y-4">
          <h3 className="font-medium dark:text-white">Past Attempts</h3>
          {userData.history.map((attempt, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 border dark:border-gray-700">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm dark:text-gray-300">
                    {formatDate(attempt.startDate)} - {formatDate(attempt.endDate)}
                  </p>
                  <p className={`font-medium mt-1 ${attempt.status === 'SUCCESS' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {attempt.status}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Days completed</p>
                  <p className="font-medium dark:text-white">{attempt.days}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400 text-center py-6">No previous attempts yet</p>
      )}
      
      {/* Reset Button */}
      <div className="mt-8 border-t dark:border-gray-700 pt-6">
        <h3 className="font-medium text-red-600 dark:text-red-400 mb-2">Danger Zone</h3>
        {showResetConfirm ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-700 dark:text-red-300 mb-3">
              This will mark your current progress as FAILED and reset to day 1. Type RESET to confirm.
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type RESET to confirm"
              className="w-full p-2 border rounded mb-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                disabled={confirmText !== 'RESET'}
                className={`flex-1 py-2 rounded-lg text-white ${
                  confirmText === 'RESET' ? 'bg-red-600 dark:bg-red-700' : 'bg-red-300 dark:bg-red-900/50'
                }`}
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
    </div>
  );
} 