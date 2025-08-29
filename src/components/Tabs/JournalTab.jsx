// src/components/Tabs/JournalTab.jsx
import React, { useState, useEffect } from 'react';
import { Trash2, Loader, Brain, Heart, Sparkles } from 'lucide-react';
import { dbFunctions } from '../../utils/database';
import { getDailyQuestions } from '../../utils/helpers';
import { analyzeMoodWithAI } from '../../utils/moodAnalyzer';

const JournalTab = ({ user }) => {
  const [entries, setEntries] = useState([]);
  const [newEntry, setNewEntry] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState(null);
  const [activeSection, setActiveSection] = useState('journal'); // 'journal' or 'gratitude'
  const [gratitudeEntries, setGratitudeEntries] = useState(['', '', '']);
  const [selectedPrompt, setSelectedPrompt] = useState('');
  
  const dailyQuestions = getDailyQuestions();
  
  // Gratitude prompts
  const gratitudePrompts = [
    "What made you smile today, no matter how small?",
    "Who in your life are you grateful for and why?",
    "What ability or skill do you have that you're thankful for?",
    "What experience this week taught you something valuable?",
    "What aspect of your health or body are you grateful for today?"
  ];

  useEffect(() => {
    loadEntries();
  }, [user.uid]);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const result = await dbFunctions.getUserDocuments('journals', user.uid);
      
      if (result.success) {
        setEntries(result.documents);
      } else {
        console.error('Error loading entries:', result.error);
      }
    } catch (error) {
      console.error('Error loading entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveEntry = async () => {
    if (activeSection === 'journal' && !newEntry.trim()) {
      alert('Please write something before saving!');
      return;
    }
    
    if (activeSection === 'gratitude' && gratitudeEntries.every(e => !e.trim())) {
      alert('Please write at least one thing you\'re grateful for!');
      return;
    }

    setSaving(true);
    setAnalyzing(true);
    
    try {
      let journalData;
      
      if (activeSection === 'journal') {
        // Regular journal entry with mood analysis
        const moodAnalysis = await analyzeMoodWithAI(newEntry);
        setLastAnalysis(moodAnalysis);
        
        journalData = {
          userId: user.uid,
          content: newEntry,
          question: selectedQuestion,
          type: 'journal',
          mood: moodAnalysis.mood,
          moodData: moodAnalysis.moodData,
          moodConfidence: moodAnalysis.confidence,
          emotionalTones: moodAnalysis.emotionalTones,
          keyPhrases: moodAnalysis.keyPhrases,
          suggestion: moodAnalysis.suggestion
        };
        
        // Save mood data
        const moodData = {
          userId: user.uid,
          mood: moodAnalysis.mood,
          moodData: moodAnalysis.moodData,
          journalId: journalData.id,
          journalContent: newEntry,
          confidence: moodAnalysis.confidence
        };
        
        await dbFunctions.add('moods', moodData);
      } else {
        // Gratitude entry
        const gratitudeContent = gratitudeEntries
          .filter(e => e.trim())
          .map((item, index) => `${index + 1}. ${item}`)
          .join('\n');
        
        journalData = {
          userId: user.uid,
          content: gratitudeContent,
          gratitudeItems: gratitudeEntries.filter(e => e.trim()),
          prompt: selectedPrompt,
          type: 'gratitude',
          mood: '🙏 Grateful',
          moodData: { label: 'Grateful', emoji: '🙏', score: 4 }
        };
      }
      
      const journalResult = await dbFunctions.add('journals', journalData);
      
      if (journalResult.success) {
        // Reset form
        setNewEntry('');
        setSelectedQuestion('');
        setGratitudeEntries(['', '', '']);
        setSelectedPrompt('');
        await loadEntries();
        
        // Show analysis results for journal entries
        if (activeSection === 'journal') {
          setTimeout(() => {
            setLastAnalysis(null);
          }, 5000);
        }
      } else {
        alert('Error saving entry. Please try again.');
      }
    } catch (error) {
      console.error('Error saving entry:', error);
      alert('Error saving entry. Please try again.');
    } finally {
      setSaving(false);
      setAnalyzing(false);
    }
  };

  const deleteEntry = async (entryId) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    
    try {
      const result = await dbFunctions.delete('journals', entryId);
      
      if (result.success) {
        setEntries(entries.filter(entry => entry.id !== entryId));
      } else {
        alert('Error deleting entry. Please try again.');
        await loadEntries();
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert('Error deleting entry. Please try again.');
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    
    if (timestamp.seconds) {
      const date = new Date(timestamp.seconds * 1000);
      return {
        date: date.toLocaleDateString(),
        time: date.toLocaleTimeString()
      };
    }
    
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString()
    };
  };

  const updateGratitudeEntry = (index, value) => {
    const newGratitudeEntries = [...gratitudeEntries];
    newGratitudeEntries[index] = value;
    setGratitudeEntries(newGratitudeEntries);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Section Toggle */}
      <div className="bg-white rounded-xl p-2 shadow-lg flex gap-2">
        <button
          onClick={() => setActiveSection('journal')}
          className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
            activeSection === 'journal'
              ? 'bg-rose-500 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Brain size={18} />
          <span>Journal</span>
        </button>
        <button
          onClick={() => setActiveSection('gratitude')}
          className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
            activeSection === 'gratitude'
              ? 'bg-rose-500 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Heart size={18} />
          <span>Gratitude</span>
        </button>
      </div>

      {/* Journal Section */}
      {activeSection === 'journal' && (
        <>
          {/* Daily Questions */}
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg">
            <h2 className="text-lg sm:text-xl font-semibold text-rose-600 mb-3 sm:mb-4">
              Daily Reflection Questions
            </h2>
            <div className="space-y-2">
              {dailyQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedQuestion(question)}
                  className={`w-full text-left p-3 sm:p-4 rounded-lg transition-colors text-sm sm:text-base ${
                    selectedQuestion === question 
                      ? 'bg-rose-100 text-rose-700' 
                      : 'hover:bg-rose-50'
                  }`}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>

          {/* Write Entry */}
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg">
            <h2 className="text-lg sm:text-xl font-semibold text-rose-600 mb-3 sm:mb-4">
              Write Your Entry
            </h2>
            {selectedQuestion && (
              <p className="text-sm sm:text-base text-gray-600 mb-3 italic">
                "{selectedQuestion}"
              </p>
            )}
            <textarea
              value={newEntry}
              onChange={(e) => setNewEntry(e.target.value)}
              placeholder="Share your thoughts..."
              className="w-full h-32 sm:h-40 p-3 sm:p-4 text-sm sm:text-base border border-rose-200 rounded-lg focus:outline-none focus:border-rose-400 resize-none"
              disabled={saving}
            />
            
            {/* AI Analysis Results */}
            {lastAnalysis && (
              <div className="mt-3 p-3 bg-rose-50 rounded-lg animate-fade-in">
                <div className="flex items-center gap-2 mb-2">
                  <Brain size={16} className="text-rose-600" />
                  <span className="text-sm font-semibold text-rose-600">AI Mood Analysis</span>
                </div>
                <p className="text-sm text-gray-700">
                  Detected mood: <span className="font-semibold">{lastAnalysis.mood}</span>
                  {lastAnalysis.confidence > 0.7 && 
                    <span className="text-xs text-gray-500 ml-2">(High confidence)</span>
                  }
                </p>
                {lastAnalysis.suggestion && (
                  <p className="text-sm text-gray-600 mt-1 italic">
                    💡 {lastAnalysis.suggestion}
                  </p>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Gratitude Section */}
      {activeSection === 'gratitude' && (
        <>
          {/* Gratitude Prompts */}
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg">
            <h2 className="text-lg sm:text-xl font-semibold text-rose-600 mb-3 sm:mb-4 flex items-center gap-2">
              <Sparkles size={20} />
              Gratitude Prompts
            </h2>
            <div className="space-y-2">
              {gratitudePrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedPrompt(prompt)}
                  className={`w-full text-left p-3 sm:p-4 rounded-lg transition-colors text-sm sm:text-base ${
                    selectedPrompt === prompt 
                      ? 'bg-rose-100 text-rose-700' 
                      : 'hover:bg-rose-50'
                  }`}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Gratitude Entry */}
          <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl p-4 sm:p-6 shadow-lg border border-rose-100">
            <h2 className="text-lg sm:text-xl font-semibold text-rose-600 mb-3 sm:mb-4">
              Today I'm Grateful For...
            </h2>
            {selectedPrompt && (
              <p className="text-sm sm:text-base text-gray-600 mb-4 italic">
                "{selectedPrompt}"
              </p>
            )}
            <div className="space-y-3">
              {gratitudeEntries.map((entry, index) => (
                <div key={index} className="flex items-start gap-3">
                  <span className="text-rose-500 font-semibold mt-2">{index + 1}.</span>
                  <input
                    type="text"
                    value={entry}
                    onChange={(e) => updateGratitudeEntry(index, e.target.value)}
                    placeholder={`Something you're grateful for...`}
                    className="flex-1 p-2 sm:p-3 text-sm sm:text-base bg-white border border-rose-200 rounded-lg focus:outline-none focus:border-rose-400"
                    disabled={saving}
                  />
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Save Button */}
      <div className="flex justify-center">
        <button
          onClick={saveEntry}
          disabled={
            (activeSection === 'journal' && (!newEntry.trim() || saving)) ||
            (activeSection === 'gratitude' && (gratitudeEntries.every(e => !e.trim()) || saving))
          }
          className={`px-6 sm:px-8 py-3 text-sm sm:text-base rounded-lg transition-colors flex items-center gap-2 ${
            ((activeSection === 'journal' && newEntry.trim()) || 
             (activeSection === 'gratitude' && gratitudeEntries.some(e => e.trim()))) && !saving
              ? 'bg-rose-500 text-white hover:bg-rose-600' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {analyzing && <Loader className="animate-spin" size={16} />}
          {saving ? 'Saving...' : `Save ${activeSection === 'journal' ? 'Entry' : 'Gratitude'}`}
        </button>
      </div>

      {/* Entries List */}
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg">
        <h2 className="text-lg sm:text-xl font-semibold text-rose-600 mb-3 sm:mb-4">
          Your Entries
        </h2>
        {loading ? (
          <p className="text-gray-500 text-sm sm:text-base">Loading entries...</p>
        ) : entries.length === 0 ? (
          <p className="text-gray-500 text-sm sm:text-base">
            No entries yet. Start journaling to see your thoughts here!
          </p>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {entries.map((entry) => {
              const timestamp = formatTimestamp(entry.createdAt);
              const isGratitude = entry.type === 'gratitude';
              
              return (
                <div key={entry.id} className={`border rounded-lg p-3 sm:p-4 ${
                  isGratitude ? 'border-pink-200 bg-pink-50/50' : 'border-rose-100'
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      {isGratitude ? (
                        <Heart size={16} className="text-pink-500" />
                      ) : (
                        <Brain size={16} className="text-rose-500" />
                      )}
                      <span className="text-xs sm:text-sm text-gray-500">
                        {timestamp.date} at {timestamp.time}
                      </span>
                      {entry.mood && (
                        <span className="ml-2 text-sm">
                          {entry.mood}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => deleteEntry(entry.id)}
                      className="text-red-500 hover:text-red-700 transition-colors p-1"
                    >
                      <Trash2 size={16} className="sm:w-5 sm:h-5" />
                    </button>
                  </div>
                  {(entry.question || entry.prompt) && (
                    <p className="text-xs sm:text-sm text-gray-600 italic mb-2">
                      "{entry.question || entry.prompt}"
                    </p>
                  )}
                  {isGratitude && entry.gratitudeItems ? (
                    <div className="space-y-1">
                      {entry.gratitudeItems.map((item, idx) => (
                        <p key={idx} className="text-sm sm:text-base text-gray-800 flex items-start gap-2">
                          <span className="text-pink-500">{idx + 1}.</span>
                          <span>{item}</span>
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm sm:text-base text-gray-800 whitespace-pre-wrap">
                      {entry.content}
                    </p>
                  )}
                  {entry.suggestion && (
                    <p className="text-xs sm:text-sm text-gray-600 italic mt-2 p-2 bg-gray-50 rounded">
                      💡 {entry.suggestion}
                    </p>
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

export default JournalTab;