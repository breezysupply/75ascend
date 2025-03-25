import React from 'react';

export default function Rules() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">75 ASCEND Rules</h2>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg p-5 border dark:border-gray-700">
        <h3 className="font-medium text-lg mb-3 dark:text-white">Program Overview</h3>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          Welcome to 75 Ascend, a transformative program designed to forge unwavering discipline and elevate your mental and physical capabilities. This is a no-excuses challenge, engineered to push beyond your boundaries and redefine your limits.
        </p>
        <p className="text-gray-700 dark:text-gray-300">
          There are zero exceptions, zero compromises, and zero second chances. Either you follow the rules completely, or you start over.
        </p>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg p-5 border dark:border-gray-700">
        <h3 className="font-medium text-lg mb-3 dark:text-white">I. Mandatory Daily Workouts</h3>
        <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
          <li>Complete two separate workouts every day</li>
          <li>Workout 1: 45 minutes duration</li>
          <li>Workout 2: 30 minutes duration</li>
          <li>Either workout can be outdoors, regardless of weather conditions</li>
          <li>Workouts can include any form of physical activity</li>
          <li>Every 10th day (Day 10, 20, 30, etc.), one workout must be a High-Intensity Interval Training (HIIT) session or another form of very high intensity workout</li>
        </ul>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg p-5 border dark:border-gray-700">
        <h3 className="font-medium text-lg mb-3 dark:text-white">II. Dietary Discipline</h3>
        <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
          <li>Follow any diet of your choosing</li>
          <li>This includes specific dietary plans (keto, vegan, paleo, etc.) or self-imposed restrictions (no processed sugar, no fast food, etc.)</li>
          <li>Absolutely NO alcohol consumption</li>
          <li>Zero cheat meals or exceptions</li>
        </ul>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg p-5 border dark:border-gray-700">
        <h3 className="font-medium text-lg mb-3 dark:text-white">III. Mental Growth</h3>
        <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
          <li>Read 10 pages of a non-fiction or fiction book every day (no audiobooks)</li>
          <li>Dedicate 15 minutes to skill acquisition daily (language learning, musical instrument, coding, etc.)</li>
          <li>If the book directly supports the skill, the reading and skill acquisition can overlap</li>
        </ul>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg p-5 border dark:border-gray-700">
        <h3 className="font-medium text-lg mb-3 dark:text-white">IV. Additional Requirements</h3>
        <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
          <li>Drink one gallon (approximately 3.8 liters) of water daily</li>
          <li>Take a daily progress photo for personal tracking and accountability</li>
        </ul>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg p-5 border dark:border-gray-700">
        <h3 className="font-medium text-lg mb-3 text-red-600 dark:text-red-400">Failure and Restart</h3>
        <p className="text-gray-700 dark:text-gray-300">
          Failure to complete any daily task results in starting the program from day one. No exceptions.
        </p>
      </div>
    </div>
  );
} 