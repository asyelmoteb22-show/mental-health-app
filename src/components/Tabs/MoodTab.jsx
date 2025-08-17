// src/components/Tabs/MoodTab.jsx
import React, { useState, useEffect } from 'react';
import { dbFunctions } from '../../utils/database';

const MoodTab = ({ user }) => {
  const [moods, setMoods] = useState([]);
  const [moodStats, setMoodStats] = useState({ happy: 0, sad: 0, neutral: 0 });
  const [loading, setLoading] = useState(false);

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
          if (mood.mood.includes('Happy')) stats.happy++;
          else if (mood.mood.includes('Sad')) stats.sad++;
          else stats.neutral++;
        });
        setMoodStats(stats);
      } else {
        console.error('Error loading moods:', result.error);
      }
    } catch (error) {
      console.error('Error loading moods:', error);
    } finally {
      setLoading(false);
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
          if (mood.mood.includes('Happy')) return sum + 3;
          if (mood.mood.includes('Neutral')) return sum + 2;
          return sum + 1;
        }, 0);
        score = totalScore / dayMoods.length;
      }
      
      data.push(score);
    }
    
    return { days, data };
  };

  const { days, data } = getLast7DaysMoodData();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h2 className="text-xl font-semibold text-rose-600 mb-4">Mood Overview</h2>
        {loading ? (
          <p className="text-gray-500 text-center">Loading mood data...</p>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl mb-2">😊</div>
              <div className="text-2xl font-bold text-green-600">{moodStats.happy}</div>
              <div className="text-sm text-gray-600">Happy</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-3xl mb-2">😐</div>
              <div className="text-2xl font-bold text-yellow-600">{moodStats.neutral}</div>
              <div className="text-sm text-gray-600">Neutral</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl mb-2">😔</div>
              <div className="text-2xl font-bold text-blue-600">{moodStats.sad}</div>
              <div className="text-sm text-gray-600">Sad</div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h2 className="text-xl font-semibold text-rose-600 mb-4">7-Day Mood Trend</h2>
        {moods.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No mood data yet. Start journaling to see your mood trends!
          </p>
        ) : (
          <div className="relative h-64">
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-sm text-gray-500 pr-2">
              <span>😊</span>
              <span>😐</span>
              <span>😔</span>
            </div>
            
            <div className="ml-8 h-full relative">
              <div className="absolute inset-0 flex flex-col justify-between">
                <div className="border-t border-gray-200"></div>
                <div className="border-t border-gray-200"></div>
                <div className="border-t border-gray-200"></div>
              </div>
              
              <svg className="absolute inset-0 w-full h-full">
                <polyline
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="2"
                  points={data.map((value, index) => {
                    const x = (index / (data.length - 1)) * 100;
                    const y = value > 0 ? 100 - ((value - 1) / 2) * 100 : 100;
                    return `${x}%,${y}%`;
                  }).join(' ')}
                />
                {data.map((value, index) => {
                  if (value === 0) return null;
                  const x = (index / (data.length - 1)) * 100;
                  const y = 100 - ((value - 1) / 2) * 100;
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
              
              <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 mt-2 -mb-6">
                {days.map((day, index) => (
                  <span key={index}>{day.split('/')[0]}/{day.split('/')[1]}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h2 className="text-xl font-semibold text-rose-600 mb-4">Mood History</h2>
        {loading ? (
          <p className="text-gray-500">Loading mood history...</p>
        ) : moods.length === 0 ? (
          <p className="text-gray-500">No mood entries yet. Start journaling to track your moods!</p>
        ) : (
          <div className="space-y-3">
            {moods.slice(0, 10).map((mood) => {
              const timestamp = formatTimestamp(mood.createdAt);
              return (
                <div key={mood.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{mood.mood.split(' ')[0]}</span>
                    <div>
                      <p className="font-medium">{mood.mood.split(' ')[1]}</p>
                      <p className="text-sm text-gray-500">
                        {timestamp.date} at {timestamp.time}
                      </p>
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