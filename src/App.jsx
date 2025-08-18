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
  LogOut,
  Menu,
  X
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = authFunctions.onAuthStateChange((firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAuth = () => {
    // Auth state listener will handle setting the user
  };

  const handleLogout = async () => {
    const result = await authFunctions.signOut();
    if (!result.success) {
      alert('Error signing out. Please try again.');
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
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
      <div className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Mobile Menu Button */}
            <div className="flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <h1 className="text-xl sm:text-2xl font-bold text-rose-600 ml-2 lg:ml-0">MindfulMe</h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 py-2 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'text-rose-600 border-rose-600'
                      : 'text-gray-600 border-transparent hover:text-gray-900'
                  }`}
                >
                  <tab.icon size={20} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-800 flex items-center gap-2 text-sm sm:text-base"
            >
              <LogOut size={20} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-200">
            <nav className="px-4 py-2 space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'bg-rose-50 text-rose-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon size={20} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        )}
      </div>

      {/* Quote of the Day */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg">
          <h2 className="text-base sm:text-lg font-semibold text-rose-600 mb-2">Quote of the Day</h2>
          <p className="text-sm sm:text-base text-gray-700 italic">{quote}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 lg:pb-8">
        {activeTab === 'journal' && <JournalTab user={user} />}
        {activeTab === 'chat' && <ChatTab user={user} />}
        {activeTab === 'mood' && <MoodTab user={user} />}
        {activeTab === 'meditate' && <MeditateTab user={user} />}
        {activeTab === 'books' && <BooksTab user={user} />}
        {activeTab === 'todo' && <TodoTab user={user} />}
        {activeTab === 'reminders' && <RemindersTab user={user} />}
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="grid grid-cols-4 gap-1">
          {tabs.slice(0, 4).map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex flex-col items-center py-2 ${
                  activeTab === tab.id ? 'text-rose-600' : 'text-gray-400'
                }`}
              >
                <Icon size={20} />
                <span className="text-xs mt-1">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default App;