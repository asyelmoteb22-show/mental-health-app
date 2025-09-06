// src/components/Layout/StreakCounter.jsx
import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Trophy, 
  Star, 
  TrendingUp,
  Calendar,
  X,
  Award,
  Zap,
  CheckCircle,
  BookOpen,
  Heart,
  ListTodo,
  AlertCircle
} from 'lucide-react';
import { dbFunctions } from '../../utils/database';

const StreakCounter = ({ user, show, onClose }) => {
  const [streakData, setStreakData] = useState({
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: null,
    totalDaysActive: 0,
    streakHistory: [],
    todayActivities: {
      journal: false,
      gratitude: false,
      todo: false,
      completed: false
    }
  });
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [manualActivities, setManualActivities] = useState({
    journal: false,
    gratitude: false,
    todo: false
  });

  useEffect(() => {
    if (user?.uid) {
      loadStreakData();
    }
  }, [user?.uid]);

  const loadStreakData = async () => {
    try {
      setLoading(true);
      
      // Get or create user's streak data
      const result = await dbFunctions.getDocument('streaks', user.uid);
      
      if (result.success && result.document) {
        // Ensure todayActivities exists with default values
        const data = {
          ...result.document,
          todayActivities: result.document.todayActivities || {
            journal: false,
            gratitude: false,
            todo: false,
            completed: false
          }
        };
        setStreakData(data);
        
        // Check if today is a new day and reset manual activities
        const today = new Date().toDateString();
        const lastActive = data.lastActiveDate ? new Date(data.lastActiveDate).toDateString() : null;
        
        if (lastActive === today && data.todayActivities?.completed) {
          // Today already completed, show all activities as done
          setManualActivities({
            journal: true,
            gratitude: true,
            todo: true
          });
        } else if (lastActive !== today) {
          // New day, reset manual activities
          setManualActivities({
            journal: false,
            gratitude: false,
            todo: false
          });
        } else {
          // Same day but not completed, load saved manual activities
          const savedToday = data.todayActivities || {};
          setManualActivities({
            journal: savedToday.journal || false,
            gratitude: savedToday.gratitude || false,
            todo: savedToday.todo || false
          });
        }
      } else {
        // Initialize streak data for new user
        const initialData = {
          userId: user.uid,
          currentStreak: 0,
          longestStreak: 0,
          lastActiveDate: null,
          totalDaysActive: 0,
          streakHistory: [],
          todayActivities: {
            journal: false,
            gratitude: false,
            todo: false,
            completed: false
          }
        };
        
        await dbFunctions.setDocument('streaks', user.uid, initialData);
        setStreakData(initialData);
        setManualActivities({
          journal: false,
          gratitude: false,
          todo: false
        });
      }
    } catch (error) {
      console.error('Error loading streak data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleActivity = async (activity) => {
    // Don't allow changes if today is already marked complete
    const today = new Date().toDateString();
    const lastActive = streakData.lastActiveDate ? new Date(streakData.lastActiveDate).toDateString() : null;
    
    if (lastActive === today && streakData.todayActivities?.completed) {
      return; // Already completed today
    }
    
    // Update local state
    const newManualActivities = {
      ...manualActivities,
      [activity]: !manualActivities[activity]
    };
    setManualActivities(newManualActivities);
    
    // Update streak data with new activity state
    try {
      const updatedStreakData = {
        ...streakData,
        todayActivities: {
          ...streakData.todayActivities,
          ...newManualActivities,
          completed: false // Not complete until all done and marked
        }
      };
      
      await dbFunctions.setDocument('streaks', user.uid, updatedStreakData);
      setStreakData(updatedStreakData);
    } catch (error) {
      console.error('Error updating activity:', error);
    }
  };

  const markDayComplete = async () => {
    try {
      const today = new Date().toDateString();
      const lastActive = streakData.lastActiveDate ? new Date(streakData.lastActiveDate).toDateString() : null;
      
      // Check if already marked complete today
      if (lastActive === today && streakData.todayActivities?.completed) {
        alert('You already marked today as complete!');
        return;
      }
      
      // Check if ALL activities are done
      if (!manualActivities.journal || !manualActivities.gratitude || !manualActivities.todo) {
        const missing = [];
        if (!manualActivities.journal) missing.push('Journal Entry');
        if (!manualActivities.gratitude) missing.push('Gratitude Practice');
        if (!manualActivities.todo) missing.push('To-Do List');
        
        alert(`Please complete all activities first!\n\nMissing: ${missing.join(', ')}`);
        return;
      }
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toDateString();
      
      let newStreakData = { ...streakData };
      
      if (lastActive === yesterdayString || (lastActive === today && !streakData.todayActivities?.completed)) {
        // Continuing streak
        newStreakData.currentStreak = lastActive === today ? newStreakData.currentStreak : newStreakData.currentStreak + 1;
        newStreakData.longestStreak = Math.max(newStreakData.currentStreak, newStreakData.longestStreak);
      } else if (!lastActive || lastActive !== today) {
        // Starting new streak or broke streak
        newStreakData.currentStreak = 1;
        newStreakData.longestStreak = Math.max(1, newStreakData.longestStreak);
      }
      
      newStreakData.lastActiveDate = new Date().toISOString();
      newStreakData.totalDaysActive = lastActive === today ? newStreakData.totalDaysActive : newStreakData.totalDaysActive + 1;
      newStreakData.todayActivities = {
        journal: true,
        gratitude: true,
        todo: true,
        completed: true
      };
      
      // Add to history with activities done
      const todayHistory = {
        date: new Date().toISOString(),
        streak: newStreakData.currentStreak,
        activities: {
          journal: true,
          gratitude: true,
          todo: true
        }
      };
      
      newStreakData.streakHistory = [...(newStreakData.streakHistory || []), todayHistory];
      
      // Keep only last 30 days of history
      if (newStreakData.streakHistory.length > 30) {
        newStreakData.streakHistory = newStreakData.streakHistory.slice(-30);
      }
      
      await dbFunctions.setDocument('streaks', user.uid, newStreakData);
      setStreakData(newStreakData);
      
      // Show celebration message
      alert(`🎉 Day ${newStreakData.currentStreak} complete! Great job completing all activities!`);
      
    } catch (error) {
      console.error('Error marking day complete:', error);
      alert('Error saving your progress. Please try again.');
    }
  };

  const getMilestoneMessage = () => {
    const { currentStreak } = streakData;
    
    if (currentStreak === 0) return "Start your wellness journey today! 🌱";
    if (currentStreak === 1) return "First day complete! You're on your way! 🌟";
    if (currentStreak === 3) return "3 days strong! Building momentum! 💪";
    if (currentStreak === 7) return "One week streak! You're forming habits! 🎯";
    if (currentStreak === 14) return "Two weeks! Your consistency is paying off! 🚀";
    if (currentStreak === 21) return "21 days! You've built a solid habit! 🏆";
    if (currentStreak === 30) return "30 days! You're a wellness warrior! 💎";
    if (currentStreak === 50) return "50 days! Your dedication is inspiring! 👑";
    if (currentStreak === 100) return "100 days! You're a legend! 🌈";
    
    if (currentStreak > 100) return `${currentStreak} days of excellence! Keep shining! ✨`;
    if (currentStreak > 50) return `${currentStreak} days strong! Amazing dedication! 🌸`;
    if (currentStreak > 30) return `${currentStreak} days! Outstanding consistency! 🔥`;
    
    return `${currentStreak} days and growing! Keep it up! 💪`;
  };

  // Calculate completion percentage
  const completedActivities = [
    manualActivities.journal,
    manualActivities.gratitude,
    manualActivities.todo
  ].filter(Boolean).length;
  
  const completionPercentage = Math.round((completedActivities / 3) * 100);
  
  // Check if today is already completed
  const today = new Date().toDateString();
  const lastActive = streakData.lastActiveDate ? new Date(streakData.lastActiveDate).toDateString() : null;
  const todayCompleted = lastActive === today && streakData.todayActivities?.completed;

  if (!show) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />
      
      {/* Streak Popup */}
      <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
        <div className="bg-white rounded-2xl shadow-2xl p-6 w-96 max-w-[calc(100vw-2rem)]">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center animate-pulse-slow">
                  <Flame className="text-white" size={24} />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Daily Wellness Streak</h3>
                <p className="text-xs text-gray-500">Check off your daily activities</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500 mx-auto"></div>
            </div>
          ) : (
            <>
              {/* Current Streak */}
              <div className="bg-gradient-to-r from-orange-100 to-red-100 rounded-xl p-4 mb-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-orange-600 mb-1">
                    {streakData.currentStreak}
                  </div>
                  <div className="text-sm text-gray-700 font-medium">
                    {streakData.currentStreak === 1 ? 'Day' : 'Days'} in a row
                  </div>
                </div>
                <p className="text-center text-sm text-gray-600 mt-3 font-medium">
                  {getMilestoneMessage()}
                </p>
              </div>

              {/* Today's Progress */}
              <div className="bg-blue-50 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Calendar size={18} />
                    Today's Activities
                  </h4>
                  <div className="text-sm font-medium text-gray-600">
                    {completedActivities}/3 Done
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
                
                {/* Activity Checklist - Manual Checkboxes */}
                <div className="space-y-2">
                  <button
                    onClick={() => toggleActivity('journal')}
                    disabled={todayCompleted}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg transition-all ${
                      manualActivities.journal ? 'bg-green-100' : 'bg-gray-100'
                    } ${todayCompleted ? 'cursor-not-allowed opacity-75' : 'cursor-pointer hover:shadow-sm'}`}
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen size={16} className={manualActivities.journal ? 'text-green-600' : 'text-gray-400'} />
                      <span className="text-sm font-medium">Journal Entry</span>
                    </div>
                    {manualActivities.journal ? (
                      <CheckCircle size={16} className="text-green-600" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => toggleActivity('gratitude')}
                    disabled={todayCompleted}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg transition-all ${
                      manualActivities.gratitude ? 'bg-green-100' : 'bg-gray-100'
                    } ${todayCompleted ? 'cursor-not-allowed opacity-75' : 'cursor-pointer hover:shadow-sm'}`}
                  >
                    <div className="flex items-center gap-2">
                      <Heart size={16} className={manualActivities.gratitude ? 'text-green-600' : 'text-gray-400'} />
                      <span className="text-sm font-medium">Gratitude Practice</span>
                    </div>
                    {manualActivities.gratitude ? (
                      <CheckCircle size={16} className="text-green-600" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => toggleActivity('todo')}
                    disabled={todayCompleted}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg transition-all ${
                      manualActivities.todo ? 'bg-green-100' : 'bg-gray-100'
                    } ${todayCompleted ? 'cursor-not-allowed opacity-75' : 'cursor-pointer hover:shadow-sm'}`}
                  >
                    <div className="flex items-center gap-2">
                      <ListTodo size={16} className={manualActivities.todo ? 'text-green-600' : 'text-gray-400'} />
                      <span className="text-sm font-medium">To-Do List</span>
                    </div>
                    {manualActivities.todo ? (
                      <CheckCircle size={16} className="text-green-600" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                    )}
                  </button>
                </div>
                
                {/* Mark Complete Button */}
                <button
                  onClick={markDayComplete}
                  disabled={todayCompleted || completedActivities < 3}
                  className={`w-full mt-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                    todayCompleted
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : completedActivities < 3
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg transform hover:scale-105'
                  }`}
                >
                  {todayCompleted ? (
                    <>
                      <CheckCircle size={18} />
                      Today Complete!
                    </>
                  ) : completedActivities < 3 ? (
                    <>
                      <AlertCircle size={18} />
                      Complete All Activities First
                    </>
                  ) : (
                    <>
                      <Zap size={18} />
                      Complete Day & Add to Streak
                    </>
                  )}
                </button>
                
                {!todayCompleted && completedActivities < 3 && (
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Check off all 3 activities to increase your streak
                  </p>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <Trophy className="text-purple-500 mx-auto mb-1" size={20} />
                  <div className="text-lg font-bold text-purple-700">
                    {streakData.longestStreak}
                  </div>
                  <div className="text-xs text-gray-600">Best Streak</div>
                </div>
                
                <div className="bg-pink-50 rounded-lg p-3 text-center">
                  <Star className="text-pink-500 mx-auto mb-1" size={20} />
                  <div className="text-lg font-bold text-pink-700">
                    {streakData.totalDaysActive}
                  </div>
                  <div className="text-xs text-gray-600">Total Days</div>
                </div>
              </div>

              {/* Show Details Button */}
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-full py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors flex items-center justify-center gap-2"
              >
                <TrendingUp size={16} />
                {showDetails ? 'Hide' : 'Show'} Activity History
              </button>

              {/* Activity History */}
              {showDetails && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Last 30 Days</h4>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: 30 }, (_, i) => {
                      const date = new Date();
                      date.setDate(date.getDate() - (29 - i));
                      const dateString = date.toDateString();
                      const historyItem = (streakData.streakHistory || []).find(
                        h => new Date(h.date).toDateString() === dateString
                      );
                      const isActive = !!historyItem;
                      const isToday = dateString === new Date().toDateString();
                      
                      return (
                        <div
                          key={i}
                          className={`aspect-square rounded flex items-center justify-center text-xs relative group ${
                            isActive
                              ? 'bg-gradient-to-br from-rose-400 to-pink-500 text-white font-bold'
                              : 'bg-gray-200'
                          } ${isToday ? 'ring-2 ring-rose-500 ring-offset-1' : ''}`}
                          title={date.toLocaleDateString()}
                        >
                          {isActive && historyItem.streak}
                          
                          {/* Tooltip */}
                          {isActive && (
                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                              All activities ✓
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                    <span>30 days ago</span>
                    <span>Today</span>
                  </div>
                </div>
              )}

              {/* Motivational Footer */}
              <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                <p className="text-xs text-center text-gray-700 italic">
                  "Small daily actions lead to extraordinary results!"
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
      `}</style>
    </>
  );
};

export default StreakCounter;