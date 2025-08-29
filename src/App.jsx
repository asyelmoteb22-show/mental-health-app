// src/App.jsx
import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  MessageCircle, 
  Smile, 
  Brain, 
  Book, 
  Eye,
  CheckSquare, 
  Bell
} from 'lucide-react';

// Import components
import Auth from './components/Auth/Auth';
import Header from './components/Layout/Header';
import BottomNav from './components/Layout/BottomNav';
import QuoteOfDay from './components/Layout/QuoteOfDay';

// Import tab components
import JournalTab from './components/Tabs/JournalTab';
import MoodTab from './components/Tabs/MoodTab';
import TodoTab from './components/Tabs/TodoTab';
import ChatTab from './components/Tabs/ChatTab';
import MeditateTab from './components/Tabs/MeditateTab';
import BooksTab from './components/Tabs/BooksTab';
import RemindersTab from './components/Tabs/RemindersTab';
import PerspectiveTab from './components/Tabs/PerspectiveTab';

// Import utilities
import { authFunctions } from './utils/auth';

const App = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('journal');
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Define tabs configuration
  const tabs = [
    { id: 'perspective', label: 'Perspective', icon: Eye },
    { id: 'journal', label: 'Journal', icon: BookOpen },
    { id: 'chat', label: 'Chat', icon: MessageCircle },
    { id: 'mood', label: 'Mood', icon: Smile },
    { id: 'meditate', label: 'Meditate', icon: Brain },
    { id: 'books', label: 'Books', icon: Book },
    { id: 'todo', label: 'To-Do', icon: CheckSquare },
    { id: 'reminders', label: 'Reminders', icon: Bell },
  ];

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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center">
        <div className="text-rose-600">Loading...</div>
      </div>
    );
  }

  // Auth state
  if (!user) {
    return <Auth onAuth={handleAuth} />;
  }

  // Main app
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50">
      {/* Header Component */}
      <Header 
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onLogout={handleLogout}
      />

      {/* Quote of the Day Component */}
      <QuoteOfDay />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 lg:pb-8">
        {activeTab === 'journal' && <JournalTab user={user} />}
        {activeTab === 'chat' && <ChatTab user={user} />}
        {activeTab === 'mood' && <MoodTab user={user} />}
        {activeTab === 'meditate' && <MeditateTab user={user} />}
        {activeTab === 'books' && <BooksTab user={user} />}
        {activeTab === 'todo' && <TodoTab user={user} />}
        {activeTab === 'reminders' && <RemindersTab user={user} />}
        {activeTab === 'perspective' && <PerspectiveTab user={user} />}
      </div>

      {/* Bottom Navigation Component (Mobile only) */}
      <BottomNav 
        activeTab={activeTab}
        onTabChange={handleTabChange}
        tabs={tabs}
      />
    </div>
  );
};

export default App;