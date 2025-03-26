import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import CompletionCard from './CompletionCard';

export default function DailyChecklist({ userData, saveUserData }) {
  const [tasks, setTasks] = useState({
    workout1: false,
    workout2: false,
    diet: false,
    reading: false,
    skill: false,
    water: false,
    photo: false
  });
  const [showCompletionCard, setShowCompletionCard] = useState(false);

  useEffect(() => {
    // Find today's log that matches the current day number
    const today = new Date().toISOString().split('T')[0];
    const todayLog = userData.dailyLogs.find(log => {
      const logDate = new Date(log.date).toISOString().split('T')[0];
      return logDate === today && log.day === userData.currentDay;
    });

    if (todayLog) {
      setTasks(todayLog.tasks);
    } else {
      // Reset tasks if no log exists for today's date AND current day number
      setTasks({
        workout1: false,
        workout2: false,
        diet: false,
        reading: false,
        skill: false,
        water: false,
        photo: false
      });
    }
  }, [userData.dailyLogs, userData.currentDay]);

  const handleTaskToggle = (task) => {
    const newTasks = { ...tasks, [task]: !tasks[task] };
    setTasks(newTasks);
    
    const today = new Date().toISOString().split('T')[0];
    const updatedLogs = [...userData.dailyLogs];
    const todayLogIndex = updatedLogs.findIndex(log => {
      const logDate = new Date(log.date).toISOString().split('T')[0];
      return logDate === today && log.day === userData.currentDay;
    });
    
    if (todayLogIndex >= 0) {
      updatedLogs[todayLogIndex] = {
        ...updatedLogs[todayLogIndex],
        tasks: newTasks
      };
    } else {
      updatedLogs.push({
        date: new Date().toISOString(),
        day: userData.currentDay,
        tasks: newTasks
      });
    }
    
    saveUserData({
      ...userData,
      dailyLogs: updatedLogs
    });
  };

  const handleCompleteDay = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    setShowCompletionCard(true);
  };

  const handleCompletionClose = () => {
    setShowCompletionCard(false);
    
    // Update user data to advance to next day
    const updatedUserData = {
      ...userData,
      currentDay: userData.currentDay + 1,
      dailyLogs: [
        ...userData.dailyLogs,
        {
          date: new Date().toISOString(),
          day: userData.currentDay,
          tasks: tasks
        }
      ]
    };
    
    // If completed all 75 days
    if (updatedUserData.currentDay > 75) {
      const startDate = new Date(userData.startDate);
      const endDate = new Date();
      updatedUserData.history.push({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        status: 'SUCCESS',
        days: 75
      });
      updatedUserData.currentDay = 1;
      updatedUserData.startDate = new Date().toISOString();
      updatedUserData.dailyLogs = [];
    }
    
    saveUserData(updatedUserData);
  };

  const isDay10Multiple = userData.currentDay % 10 === 0;
  const allTasksCompleted = Object.values(tasks).every(value => value);

  return (
    <div>
      {showCompletionCard && (
        <CompletionCard 
          day={userData.currentDay} 
          onClose={handleCompletionClose} 
        />
      )}
      
      <h2 className="text-xl font-semibold mb-4">Day {userData.currentDay} Tasks</h2>
      
      <div className="space-y-3 mb-6">
        <TaskItem 
          label="45 Min Workout" 
          checked={tasks.workout1} 
          onChange={() => handleTaskToggle('workout1')}
          description="Complete your first 45-minute workout"
        />
        
        <TaskItem 
          label="30 Min Workout" 
          checked={tasks.workout2} 
          onChange={() => handleTaskToggle('workout2')}
          description={isDay10Multiple 
            ? "Complete a HIIT or high-intensity workout (Day 10 requirement)" 
            : "Complete your second 30-minute workout"}
        />
        
        <TaskItem 
          label="Follow Diet Plan" 
          checked={tasks.diet} 
          onChange={() => handleTaskToggle('diet')}
          description="Adhere to your chosen diet with no exceptions"
        />
        
        <TaskItem 
          label="Read 10 Pages" 
          checked={tasks.reading} 
          onChange={() => handleTaskToggle('reading')}
          description="Read 10 pages of a book (no audiobooks)"
        />
        
        <TaskItem 
          label="15 Min Skill Practice" 
          checked={tasks.skill} 
          onChange={() => handleTaskToggle('skill')}
          description="Spend 15 minutes learning a new skill"
        />
        
        <TaskItem 
          label="Drink 1 Gallon of Water" 
          checked={tasks.water} 
          onChange={() => handleTaskToggle('water')}
          description="Drink one gallon (3.8 liters) of water"
        />
        
        <TaskItem 
          label="Take Progress Photo" 
          checked={tasks.photo} 
          onChange={() => handleTaskToggle('photo')}
          description="Take a daily progress photo"
        />
      </div>
      
      {allTasksCompleted && (
        <button
          onClick={handleCompleteDay}
          className="w-full py-3 bg-primary text-white font-medium rounded-lg shadow-md hover:bg-primary/90 transition-colors"
        >
          Complete Day {userData.currentDay}
        </button>
      )}
    </div>
  );
}

function TaskItem({ label, checked, onChange, description }) {
  return (
    <div className="border rounded-lg p-4 bg-white dark:bg-gray-800 dark:border-gray-700">
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="h-5 w-5 text-primary rounded border-gray-300 focus:ring-primary dark:border-gray-600"
        />
        <label className="ml-3 font-medium dark:text-white">{label}</label>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 ml-8">{description}</p>
    </div>
  );
} 