// src/components/Tabs/VisionBoardTab.jsx
import React, { useState, useEffect } from 'react';
import { 
  Target, 
  Plus, 
  Trash2, 
  Upload, 
  Image as ImageIcon,
  List,
  Grid,
  Calendar,
  CheckCircle,
  Edit2,
  Save,
  X,
  Sparkles,
  Star,
  Heart,
  Trophy,
  Zap,
  Sun,
  Moon,
  Cloud,
  Rainbow
} from 'lucide-react';
import { dbFunctions } from '../../utils/database';

const VisionBoardTab = ({ user }) => {
  // State Management
  const [activeView, setActiveView] = useState('board'); // 'board' or 'goals'
  const [visionItems, setVisionItems] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Vision Board States
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newVisionItem, setNewVisionItem] = useState({
    title: '',
    description: '',
    category: 'personal',
    imageUrl: '',
    color: '#FEE2E2', // default rose-100
    emoji: '⭐' // Add emoji option
  });
  
  // Goals List States
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    category: 'personal',
    targetDate: '',
    milestones: ['']
  });
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [showGoalModal, setShowGoalModal] = useState(false);

  // Categories for both vision board and goals
  const categories = [
    { id: 'all', label: 'All', emoji: '✨' },
    { id: 'personal', label: 'Personal', emoji: '🌟' },
    { id: 'career', label: 'Career', emoji: '💼' },
    { id: 'health', label: 'Health', emoji: '💪' },
    { id: 'relationships', label: 'Relationships', emoji: '❤️' },
    { id: 'financial', label: 'Financial', emoji: '💰' },
    { id: 'travel', label: 'Travel', emoji: '✈️' },
    { id: 'learning', label: 'Learning', emoji: '📚' }
  ];

  // Enhanced color options with gradient support
  const colorOptions = [
    { bg: '#FEE2E2', gradient: 'from-rose-100 to-pink-100' },
    { bg: '#FED7AA', gradient: 'from-orange-100 to-amber-100' },
    { bg: '#FEF3C7', gradient: 'from-amber-100 to-yellow-100' },
    { bg: '#DCFCE7', gradient: 'from-green-100 to-emerald-100' },
    { bg: '#DBEAFE', gradient: 'from-blue-100 to-sky-100' },
    { bg: '#E9D5FF', gradient: 'from-purple-100 to-violet-100' },
    { bg: '#FCE7F3', gradient: 'from-pink-100 to-rose-100' },
    { bg: '#F3F4F6', gradient: 'from-gray-100 to-slate-100' }
  ];

  // Emoji options for vision items
  const emojiOptions = [
    '⭐', '🎯', '💎', '🏆', '🌟', '💫', '✨', '🔥',
    '💪', '🧠', '❤️', '🌈', '🚀', '🎨', '📚', '💰',
    '🏠', '✈️', '🎓', '💼', '🌱', '🏃', '🧘', '🎭',
    '🌸', '🦋', '🌺', '💝', '🎪', '🎸', '🏖️', '⛰️'
  ];

  // Load data when component mounts - THIS WAS MISSING!
  useEffect(() => {
    loadVisionItems();
    loadGoals();
  }, [user.uid]);

  // Load vision board items from database
  const loadVisionItems = async () => {
    try {
      setLoading(true);
      const result = await dbFunctions.getUserDocuments('visionBoard', user.uid);
      
      if (result.success) {
        setVisionItems(result.documents);
      }
    } catch (error) {
      console.error('Error loading vision items:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load goals from database
  const loadGoals = async () => {
    try {
      const result = await dbFunctions.getUserDocuments('goals', user.uid);
      
      if (result.success) {
        setGoals(result.documents);
      }
    } catch (error) {
      console.error('Error loading goals:', error);
    }
  };

  // Handle image upload for vision board (Base64 approach)
  const handleImageUpload = async (file) => {
    if (!file) return;
    
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Limit to 500KB for base64 storage
    if (file.size > 500 * 1024) {
      alert('Image size should be less than 500KB');
      return;
    }

    setUploading(true);
    
    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setNewVisionItem({ ...newVisionItem, imageUrl: base64String });
        setUploading(false);
      };
      reader.onerror = () => {
        console.error('Error reading file');
        alert('Error processing image. Please try again.');
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Error processing image. Please try again.');
      setUploading(false);
    }
  };

  // Add new vision board item
  const addVisionItem = async () => {
    if (!newVisionItem.title) {
      alert('Please add a title for your vision');
      return;
    }

    try {
      const visionData = {
        userId: user.uid,
        ...newVisionItem,
        createdAt: new Date()
      };
      
      const result = await dbFunctions.add('visionBoard', visionData);
      
      if (result.success) {
        setShowAddModal(false);
        setNewVisionItem({
          title: '',
          description: '',
          category: 'personal',
          imageUrl: '',
          color: '#FEE2E2',
          emoji: '⭐'
        });
        await loadVisionItems();
      }
    } catch (error) {
      console.error('Error adding vision item:', error);
      alert('Error adding vision item. Please try again.');
    }
  };

  // Delete vision board item
  const deleteVisionItem = async (itemId) => {
    if (!confirm('Are you sure you want to remove this vision?')) return;
    
    try {
      const result = await dbFunctions.delete('visionBoard', itemId);
      
      if (result.success) {
        setVisionItems(visionItems.filter(item => item.id !== itemId));
      }
    } catch (error) {
      console.error('Error deleting vision item:', error);
      alert('Error removing vision. Please try again.');
    }
  };

  // Add or update goal
  const saveGoal = async () => {
    if (!newGoal.title || !newGoal.targetDate) {
      alert('Please add a title and target date for your goal');
      return;
    }

    try {
      const goalData = {
        userId: user.uid,
        ...newGoal,
        milestones: newGoal.milestones.filter(m => m.trim()),
        completed: false,
        progress: 0,
        updatedAt: new Date()
      };
      
      // Don't override createdAt when updating
      if (!editingGoalId) {
        goalData.createdAt = new Date();
      }
      
      let result;
      if (editingGoalId) {
        result = await dbFunctions.update('goals', editingGoalId, goalData);
      } else {
        result = await dbFunctions.add('goals', goalData);
      }
      
      if (result.success) {
        setShowGoalModal(false);
        setEditingGoalId(null);
        setNewGoal({
          title: '',
          description: '',
          category: 'personal',
          targetDate: '',
          milestones: ['']
        });
        await loadGoals();
      }
    } catch (error) {
      console.error('Error saving goal:', error);
      alert('Error saving goal. Please try again.');
    }
  };

  // Toggle goal completion
  const toggleGoalComplete = async (goalId, currentStatus) => {
    try {
      const result = await dbFunctions.update('goals', goalId, {
        completed: !currentStatus,
        completedAt: !currentStatus ? new Date() : null
      });
      
      if (result.success) {
        await loadGoals();
      }
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  // Delete goal
  const deleteGoal = async (goalId) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;
    
    try {
      const result = await dbFunctions.delete('goals', goalId);
      
      if (result.success) {
        setGoals(goals.filter(goal => goal.id !== goalId));
      }
    } catch (error) {
      console.error('Error deleting goal:', error);
      alert('Error deleting goal. Please try again.');
    }
  };

  // Update milestone in new goal
  const updateMilestone = (index, value) => {
    const newMilestones = [...newGoal.milestones];
    newMilestones[index] = value;
    setNewGoal({ ...newGoal, milestones: newMilestones });
  };

  // Add new milestone field
  const addMilestone = () => {
    setNewGoal({ ...newGoal, milestones: [...newGoal.milestones, ''] });
  };

  // Remove milestone
  const removeMilestone = (index) => {
    const newMilestones = newGoal.milestones.filter((_, i) => i !== index);
    setNewGoal({ ...newGoal, milestones: newMilestones });
  };

  // Filter items by category
  const filteredVisionItems = selectedCategory === 'all' 
    ? visionItems 
    : visionItems.filter(item => item.category === selectedCategory);

  const filteredGoals = selectedCategory === 'all'
    ? goals
    : goals.filter(goal => goal.category === selectedCategory);

  // Calculate days until target date
  const getDaysUntilTarget = (targetDate) => {
    const target = new Date(targetDate);
    const today = new Date();
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get gradient class from color
  const getGradientClass = (color) => {
    const colorOption = colorOptions.find(opt => opt.bg === color);
    return colorOption ? colorOption.gradient : 'from-rose-100 to-pink-100';
  };

  // Calculate completion stats
  const completedGoalsCount = goals.filter(g => g.completed).length;
  const totalGoalsCount = goals.length;
  const completionPercentage = totalGoalsCount > 0 ? Math.round((completedGoalsCount / totalGoalsCount) * 100) : 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 rounded-2xl p-6 shadow-xl text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-1">Your Dreams & Aspirations</h2>
            <p className="text-white/80">Transform your visions into reality, one step at a time</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{visionItems.length + goals.length}</div>
            <div className="text-sm text-white/80">Total Dreams</div>
          </div>
        </div>
        
        {/* Progress Stats */}
        {totalGoalsCount > 0 && (
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Goal Achievement</span>
              <span className="text-sm font-bold">{completionPercentage}%</span>
            </div>
            <div className="w-full bg-white/30 rounded-full h-3 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-400 to-emerald-400 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <div className="mt-2 text-xs text-white/80">
              {completedGoalsCount} of {totalGoalsCount} goals completed
            </div>
          </div>
        )}
      </div>

      {/* View Toggle with Animation */}
      <div className="bg-white rounded-xl p-2 shadow-lg flex gap-2">
        <button
          onClick={() => setActiveView('board')}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
            activeView === 'board'
              ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md transform scale-105'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Grid size={18} />
          <span>Vision Board</span>
        </button>
        <button
          onClick={() => setActiveView('goals')}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
            activeView === 'goals'
              ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md transform scale-105'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <List size={18} />
          <span>Goals List</span>
        </button>
      </div>

      {/* Category Filter with Smooth Scroll */}
      <div className="bg-white rounded-xl p-4 shadow-lg">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-all duration-300 transform hover:scale-105 ${
                selectedCategory === category.id
                  ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="mr-1 text-lg">{category.emoji}</span>
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Vision Board View */}
      {activeView === 'board' && (
        <>
          {/* Add Vision Button with Pulse Animation */}
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full bg-gradient-to-r from-rose-400 to-pink-400 text-white p-5 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-rose-300 to-pink-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Plus size={24} className="relative z-10 animate-pulse" />
            <span className="relative z-10 text-lg font-medium">Create New Vision</span>
          </button>

          {/* Vision Board Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center gap-3 text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
                <span>Loading your beautiful visions...</span>
              </div>
            </div>
          ) : filteredVisionItems.length === 0 ? (
            <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl p-12 shadow-lg text-center">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 animate-ping">
                  <ImageIcon size={48} className="text-rose-200" />
                </div>
                <ImageIcon size={48} className="text-rose-300 relative" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Your Vision Board Awaits!</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Start manifesting your dreams by adding your first vision. Every great journey begins with a single step!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVisionItems.map((item, index) => (
                <div
                  key={item.id}
                  className={`relative group rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 animate-fade-in`}
                  style={{ 
                    animationDelay: `${index * 100}ms`,
                    background: `linear-gradient(135deg, ${item.color}, ${item.color}dd)`
                  }}
                >
                  {item.imageUrl ? (
                    <div className="h-56 overflow-hidden relative">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  ) : (
                    <div className={`h-56 flex items-center justify-center bg-gradient-to-br ${getGradientClass(item.color)}`}>
                      <div className="text-7xl transform group-hover:scale-125 transition-transform duration-500 group-hover:rotate-12">
                        {item.emoji || '⭐'}
                      </div>
                    </div>
                  )}
                  
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-bold text-lg text-gray-800 flex-1 group-hover:text-rose-600 transition-colors">
                        {item.title}
                      </h3>
                      <button
                        onClick={() => deleteVisionItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 transition-all duration-300 text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    
                    {item.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-full font-medium">
                        {categories.find(c => c.id === item.category)?.emoji} 
                        {' '}
                        {categories.find(c => c.id === item.category)?.label}
                      </span>
                      <div className="flex gap-1">
                        <Star size={16} className="text-yellow-500 fill-yellow-500" />
                        <Star size={16} className="text-yellow-500 fill-yellow-500" />
                        <Star size={16} className="text-yellow-500 fill-yellow-500" />
                      </div>
                    </div>
                  </div>

                  {/* Floating hearts animation on hover */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Heart className="text-red-500 animate-float" size={20} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Vision Modal - Enhanced */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
              <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl transform animate-slide-up">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-rose-100 to-pink-100 rounded-full mb-3">
                    <Sparkles className="text-rose-500" size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">Create Your Vision</h3>
                  <p className="text-gray-600 mt-1">Let's bring your dreams to life!</p>
                </div>
                
                {/* Title */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vision Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newVisionItem.title}
                    onChange={(e) => setNewVisionItem({ ...newVisionItem, title: e.target.value })}
                    placeholder="My amazing dream..."
                    className="w-full px-4 py-3 border-2 border-rose-200 rounded-xl focus:outline-none focus:border-rose-400 transition-colors"
                  />
                </div>

                {/* Description */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={newVisionItem.description}
                    onChange={(e) => setNewVisionItem({ ...newVisionItem, description: e.target.value })}
                    placeholder="Describe what this vision means to you..."
                    className="w-full px-4 py-3 border-2 border-rose-200 rounded-xl focus:outline-none focus:border-rose-400 h-24 resize-none transition-colors"
                  />
                </div>

                {/* Category */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={newVisionItem.category}
                    onChange={(e) => setNewVisionItem({ ...newVisionItem, category: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-rose-200 rounded-xl focus:outline-none focus:border-rose-400 transition-colors"
                  >
                    {categories.filter(c => c.id !== 'all').map(category => (
                      <option key={category.id} value={category.id}>
                        {category.emoji} {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Color Selection */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Background Color
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {colorOptions.map((colorOption) => (
                      <button
                        key={colorOption.bg}
                        onClick={() => setNewVisionItem({ ...newVisionItem, color: colorOption.bg })}
                        className={`w-10 h-10 rounded-xl border-2 transition-all transform hover:scale-110 ${
                          newVisionItem.color === colorOption.bg 
                            ? 'border-gray-800 shadow-md scale-110' 
                            : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: colorOption.bg }}
                      />
                    ))}
                  </div>
                </div>

                {/* Emoji Selection */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Choose an Icon
                  </label>
                  <div className="grid grid-cols-8 gap-2">
                    {emojiOptions.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => setNewVisionItem({ ...newVisionItem, emoji })}
                        className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-2xl transition-all transform hover:scale-110 ${
                          newVisionItem.emoji === emoji 
                            ? 'border-rose-500 bg-rose-50 shadow-md scale-110' 
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Image Upload (Base64) */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vision Image (Optional - Max 500KB)
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files[0])}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100 cursor-pointer"
                      disabled={uploading}
                    />
                    {uploading && (
                      <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-rose-500"></div>
                      </div>
                    )}
                  </div>
                  {newVisionItem.imageUrl && (
                    <div className="mt-3 relative group">
                      <img
                        src={newVisionItem.imageUrl}
                        alt="Preview"
                        className="w-full h-40 object-cover rounded-xl shadow-md"
                      />
                      <button
                        onClick={() => setNewVisionItem({ ...newVisionItem, imageUrl: '' })}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setNewVisionItem({
                        title: '',
                        description: '',
                        category: 'personal',
                        imageUrl: '',
                        color: '#FEE2E2',
                        emoji: '⭐'
                      });
                    }}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addVisionItem}
                    disabled={!newVisionItem.title || uploading}
                    className={`flex-1 px-6 py-3 rounded-xl transition-all font-medium flex items-center justify-center gap-2 ${
                      !newVisionItem.title || uploading
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:shadow-lg transform hover:scale-105'
                    }`}
                  >
                    <Plus size={18} />
                    Create Vision
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Goals List View - Enhanced */}
      {activeView === 'goals' && (
        <>
          {/* Add Goal Button */}
          <button
            onClick={() => setShowGoalModal(true)}
            className="w-full bg-gradient-to-r from-rose-400 to-pink-400 text-white p-5 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-rose-300 to-pink-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Target size={24} className="relative z-10" />
            <span className="relative z-10 text-lg font-medium">Set New Goal</span>
          </button>

          {/* Goals List */}
          {filteredGoals.length === 0 ? (
            <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl p-12 shadow-lg text-center">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 animate-ping">
                  <Target size={48} className="text-rose-200" />
                </div>
                <Target size={48} className="text-rose-300 relative" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Ready to Set Your Goals?</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Transform your dreams into achievable goals. Every accomplishment starts with the decision to try!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredGoals.map((goal, index) => {
                const daysLeft = getDaysUntilTarget(goal.targetDate);
                const isOverdue = daysLeft < 0 && !goal.completed;
                
                return (
                  <div
                    key={goal.id}
                    className={`bg-white rounded-2xl p-6 shadow-lg border-l-4 transform transition-all duration-500 hover:shadow-xl animate-slide-in`}
                    style={{
                      animationDelay: `${index * 100}ms`,
                      borderLeftColor: goal.completed ? '#10b981' : isOverdue ? '#ef4444' : '#f43f5e'
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className={`font-bold text-xl ${
                            goal.completed ? 'text-gray-500 line-through' : 'text-gray-800'
                          }`}>
                            {goal.title}
                          </h3>
                          {goal.completed && (
                            <div className="flex items-center gap-1 text-green-500">
                              <CheckCircle size={20} className="fill-green-500" />
                              <Trophy size={20} className="text-yellow-500 animate-bounce" />
                            </div>
                          )}
                        </div>
                        
                        {goal.description && (
                          <p className="text-gray-600 mb-3">
                            {goal.description}
                          </p>
                        )}
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="bg-gradient-to-r from-rose-100 to-pink-100 text-rose-700 px-3 py-1.5 rounded-full text-sm font-medium">
                            {categories.find(c => c.id === goal.category)?.emoji} 
                            {' '}
                            {categories.find(c => c.id === goal.category)?.label}
                          </span>
                          
                          <span className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 ${
                            goal.completed
                              ? 'bg-green-100 text-green-700'
                              : isOverdue
                              ? 'bg-red-100 text-red-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            <Calendar size={14} />
                            {goal.completed
                              ? 'Completed! 🎉'
                              : isOverdue
                              ? `Overdue by ${Math.abs(daysLeft)} days`
                              : `${daysLeft} days left`}
                          </span>
                        </div>
                        
                        {goal.milestones && goal.milestones.length > 0 && (
                          <div className="bg-gray-50 rounded-xl p-4 mt-3">
                            <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                              <Zap size={16} className="text-yellow-500" />
                              Milestones
                            </p>
                            <div className="space-y-2">
                              {goal.milestones.map((milestone, index) => (
                                <div key={index} className="flex items-center gap-3">
                                  <div className={`w-3 h-3 rounded-full ${
                                    goal.completed ? 'bg-green-400' : 'bg-gray-300'
                                  }`} />
                                  <span className="text-sm text-gray-600">{milestone}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => toggleGoalComplete(goal.id, goal.completed)}
                          className={`p-2.5 rounded-xl transition-all transform hover:scale-110 ${
                            goal.completed
                              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              : 'bg-green-100 text-green-600 hover:bg-green-200'
                          }`}
                        >
                          <CheckCircle size={20} />
                        </button>
                        
                        <button
                          onClick={() => {
                            setNewGoal({
                              title: goal.title,
                              description: goal.description || '',
                              category: goal.category,
                              targetDate: goal.targetDate,
                              milestones: goal.milestones || ['']
                            });
                            setEditingGoalId(goal.id);
                            setShowGoalModal(true);
                          }}
                          className="p-2.5 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition-all transform hover:scale-110"
                        >
                          <Edit2 size={20} />
                        </button>
                        
                        <button
                          onClick={() => deleteGoal(goal.id)}
                          className="p-2.5 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-all transform hover:scale-110"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Goal Modal - Enhanced */}
          {showGoalModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
              <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl transform animate-slide-up">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-rose-100 to-pink-100 rounded-full mb-3">
                    <Target className="text-rose-500" size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">
                    {editingGoalId ? 'Update Your Goal' : 'Set Your Goal'}
                  </h3>
                  <p className="text-gray-600 mt-1">Make it specific, measurable, and achievable!</p>
                </div>
                
                {/* Title */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Goal Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newGoal.title}
                    onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                    placeholder="What do you want to achieve?"
                    className="w-full px-4 py-3 border-2 border-rose-200 rounded-xl focus:outline-none focus:border-rose-400 transition-colors"
                  />
                </div>

                {/* Description */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Why This Matters (Optional)
                  </label>
                  <textarea
                    value={newGoal.description}
                    onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                    placeholder="Why is this goal important to you?"
                    className="w-full px-4 py-3 border-2 border-rose-200 rounded-xl focus:outline-none focus:border-rose-400 h-24 resize-none transition-colors"
                  />
                </div>

                {/* Category */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={newGoal.category}
                    onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-rose-200 rounded-xl focus:outline-none focus:border-rose-400 transition-colors"
                  >
                    {categories.filter(c => c.id !== 'all').map(category => (
                      <option key={category.id} value={category.id}>
                        {category.emoji} {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Date */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={newGoal.targetDate}
                    onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border-2 border-rose-200 rounded-xl focus:outline-none focus:border-rose-400 transition-colors"
                  />
                </div>

                {/* Milestones */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Break It Down (Milestones)
                  </label>
                  <div className="space-y-2">
                    {newGoal.milestones.map((milestone, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={milestone}
                          onChange={(e) => updateMilestone(index, e.target.value)}
                          placeholder={`Step ${index + 1}`}
                          className="flex-1 px-4 py-2.5 border-2 border-rose-200 rounded-xl focus:outline-none focus:border-rose-400 transition-colors"
                        />
                        {newGoal.milestones.length > 1 && (
                          <button
                            onClick={() => removeMilestone(index)}
                            className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                          >
                            <X size={20} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={addMilestone}
                    className="mt-2 text-sm text-rose-600 hover:text-rose-700 flex items-center gap-1.5 font-medium"
                  >
                    <Plus size={16} />
                    Add Another Step
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowGoalModal(false);
                      setEditingGoalId(null);
                      setNewGoal({
                        title: '',
                        description: '',
                        category: 'personal',
                        targetDate: '',
                        milestones: ['']
                      });
                    }}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveGoal}
                    disabled={!newGoal.title || !newGoal.targetDate}
                    className={`flex-1 px-6 py-3 rounded-xl transition-all font-medium flex items-center justify-center gap-2 ${
                      !newGoal.title || !newGoal.targetDate
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:shadow-lg transform hover:scale-105'
                    }`}
                  >
                    <Save size={18} />
                    {editingGoalId ? 'Update Goal' : 'Save Goal'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Motivational Quote */}
      <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-4 shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="text-purple-600" size={20} />
          <h3 className="font-semibold text-purple-800">Daily Motivation</h3>
        </div>
        <p className="text-sm text-gray-700 italic">
          "A goal without a plan is just a wish. Visualize your dreams and take action every day!"
        </p>
      </div>

      {/* Add CSS for animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        .animate-slide-in {
          animation: slide-in 0.5s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        
        .animate-float {
          animation: float 2s ease-in-out infinite;
        }
        
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        .line-clamp-2 {
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
      `}</style>
    </div>
  );
};

export default VisionBoardTab;