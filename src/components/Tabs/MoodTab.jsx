// src/components/Tabs/MoodTab.jsx
import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, Brain, Calendar, Heart, Sparkles } from 'lucide-react';
import { dbFunctions } from '../../utils/database';
import { analyzeMoodTrends } from '../../utils/moodAnalyzer';

const MoodTab = ({ user }) => {
  const [moods, setMoods] = useState([]);
  const [moodStats, setMoodStats] = useState({ happy: 0, sad: 0, neutral: 0 });
  const [loading, setLoading] = useState(false);
  const [trendAnalysis, setTrendAnalysis] = useState(null);
  const [analyzingTrends, setAnalyzingTrends] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState(null);

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

  // Get mood details for a specific day
  const getMoodDetailsForDay = (dayIndex) => {
    const targetDate = days[dayIndex];
    return moods.filter(mood => {
      const moodDate = formatTimestamp(mood.createdAt).date;
      return moodDate === targetDate;
    });
  };

  // Get emoji based on mood score
  const getMoodEmoji = (score) => {
    if (score >= 4) return '😊';
    if (score >= 3) return '🙂';
    if (score >= 2) return '😐';
    if (score >= 1) return '😔';
    return '😢';
  };

  // Get color based on mood score
  const getMoodColor = (score) => {
    if (score >= 4) return '#10b981'; // green
    if (score >= 3) return '#84cc16'; // lime
    if (score >= 2) return '#eab308'; // yellow
    if (score >= 1) return '#f97316'; // orange
    return '#ef4444'; // red
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

      {/* Enhanced Mood Trend Graph */}
      <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white rounded-full shadow-md">
              <Heart className="text-rose-500" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Mood Journey</h2>
              <p className="text-sm text-gray-600">Your emotional landscape over the past week</p>
            </div>
          </div>
          <Sparkles className="text-purple-400" size={24} />
        </div>
        
        {moods.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-4">
              <Calendar className="text-gray-400" size={40} />
            </div>
            <p className="text-gray-600 text-lg">No mood data yet</p>
            <p className="text-gray-500 text-sm mt-2">Start journaling to see your mood trends!</p>
          </div>
        ) : (
          <div className="relative">
            <svg 
              width="100%" 
              height="300" 
              className="overflow-visible"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              onMouseLeave={() => setHoveredPoint(null)}
            >
              {/* Gradient definition */}
              <defs>
                <linearGradient id="moodGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.05" />
                </linearGradient>
                
                {/* Shadow filter */}
                <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceAlpha" stdDeviation="0.5"/>
                  <feOffset dx="0" dy="0.5" result="offsetblur"/>
                  <feFlood floodColor="#000000" floodOpacity="0.1"/>
                  <feComposite in2="offsetblur" operator="in"/>
                  <feMerge>
                    <feMergeNode/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              {/* Background grid */}
              <g className="text-gray-200">
                {[0, 1, 2, 3, 4].map((i) => (
                  <line
                    key={i}
                    x1="10"
                    y1={10 + (i * 20)}
                    x2="90"
                    y2={10 + (i * 20)}
                    stroke="currentColor"
                    strokeDasharray="1,1"
                    strokeOpacity="0.3"
                    strokeWidth="0.2"
                  />
                ))}
              </g>
              
              {/* Area chart fill */}
              <path
                d={`
                  M 10 90
                  ${data.map((value, index) => {
                    if (value === 0) return '';
                    const x = 10 + (index / (data.length - 1)) * 80;
                    const y = 90 - ((value - 1) / 4) * 80;
                    return `L ${x} ${y}`;
                  }).join(' ')}
                  L 90 90
                  Z
                `}
                fill="url(#moodGradient)"
              />
              
              {/* Line chart */}
              <path
                d={data.map((value, index) => {
                  if (value === 0) return '';
                  const x = 10 + (index / (data.length - 1)) * 80;
                  const y = 90 - ((value - 1) / 4) * 80;
                  return `${index === 0 || data[index - 1] === 0 ? 'M' : 'L'} ${x} ${y}`;
                }).join(' ')}
                fill="none"
                stroke="#f43f5e"
                strokeWidth="0.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#shadow)"
              />
              
              {/* Data points */}
              {data.map((value, index) => {
                if (value === 0) return null;
                const x = 10 + (index / (data.length - 1)) * 80;
                const y = 90 - ((value - 1) / 4) * 80;
                const isHovered = hoveredPoint === index;
                
                return (
                  <g key={index}>
                    {/* Outer ring on hover */}
                    {isHovered && (
                      <circle
                        cx={x}
                        cy={y}
                        r="3"
                        fill={getMoodColor(value)}
                        fillOpacity="0.2"
                        className="animate-pulse"
                      />
                    )}
                    
                    {/* Main point */}
                    <circle
                      cx={x}
                      cy={y}
                      r={isHovered ? "2" : "1.5"}
                      fill="white"
                      stroke={getMoodColor(value)}
                      strokeWidth="0.8"
                      filter="url(#shadow)"
                      className="cursor-pointer transition-all duration-200"
                      onMouseEnter={() => setHoveredPoint(index)}
                    />
                  </g>
                );
              })}
            </svg>
            
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 pr-2" style={{ paddingTop: '30px', paddingBottom: '30px' }}>
              <span>😊</span>
              <span>🙂</span>
              <span>😐</span>
              <span>😔</span>
              <span>😢</span>
            </div>
            
            {/* X-axis labels */}
            <div className="flex justify-between text-xs text-gray-600 mt-2 px-10">
              {days.map((day, index) => {
                const date = new Date(day);
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                
                return (
                  <div key={index} className="text-center">
                    <div className="font-medium">{dayName}</div>
                    <div className="text-gray-400">{day.split('/')[0]}/{day.split('/')[1]}</div>
                  </div>
                );
              })}
            </div>
            
            {/* Hover tooltip */}
            {hoveredPoint !== null && data[hoveredPoint] > 0 && (
              <div 
                className="absolute bg-white rounded-lg shadow-xl p-3 pointer-events-none z-10"
                style={{
                  left: `${10 + (hoveredPoint / (data.length - 1)) * 80}%`,
                  top: `${90 - ((data[hoveredPoint] - 1) / 4) * 80}%`,
                  transform: 'translate(-50%, -120%)'
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{getMoodEmoji(data[hoveredPoint])}</span>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{days[hoveredPoint]}</p>
                    <p className="text-xs text-gray-600">
                      Score: {data[hoveredPoint].toFixed(1)}/5
                    </p>
                  </div>
                </div>
                
                {getMoodDetailsForDay(hoveredPoint).length > 0 && (
                  <div className="text-xs text-gray-500 mt-1 pt-1 border-t">
                    <p>Entries: {getMoodDetailsForDay(hoveredPoint).length}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-4 justify-center">
          {[
            { emoji: '😊', label: 'Great', color: '#10b981' },
            { emoji: '🙂', label: 'Good', color: '#84cc16' },
            { emoji: '😐', label: 'Okay', color: '#eab308' },
            { emoji: '😔', label: 'Low', color: '#f97316' },
            { emoji: '😢', label: 'Hard', color: '#ef4444' }
          ].map((mood) => (
            <div key={mood.label} className="flex items-center gap-1">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: mood.color }}
              />
              <span className="text-xs text-gray-600">{mood.emoji} {mood.label}</span>
            </div>
          ))}
        </div>
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
              const moodScore = mood.moodData?.score || 3;
              const moodColor = getMoodColor(moodScore);
              
              return (
                <div 
                  key={mood.id} 
                  className="flex items-center justify-between p-2.5 sm:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  style={{ borderLeft: `4px solid ${moodColor}` }}
                >
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
                  {moodScore && (
                    <div className="text-right">
                      <div 
                        className="text-xs font-medium px-2 py-1 rounded-full"
                        style={{ 
                          backgroundColor: `${moodColor}20`,
                          color: moodColor
                        }}
                      >
                        {moodScore.toFixed(1)}/5
                      </div>
                    </div>
                  )}
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