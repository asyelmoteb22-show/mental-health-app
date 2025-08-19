// src/components/Tabs/JournalTab.jsx
import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { dbFunctions } from '../../utils/database';
import { getDailyQuestions, analyzeMood } from '../../utils/helpers';

const JournalTab = ({ user }) => {
  const [entries, setEntries] = useState([]);
  const [newEntry, setNewEntry] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const dailyQuestions = getDailyQuestions();

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
    if (!newEntry.trim()) {
      alert('Please write something before saving!');
      return;
    }

    setSaving(true);
    try {
      const mood =  await analyzeMood(newEntry);
      
      const journalData = {
        userId: user.uid,
        content: newEntry,
        question: selectedQuestion,
        mood: mood
      };
      
      const journalResult = await dbFunctions.add('journals', journalData);
      
      if (journalResult.success) {
        const moodData = {
          userId: user.uid,
          mood: mood,
          journalId: journalResult.id,
          journalContent: newEntry
        };
        
        await dbFunctions.add('moods', moodData);
        
        setNewEntry('');
        setSelectedQuestion('');
        await loadEntries();
        
        alert('Entry saved successfully!');
      } else {
        alert('Error saving entry. Please try again.');
      }
    } catch (error) {
      console.error('Error saving entry:', error);
      alert('Error saving entry. Please try again.');
    } finally {
      setSaving(false);
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

  return (
    <div className="space-y-4 sm:space-y-6">
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
        <button
          onClick={saveEntry}
          disabled={!newEntry.trim() || saving}
          className={`mt-3 sm:mt-4 px-4 sm:px-6 py-2 text-sm sm:text-base rounded-lg transition-colors ${
            newEntry.trim() && !saving
              ? 'bg-rose-500 text-white hover:bg-rose-600' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {saving ? 'Saving...' : 'Save Entry'}
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
              return (
                <div key={entry.id} className="border border-rose-100 rounded-lg p-3 sm:p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs sm:text-sm text-gray-500">
                      {timestamp.date} at {timestamp.time}
                    </span>
                    <button
                      onClick={() => deleteEntry(entry.id)}
                      className="text-red-500 hover:text-red-700 transition-colors p-1"
                    >
                      <Trash2 size={16} className="sm:w-5 sm:h-5" />
                    </button>
                  </div>
                  {entry.question && (
                    <p className="text-xs sm:text-sm text-gray-600 italic mb-2">
                      "{entry.question}"
                    </p>
                  )}
                  <p className="text-sm sm:text-base text-gray-800 whitespace-pre-wrap">
                    {entry.content}
                  </p>
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