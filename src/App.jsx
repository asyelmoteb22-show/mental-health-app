// src/App.jsx
import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  MessageCircle, 
  Smile, 
  Brain, 
  Book, 
  CheckSquare, 
  Bell,
  LogOut
} from 'lucide-react';

// Import all components
import Auth from './components/Auth/Auth';
import JournalTab from './components/Tabs/JournalTab';
import MoodTab from './components/Tabs/MoodTab';
import TodoTab from './components/Tabs/TodoTab';
import ChatTab from './components/Tabs/ChatTab';
import MeditateTab from './components/Tabs/MeditateTab';
import BooksTab from './components/Tabs/BooksTab';
import RemindersTab from './components/Tabs/RemindersTab';

// Import utilities
import { authFunctions } from './utils/auth';
import { getQuoteOfDay } from './utils/helpers';

const App = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('journal');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = authFunctions.onAuthStateChange((firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email
        });
      } else {
        // User is signed out
        setUser(null);
      }
      setLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  const handleAuth = () => {
    // This will be called after successful login/signup
    // The auth state listener will handle setting the user
  };

  const handleLogout = async () => {
    const result = await authFunctions.signOut();
    if (!result.success) {
      alert('Error signing out. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center">
        <div className="text-rose-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Auth onAuth={handleAuth} />;
  }

  const tabs = [
    { id: 'journal', label: 'Journal', icon: BookOpen },
    { id: 'chat', label: 'Chat', icon: MessageCircle },
    { id: 'mood', label: 'Mood', icon: Smile },
    { id: 'meditate', label: 'Meditate', icon: Brain },
    { id: 'books', label: 'Books', icon: Book },
    { id: 'todo', label: 'To-Do', icon: CheckSquare },
    { id: 'reminders', label: 'Reminders', icon: Bell },
  ];

  const quote = getQuoteOfDay();

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-rose-600">MindfulMe</h1>
          <button
            onClick={handleLogout}
            className="text-gray-600 hover:text-gray-800 flex items-center gap-2"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </div>

      {/* Quote of the Day */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-rose-600 mb-2">Quote of the Day</h2>
          <p className="text-gray-700 italic">{quote}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 pb-24">
        {activeTab === 'journal' && <JournalTab user={user} />}
        {activeTab === 'chat' && <ChatTab user={user} />}
        {activeTab === 'mood' && <MoodTab user={user} />}
        {activeTab === 'meditate' && <MeditateTab user={user} />}
        {activeTab === 'books' && <BooksTab user={user} />}
        {activeTab === 'todo' && <TodoTab user={user} />}
        {activeTab === 'reminders' && <RemindersTab user={user} />}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-around py-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center p-2 ${
                    activeTab === tab.id ? 'text-rose-600' : 'text-gray-400'
                  }`}
                >
                  <Icon size={24} />
                  <span className="text-xs mt-1">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;