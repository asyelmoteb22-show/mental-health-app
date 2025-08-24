import React from 'react';
import { BookOpen, MessageCircle, Smile, Brain, Book, CheckSquare, Bell, Eye } from 'lucide-react';

const BottomNav = ({ activeTab, onTabChange, tabs }) => {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
      <div className="grid grid-cols-4 gap-1">
        {tabs.slice(0, 4).map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
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
  );
};

export default BottomNav;