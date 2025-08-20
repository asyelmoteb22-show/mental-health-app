import React, { useState } from 'react';
import { Share2, RefreshCw, Eye } from 'lucide-react';
import { perspectiveQuestions } from '../../utils/constants';

const PerspectiveTab = () => {
  // State Management
  const [stage, setStage] = useState('welcome'); // 'welcome', 'questions', 'results'
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [score, setScore] = useState({
    percentage: 0,
    privilegeCount: 0,
    statistics: []
  });

  // Handle answer selection
  const handleAnswer = (answer) => {
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);
    
    if (currentQuestion < perspectiveQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateScore(newAnswers);
    }
  };

  // Calculate the final score
  const calculateScore = (userAnswers) => {
    const yesCount = userAnswers.filter(ans => ans === 'yes').length;
    const percentage = Math.round((yesCount / perspectiveQuestions.length) * 100);
    
    const privilegeStats = perspectiveQuestions.filter(
      (q, index) => userAnswers[index] === 'yes'
    );

    setScore({
      percentage,
      privilegeCount: yesCount,
      statistics: privilegeStats
    });
    setStage('results');
  };

  // Reset the quiz
  const resetQuiz = () => {
    setStage('welcome');
    setCurrentQuestion(0);
    setAnswers([]);
    setScore({
      percentage: 0,
      privilegeCount: 0,
      statistics: []
    });
  };

  // Share results
  const shareResults = () => {
    const text = `I took the Perspective Reality Check and realized I have access to ${score.privilegeCount} essential things that millions don't. It's a powerful reminder to be grateful. Try it yourself on Sukoon!`;
    
    if (navigator.share) {
      navigator.share({
        title: 'My Perspective Check Results - Sukoon',
        text: text,
        url: window.location.href
      });
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(text);
      alert('Results copied to clipboard!');
    }
  };

  return (
    <div className="h-full overflow-y-auto pb-20 bg-rose-50">
      <div className="max-w-2xl mx-auto p-4">
        
        {/* Welcome Screen */}
        {stage === 'welcome' && (
          <div className="min-h-[80vh] flex flex-col justify-center items-center text-center">
            <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 max-w-md w-full">
              <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Eye className="w-10 h-10 text-rose-500" />
              </div>
              
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                Perspective Reality Check
              </h2>
              
              <p className="text-gray-600 mb-8 leading-relaxed">
                Sometimes we forget how fortunate we are. Take this quick check to gain perspective 
                and appreciate what you have in life.
              </p>
              
              <button
                onClick={() => setStage('questions')}
                className="w-full bg-gradient-to-r from-rose-400 to-rose-500 hover:from-rose-500 hover:to-rose-600 text-white px-8 py-4 rounded-full font-medium transition-all transform hover:scale-105"
              >
                Start Reality Check
              </button>
              
              <p className="text-sm text-gray-500 mt-6">
                7 simple questions • 2 minutes
              </p>
            </div>
          </div>
        )}

        {/* Question Card */}
        {stage === 'questions' && (
          <div className="min-h-[80vh] flex flex-col justify-center">
            <div className="bg-white rounded-3xl shadow-xl p-8 md:p-10">
              
              {/* Progress Bar */}
              <div className="mb-8">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Question {currentQuestion + 1} of {perspectiveQuestions.length}</span>
                  <span>{Math.round(((currentQuestion + 1) / perspectiveQuestions.length) * 100)}%</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-rose-400 to-rose-500 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${((currentQuestion + 1) / perspectiveQuestions.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Question */}
              <div className="text-center py-8">
                <h3 className="text-2xl font-semibold text-gray-800 mb-12 leading-relaxed">
                  {perspectiveQuestions[currentQuestion].question}
                </h3>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-sm mx-auto">
                  <button
                    onClick={() => handleAnswer('yes')}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white px-12 py-4 rounded-full font-medium text-lg transition-all transform hover:scale-105"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => handleAnswer('no')}
                    className="flex-1 bg-gray-400 hover:bg-gray-500 text-white px-12 py-4 rounded-full font-medium text-lg transition-all transform hover:scale-105"
                  >
                    No
                  </button>
                </div>
              </div>
              
            </div>
          </div>
        )}

        {/* Results Screen */}
        {stage === 'results' && (
          <div className="min-h-[80vh] py-8">
            <div className="bg-white rounded-3xl shadow-xl p-8 md:p-10">
              
              {/* Header */}
              <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
                Your Perspective Score
              </h2>
              
              {/* Score Circle */}
              <div className="text-center mb-10">
                <div className="relative inline-block">
                  <div className="w-40 h-40 rounded-full bg-gradient-to-br from-rose-100 to-rose-200 flex items-center justify-center">
                    <div className="text-5xl font-bold text-rose-600">
                      {score.percentage}%
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 mt-4 text-lg">
                  You have access to <span className="font-semibold text-rose-600">{score.privilegeCount}</span> out of {perspectiveQuestions.length} essential life needs
                </p>
              </div>

              {/* Message based on score */}
              <div className="bg-rose-50 rounded-2xl p-6 mb-8 text-center">
                <p className="text-gray-700 leading-relaxed">
                  {score.percentage >= 70 
                    ? "You're incredibly fortunate! Your access to basic needs puts you among the most privileged people globally. This is a beautiful reminder to practice gratitude daily."
                    : score.percentage >= 40
                    ? "While you may face some challenges, you still have access to many essentials that millions lack. Every blessing counts, no matter how small."
                    : "Life may be challenging right now, but remember that even having access to some basics is significant. You're stronger than you know."}
                </p>
              </div>

              {/* Statistics */}
              {score.statistics.length > 0 && (
                <div className="mb-8">
                  <h3 className="font-semibold text-gray-800 mb-4 text-lg">
                    Things you have access to:
                  </h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {score.statistics.map((stat, index) => (
                      <div key={index} className="bg-gradient-to-r from-rose-50 to-pink-50 p-4 rounded-xl border border-rose-100">
                        <p className="font-medium text-gray-800">✓ {stat.question.replace('?', '')}</p>
                        <p className="text-sm text-gray-600 mt-1 italic">{stat.statistic}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reflection Message */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
                <p className="text-sm text-amber-800 text-center">
                  💭 Remember: This isn't about feeling guilty, but about finding strength in gratitude. 
                  Your struggles are still valid, and recognizing blessings can help you face them.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={shareResults}
                  className="flex-1 bg-gradient-to-r from-rose-400 to-rose-500 hover:from-rose-500 hover:to-rose-600 text-white px-6 py-3 rounded-full font-medium flex items-center justify-center gap-2 transition-all transform hover:scale-105"
                >
                  <Share2 size={20} />
                  Share Results
                </button>
                <button
                  onClick={resetQuiz}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-full font-medium flex items-center justify-center gap-2 transition-all"
                >
                  <RefreshCw size={20} />
                  Take Again
                </button>
              </div>
              
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
};

export default PerspectiveTab;