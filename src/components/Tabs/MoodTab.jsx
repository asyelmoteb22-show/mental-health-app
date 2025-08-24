// src/components/Tabs/MoodTab.jsx
import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, Brain } from 'lucide-react';
import { dbFunctions } from '../../utils/database';
import { analyzeMoodTrends } from '../../utils/moodAnalyzer';

const MoodTab = ({ user }) => {
  const [moods, setMoods] = useState([]);
  const [moodStats, setMoodStats] = useState({ happy: 0, sad: 0, neutral: 0 });
  const [loading, setLoading] = useState(false);
  const [trendAnalysis, setTrendAnalysis] = useState(null);
  const [analyzingTrends, setAnalyzingTrends] = useState(false);

  useEffect(() => {
    loadMoods();
  }, [user.uid]);

  const loadMoods = async () => {
    try {
      setLoading(true);
      const result = await dbFunctions.getUserDocuments('moods', user.uid);
      
      if (result.success) {
        setMoods(result.documents);
        
        // Calculate stats
        const stats = { happy: 0, sad: 0, neutral: 0 };
        result.documents.forEach(mood => {
          if (mood.mood.includes('Happy') || mood.mood.includes('Excited') || mood.mood.includes('Grateful')) {
            stats.happy++;
          } else if (mood.mood.includes('Sad') || mood.mood.includes('Angry') || mood.mood.includes('Anxious')) {
            stats.sad++;
          } else {
            stats.neutral++;
          }
        });
        setMoodStats(stats);
        
        // Analyze trends if we have enough data
        if (result.documents.length >= 3) {
          analyzeTrends(result.documents);
        }
      } else {
        console.error('Error loading moods:', result.error);
      }
    } catch (error) {
      console.error('Error loading moods:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeTrends = async (moodData) => {
    setAnalyzingTrends(true);
    try {
      const analysis = await analyzeMoodTrends(moodData);
      setTrendAnalysis(analysis);
    } catch (error) {
      console.error('Error analyzing trends:', error);
    } finally {
      setAnalyzingTrends(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return { date: 'Unknown', time: 'Unknown' };
    
    let date;
    if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }
    
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString()
    };
  };

  const getLast7DaysMoodData = () => {
    const days = [];
    const data = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString();
      days.push(dateStr);
      
      const dayMoods = moods.filter(mood => {
        const moodDate = formatTimestamp(mood.createdAt).date;
        return moodDate === dateStr;
      });
      
      let score = 0;
      if (dayMoods.length > 0) {
        const totalScore = dayMoods.reduce((sum, mood) => {
          const moodScore = mood.moodData?.score || 3;
          return sum + moodScore;
        }, 0);
        score = totalScore / dayMoods.length;
      }
      
      data.push(score);
    }
    
    return { days, data };
  };

  const { days, data } = getLast7DaysMoodData();

  const getTrendIcon = () => {
    if (!trendAnalysis) return <Activity size={20} className="text-gray-400" />;
    
    switch (trendAnalysis.trend) {
      case 'improving':
        return <TrendingUp size={20} className="text-green-500" />;
      case 'declining':
        return <TrendingDown size={20} className="text-red-500" />;
      default:
        return <Activity size={20} className="text-yellow-500" />;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Mood Overview */}
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg">
        <h2 className="text-lg sm:text-xl font-semibold text-rose-600 mb-3 sm:mb-4">
          Mood Overview
        </h2>
        {loading ? (
          <p className="text-gray-500 text-center text-sm sm:text-base">Loading mood data...</p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
              <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">😊</div>
              <div className="text-xl sm:text-2xl font-bold text-green-600">{moodStats.happy}</div>
              <div className="text-xs sm:text-sm text-gray-600">Positive</div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">😐</div>
              <div className="text-xl sm:text-2xl font-bold text-yellow-600">{moodStats.neutral}</div>
              <div className="text-xs sm:text-sm text-gray-600">Neutral</div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">😔</div>
              <div className="text-xl sm:text-2xl font-bold text-blue-600">{moodStats.sad}</div>
              <div className="text-xs sm:text-sm text-gray-600">Challenging</div>
            </div>
          </div>
        )}
      </div>

      {/* AI Insights */}
      {trendAnalysis && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 sm:p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="text-purple-600" size={20} />
            <h3 className="text-lg font-semibold text-purple-800">AI Mood Insights</h3>
            {getTrendIcon()}
          </div>
          
          <div className="space-y-3">
            {/* Trend */}
            <div className="bg-white/70 rounded-lg p-3">
              <p className="text-sm font-medium text-gray-700">
                Your mood trend: 
                <span className={`ml-2 font-semibold ${
                  trendAnalysis.trend === 'improving' ? 'text-green-600' :
                  trendAnalysis.trend === 'declining' ? 'text-red-600' :
                  'text-yellow-600'
                }`}>
                  {trendAnalysis.trend.charAt(0).toUpperCase() + trendAnalysis.trend.slice(1)}
                </span>
              </p>
            </div>
            
            {/* Insights */}
            {trendAnalysis.insights.length > 0 && (
              <div className="bg-white/70 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-700 mb-2">Key Observations:</p>
                <ul className="space-y-1">
                  {trendAnalysis.insights.map((insight, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start">
                      <span className="text-purple-500 mr-2">•</span>
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Recommendation */}
            {trendAnalysis.recommendation && (
              <div className="bg-purple-100 rounded-lg p-3">
                <p className="text-sm text-purple-800">
                  <span className="font-medium">💡 Suggestion:</span> {trendAnalysis.recommendation}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mood Trend Graph */}
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg">
        <h2 className="text-lg sm:text-xl font-semibold text-rose-600 mb-3 sm:mb-4">
          7-Day Mood Trend
        </h2>
        {moods.length === 0 ? (
          <p className="text-gray-500 text-center py-8 text-sm sm:text-base">
            No mood data yet. Start journaling to see your mood trends!
          </p>
        ) : (
          <div className="relative h-48 sm:h-64">
            {/* Mood levels */}
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs sm:text-sm text-gray-500 pr-2">
              <span>😊</span>
              <span>😐</span>
              <span>😔</span>
            </div>
            
            <div className="ml-6 sm:ml-8 h-full relative">
              {/* Grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between">
                <div className="border-t border-gray-200"></div>
                <div className="border-t border-gray-200"></div>
                <div className="border-t border-gray-200"></div>
              </div>
              
              {/* Chart */}
              <svg className="absolute inset-0 w-full h-full">
                <polyline
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="2"
                  points={data.map((value, index) => {
                    const x = (index / (data.length - 1)) * 100;
                    const y = value > 0 ? 100 - ((value - 1) / 4) * 100 : 100;
                    return `${x}%,${y}%`;
                  }).join(' ')}
                />
                {data.map((value, index) => {
                  if (value === 0) return null;
                  const x = (index / (data.length - 1)) * 100;
                  const y = 100 - ((value - 1) / 4) * 100;
                  return (
                    <circle
                      key={index}
                      cx={`${x}%`}
                      cy={`${y}%`}
                      r="4"
                      fill="#f43f5e"
                    />
                  );
                })}
              </svg>
              
              {/* Date labels */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 mt-2 -mb-5 sm:-mb-6">
                {days.map((day, index) => (
                  <span key={index} className="hidden sm:inline">
                    {day.split('/')[0]}/{day.split('/')[1]}
                  </span>
                ))}
                {/* Mobile: Show only first and last date */}
                <span className="sm:hidden">{days[0].split('/')[0]}/{days[0].split('/')[1]}</span>
                <span className="sm:hidden">{days[days.length-1].split('/')[0]}/{days[days.length-1].split('/')[1]}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mood History */}
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg">
        <h2 className="text-lg sm:text-xl font-semibold text-rose-600 mb-3 sm:mb-4">
          Mood History
        </h2>
        {loading ? (
          <p className="text-gray-500 text-sm sm:text-base">Loading mood history...</p>
        ) : moods.length === 0 ? (
          <p className="text-gray-500 text-sm sm:text-base">
            No mood entries yet. Start journaling to track your moods!
          </p>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {moods.slice(0, 10).map((mood) => {
              const timestamp = formatTimestamp(mood.createdAt);
              return (
                <div key={mood.id} className="flex items-center justify-between p-2.5 sm:p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-xl sm:text-2xl">{mood.mood.split(' ')[0]}</span>
                    <div>
                      <p className="font-medium text-sm sm:text-base">{mood.mood.split(' ').slice(1).join(' ')}</p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {timestamp.date} at {timestamp.time}
                      </p>
                      {mood.confidence && mood.confidence > 0.7 && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          AI confidence: {Math.round(mood.confidence * 100)}%
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MoodTab;