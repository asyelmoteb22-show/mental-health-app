// src/components/Tabs/MeditateTab.jsx
import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

const MeditateTab = ({ user }) => {
  const [selectedDuration, setSelectedDuration] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState('inhale');

  const meditations = [
    { level: 'Beginner', duration: 2, description: 'Perfect for starting your practice' },
    { level: 'Intermediate', duration: 5, description: 'Deepen your mindfulness' },
    { level: 'Advanced', duration: 10, description: 'Extended peaceful session' }
  ];

  useEffect(() => {
    let interval = null;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => time - 1);
        
        const cycleTime = timeLeft % 12;
        if (cycleTime >= 8) setPhase('inhale');
        else if (cycleTime >= 4) setPhase('hold');
        else setPhase('exhale');
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      alert('Meditation session complete! Great job!');
    }
    
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const startMeditation = (minutes) => {
    setSelectedDuration(minutes);
    setTimeLeft(minutes * 60);
    setIsRunning(true);
  };

  const togglePause = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(0);
    setSelectedDuration(null);
    setPhase('inhale');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Timer Selection */}
      {!selectedDuration && (
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg">
          <h2 className="text-lg sm:text-xl font-semibold text-rose-600 mb-3 sm:mb-4">
            Choose Your Meditation
          </h2>
          <div className="space-y-3">
            {meditations.map((meditation) => (
              <button
                key={meditation.level}
                onClick={() => startMeditation(meditation.duration)}
                className="w-full p-3 sm:p-4 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors text-left"
              >
                <h3 className="font-semibold text-base sm:text-lg">
                  {meditation.level} - {meditation.duration} minutes
                </h3>
                <p className="text-gray-600 text-xs sm:text-sm">{meditation.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active Timer */}
      {selectedDuration && (
        <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg text-center">
          <h2 className="text-xl sm:text-2xl font-semibold text-rose-600 mb-4 sm:mb-6">
            {phase === 'inhale' && 'Breathe In...'}
            {phase === 'hold' && 'Hold...'}
            {phase === 'exhale' && 'Breathe Out...'}
          </h2>
          
          <div className="text-5xl sm:text-6xl font-bold text-gray-800 mb-6 sm:mb-8">
            {formatTime(timeLeft)}
          </div>
          
          <div className="flex justify-center gap-3 sm:gap-4">
            <button
              onClick={togglePause}
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors flex items-center gap-2 text-sm sm:text-base"
            >
              {isRunning ? <Pause size={18} className="sm:w-5 sm:h-5" /> : <Play size={18} className="sm:w-5 sm:h-5" />}
              {isRunning ? 'Pause' : 'Resume'}
            </button>
            
            <button
              onClick={resetTimer}
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2 text-sm sm:text-base"
            >
              <RotateCcw size={18} className="sm:w-5 sm:h-5" />
              Reset
            </button>
          </div>
        </div>
      )}

      {/* Benefits Section */}
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg">
        <h2 className="text-lg sm:text-xl font-semibold text-rose-600 mb-3 sm:mb-4">
          Benefits of Meditation
        </h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-rose-500 mt-0.5">•</span>
            <div>
              <h3 className="font-semibold text-sm sm:text-base">Reduces Stress</h3>
              <p className="text-gray-600 text-xs sm:text-sm">
                Regular meditation helps lower cortisol levels and promotes relaxation.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-rose-500 mt-0.5">•</span>
            <div>
              <h3 className="font-semibold text-sm sm:text-base">Improves Focus</h3>
              <p className="text-gray-600 text-xs sm:text-sm">
                Enhance concentration and mental clarity through mindful breathing.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-rose-500 mt-0.5">•</span>
            <div>
              <h3 className="font-semibold text-sm sm:text-base">Better Sleep</h3>
              <p className="text-gray-600 text-xs sm:text-sm">
                Evening meditation can improve sleep quality and duration.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeditateTab;