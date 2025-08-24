import React from 'react';
import { Menu, X, LogOut } from 'lucide-react';

const Header = ({ 
  mobileMenuOpen, 
  setMobileMenuOpen, 
  tabs, 
  activeTab, 
  onTabChange, 
  onLogout 
}) => {
  return (
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
            <div className="flex items-center ml-2 lg:ml-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-rose-600">
                सुकून
              </h1>
              <span className="hidden sm:inline text-sm text-gray-500 ml-3">
                Your Mental Wellness Companion
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
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
            onClick={onLogout}
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
                onClick={() => onTabChange(tab.id)}
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
  );
};

export default Header;