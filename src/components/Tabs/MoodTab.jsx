// src/components/Tabs/MoodTab.jsx
import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, Brain, Sparkles, Flower2, Trash2 } from 'lucide-react';
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

    const deleteMood = async (moodId) => {
    try {
      setLoading(true);
      const result = await dbFunctions.deleteDocument('moods', moodId);

      if (result.success) {
        console.log('Mood deleted successfully');
        // Refresh the mood list
        loadMoods();
      } else {
        console.error('Error deleting mood:', result.error);
      }
    } catch (error) {
      console.error('Error deleting mood:', error);
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

  // Growth Garden specific functions
  const getPlantStage = (score) => {
    if (score === 0) return 'seed';
    if (score < 2) return 'sprout';
    if (score < 3) return 'growing';
    if (score < 4) return 'blooming';
    return 'flourishing';
  };
  
  const gardenHealth = data.filter(d => d > 0).length > 0 
    ? (data.reduce((a, b) => a + b, 0) / (data.filter(d => d > 0).length * 5)) * 100
    : 0;

  // Get mood color based on score
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

      {/* Growth Garden Visualization */}
      <div className="bg-gradient-to-b from-green-50 via-emerald-50 to-teal-50 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-800">Your Growth Garden</h3>
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium text-gray-600">Garden Health:</div>
            <div className="text-lg font-bold text-green-600">{Math.round(gardenHealth)}%</div>
          </div>
        </div>
        
        {/* Garden visualization */}
        <div className="bg-white/50 rounded-lg p-3 sm:p-4 mb-4">
          <div className="flex items-end justify-between h-24 sm:h-32">
            {data.map((score, index) => {
              const stage = getPlantStage(score);
              const height = (score / 5) * 100;
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center justify-end">
                  {stage !== 'seed' && (
                    <div className="relative">
                      {/* Plant stem */}
                      <div 
                        className="w-1 bg-green-500 rounded-t mx-auto transition-all duration-500"
                        style={{ height: `${height}px` }}
                      />
                      
                      {/* Flowers/Leaves */}
                      {stage === 'flourishing' && (
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                          <div className="text-xl sm:text-2xl animate-pulse">🌸</div>
                        </div>
                      )}
                      {stage === 'blooming' && (
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                          <div className="text-lg sm:text-xl">🌺</div>
                        </div>
                      )}
                      {stage === 'growing' && (
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                          <div className="text-base sm:text-lg">🌿</div>
                        </div>
                      )}
                      {stage === 'sprout' && (
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                          <div className="text-xs sm:text-sm">🌱</div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {stage === 'seed' && (
                    <div className="text-xs opacity-50">🌰</div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Soil line */}
          <div className="w-full h-3 sm:h-4 bg-gradient-to-b from-amber-700 to-amber-800 rounded mt-2"></div>
          
          {/* Day labels */}
          <div className="flex justify-between mt-2">
            {days.map((day, index) => (
              <div key={index} className="flex-1 text-center">
                <p className="text-xs text-gray-600">
                  {new Date(day).toLocaleDateString('en-US', { weekday: 'short' })[0]}
                </p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Growth insights */}
        <div className="space-y-2">
          <div className="bg-green-100 rounded-lg p-2.5 sm:p-3">
            <p className="text-xs sm:text-sm font-medium text-green-800">
              🌱 Seeds Planted: {data.filter(d => d > 0).length} days tracked
            </p>
          </div>
          
          <div className="bg-yellow-100 rounded-lg p-2.5 sm:p-3">
            <p className="text-xs sm:text-sm font-medium text-yellow-800">
              🌺 Blooms: {data.filter(d => d >= 4).length} exceptional days
            </p>
          </div>
          
          <div className="bg-blue-100 rounded-lg p-2.5 sm:p-3">
            <p className="text-xs sm:text-sm font-medium text-blue-800">
              💧 Remember: Even small plants need care. Every entry helps your garden grow!
            </p>
          </div>
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
                   <button
                    onClick={() => deleteMood(mood.id)}
                    className="text-gray-500 hover:text-red-600 transition-colors duration-200"
                    aria-label="Delete mood entry"
                  >
                    <Trash2 size={20} />
                  </button>
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