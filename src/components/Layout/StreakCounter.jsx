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
        
        // Check today's activities after loading streak data
        await checkTodayActivities(data);
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
        
        // Check today's activities for new user
        await checkTodayActivities(initialData);
      }
    } catch (error) {
      console.error('Error loading streak data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkTodayActivities = async (currentStreakData) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Check if we've already marked today as complete
      const lastActive = currentStreakData.lastActiveDate ? new Date(currentStreakData.lastActiveDate) : null;
      if (lastActive) {
        lastActive.setHours(0, 0, 0, 0);
        if (lastActive.getTime() === today.getTime() && currentStreakData.todayActivities?.completed) {
          // Already completed today, no need to check activities
          return;
        }
      }
      
      // Check for journal entries today
      const journalResult = await dbFunctions.getUserDocuments('journals', user.uid);
      const todayJournals = journalResult.documents.filter(doc => {
        const docDate = doc.createdAt?.toDate ? doc.createdAt.toDate() : new Date(doc.createdAt);
        docDate.setHours(0, 0, 0, 0);
        return docDate.getTime() === today.getTime();
      });
      
      const hasJournal = todayJournals.some(j => j.type === 'journal');
      const hasGratitude = todayJournals.some(j => j.type === 'gratitude');
      
      // Check for todos created today
      const todoResult = await dbFunctions.getUserDocuments('todos', user.uid);
      const todayTodos = todoResult.documents.filter(doc => {
        const docDate = doc.createdAt?.toDate ? doc.createdAt.toDate() : new Date(doc.createdAt);
        docDate.setHours(0, 0, 0, 0);
        return docDate.getTime() === today.getTime();
      });
      
      const hasTodo = todayTodos.length > 0;
      
      // Update today's activities
      const updatedActivities = {
        journal: hasJournal,
        gratitude: hasGratitude,
        todo: hasTodo,
        completed: currentStreakData.todayActivities?.completed || false
      };
      
      setStreakData(prev => ({
        ...prev,
        todayActivities: updatedActivities
      }));
      
    } catch (error) {
      console.error('Error checking activities:', error);
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
      const { journal, gratitude, todo } = streakData.todayActivities || {};
      if (!journal || !gratitude || !todo) {
        const missing = [];
        if (!journal) missing.push('Journal Entry');
        if (!gratitude) missing.push('Gratitude Practice');
        if (!todo) missing.push('To-Do List');
        
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
      }
      
      newStreakData.lastActiveDate = new Date().toISOString();
      newStreakData.totalDaysActive = lastActive === today ? newStreakData.totalDaysActive : newStreakData.totalDaysActive + 1;
      newStreakData.todayActivities = {
        ...newStreakData.todayActivities,
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
      alert(`Day ${newStreakData.currentStreak} complete! 🎉 You completed all activities today!`);
      
    } catch (error) {
      console.error('Error marking day complete:', error);
    }
  };

  const getMilestoneMessage = () => {
    const { currentStreak } = streakData;
    
    if (currentStreak === 1) return "First day of your wellness journey! 🌱";
    if (currentStreak === 3) return "3 days of consistency! Building strong habits! 💪";
    if (currentStreak === 7) return "One week streak! You're developing discipline! 🌟";
    if (currentStreak === 14) return "Two weeks! Your commitment is admirable! 🚀";
    if (currentStreak === 21) return "21 days! You've formed a powerful habit! 🎯";
    if (currentStreak === 30) return "30 days! You're a wellness warrior! 🏆";
    if (currentStreak === 50) return "50 days! Your dedication is inspiring! 💎";
    if (currentStreak === 100) return "100 days! You're a legend! 👑";
    
    if (currentStreak > 100) return `${currentStreak} days of excellence! 🌈`;
    if (currentStreak > 50) return `${currentStreak} days strong! Keep shining! ✨`;
    if (currentStreak > 30) return `${currentStreak} days! Amazing consistency! 🌸`;
    
    return `${currentStreak} days and counting! Keep it up! 🔥`;
  };

  // Calculate completion percentage safely
  const todayActivities = streakData.todayActivities || {};
  const completedActivities = [
    todayActivities.journal,
    todayActivities.gratitude,
    todayActivities.todo
  ].filter(Boolean).length;
  
  const completionPercentage = Math.round((completedActivities / 3) * 100);

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
                <p className="text-xs text-gray-500">Complete all 3 activities daily</p>
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
                    Today's Progress
                  </h4>
                  <div className="text-sm font-medium text-gray-600">
                    {completedActivities}/3 Complete
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
                
                {/* Activity Checklist */}
                <div className="space-y-2">
                  <div className={`flex items-center justify-between p-2.5 rounded-lg transition-all ${
                    todayActivities.journal ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <div className="flex items-center gap-2">
                      <BookOpen size={16} className={todayActivities.journal ? 'text-green-600' : 'text-gray-400'} />
                      <span className="text-sm font-medium">Journal Entry</span>
                    </div>
                    {todayActivities.journal ? (
                      <CheckCircle size={16} className="text-green-600" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                    )}
                  </div>
                  
                  <div className={`flex items-center justify-between p-2.5 rounded-lg transition-all ${
                    todayActivities.gratitude ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Heart size={16} className={todayActivities.gratitude ? 'text-green-600' : 'text-gray-400'} />
                      <span className="text-sm font-medium">Gratitude Practice</span>
                    </div>
                    {todayActivities.gratitude ? (
                      <CheckCircle size={16} className="text-green-600" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                    )}
                  </div>
                  
                  <div className={`flex items-center justify-between p-2.5 rounded-lg transition-all ${
                    todayActivities.todo ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <div className="flex items-center gap-2">
                      <ListTodo size={16} className={todayActivities.todo ? 'text-green-600' : 'text-gray-400'} />
                      <span className="text-sm font-medium">To-Do List</span>
                    </div>
                    {todayActivities.todo ? (
                      <CheckCircle size={16} className="text-green-600" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                    )}
                  </div>
                </div>
                
                {/* Mark Complete Button */}
                <button
                  onClick={markDayComplete}
                  disabled={todayActivities.completed || completedActivities < 3}
                  className={`w-full mt-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                    todayActivities.completed
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : completedActivities < 3
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg transform hover:scale-105'
                  }`}
                >
                  {todayActivities.completed ? (
                    <>
                      <CheckCircle size={18} />
                      Day Complete!
                    </>
                  ) : completedActivities < 3 ? (
                    <>
                      <AlertCircle size={18} />
                      Complete All Activities First
                    </>
                  ) : (
                    <>
                      <Zap size={18} />
                      Mark Day as Complete
                    </>
                  )}
                </button>
                
                {!todayActivities.completed && completedActivities < 3 && (
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Complete all 3 activities to maintain your streak
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
                          
                          {/* Tooltip showing all activities completed */}
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
                  "Consistency in small things leads to big transformations!"
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