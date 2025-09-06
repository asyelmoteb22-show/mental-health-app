// src/components/Tabs/TodoTab.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, CheckCircle, ChevronDown, Edit2, X, Check, Clock, Target, Star, StickyNote } from 'lucide-react';
import { dbFunctions } from '../../utils/database';

const TodoTab = ({ user }) => {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [newTodoNote, setNewTodoNote] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [completedHistory, setCompletedHistory] = useState({});
  const [showHistory, setShowHistory] = useState(true);
  const [selectedHistoryDate, setSelectedHistoryDate] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [editingNote, setEditingNote] = useState('');
  const [expandedNotes, setExpandedNotes] = useState({});

  useEffect(() => {
    loadTodos();
    loadCompletedHistory();
  }, [user.uid]);

  const loadTodos = async () => {
    try {
      setLoading(true);
      const result = await dbFunctions.getUserDocuments('todos', user.uid);
      
      if (result.success) {
        console.log('Loaded todos:', result.documents); // Debug log
        setTodos(result.documents);
      } else {
        console.error('Error loading todos:', result.error);
      }
    } catch (error) {
      console.error('Error loading todos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCompletedHistory = async () => {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const result = await dbFunctions.getUserDocuments('todos', user.uid);
      
      if (result.success) {
        const completedTasks = result.documents.filter(todo => 
          todo.completed && todo.completedAt
        );
        
        const history = {};
        completedTasks.forEach(task => {
          const completionDate = task.completedAt?.seconds 
            ? new Date(task.completedAt.seconds * 1000)
            : new Date(task.completedAt);
          
          if (completionDate >= sevenDaysAgo) {
            const dateKey = completionDate.toLocaleDateString();
            if (!history[dateKey]) {
              history[dateKey] = [];
            }
            history[dateKey].push(task);
          }
        });
        
        setCompletedHistory(history);
      }
    } catch (error) {
      console.error('Error loading completed history:', error);
    }
  };

  const addTodo = async () => {
    if (!newTodo.trim()) {
      return;
    }

    try {
      const todoData = {
        userId: user.uid,
        text: newTodo.trim(),
        note: newTodoNote.trim(),
        completed: false,
        completedAt: null
      };

      const result = await dbFunctions.add('todos', todoData);
      
      if (result.success) {
        setNewTodo('');
        setNewTodoNote('');
        await loadTodos();
      } else {
        alert('Error adding task. Please try again.');
      }
    } catch (error) {
      console.error('Error adding todo:', error);
      alert('Error adding task. Please try again.');
    }
  };

  const toggleTodo = async (todoId, currentStatus) => {
    try {
      const updateData = {
        completed: !currentStatus,
        completedAt: !currentStatus ? new Date() : null
      };
      
      const result = await dbFunctions.update('todos', todoId, updateData);
      
      if (result.success) {
        await loadTodos();
        await loadCompletedHistory();
      } else {
        alert('Error updating task. Please try again.');
      }
    } catch (error) {
      console.error('Error toggling todo:', error);
    }
  };

  const startEdit = (todo) => {
    setEditingId(todo.id);
    setEditingText(todo.text);
    setEditingNote(todo.note || '');
  };

  const saveEdit = async () => {
    if (!editingText.trim()) {
      setEditingId(null);
      return;
    }

    try {
      const result = await dbFunctions.update('todos', editingId, {
        text: editingText.trim(),
        note: editingNote.trim()
      });
      
      if (result.success) {
        setEditingId(null);
        setEditingText('');
        setEditingNote('');
        await loadTodos();
      } else {
        alert('Error updating task. Please try again.');
      }
    } catch (error) {
      console.error('Error updating todo:', error);
      alert('Error updating task. Please try again.');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText('');
    setEditingNote('');
  };

  const toggleNoteExpanded = (todoId) => {
    setExpandedNotes(prev => ({
      ...prev,
      [todoId]: !prev[todoId]
    }));
  };

  const deleteTodo = async (todoId) => {
    // Debug: Check if todoId exists
    console.log('Attempting to delete todo with ID:', todoId);
    
    if (!todoId) {
      console.error('No todo ID provided');
      alert('Error: Unable to delete task - missing ID');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
      const result = await dbFunctions.delete('todos', todoId);
      
      if (result.success) {
        // Update local state immediately for better UX
        setTodos(prevTodos => prevTodos.filter(todo => todo.id !== todoId));
        // Then reload to ensure consistency
        await loadTodos();
        await loadCompletedHistory();
      } else {
        console.error('Delete failed:', result.error);
        alert(`Error deleting task: ${result.error || 'Unknown error'}`);
        // Reload in case of error to ensure state consistency
        await loadTodos();
      }
    } catch (error) {
      console.error('Error deleting todo:', error);
      alert(`Error deleting task: ${error.message || 'Please try again'}`);
    }
  };

  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  const stats = {
    total: todos.length,
    active: todos.filter(t => !t.completed).length,
    completed: todos.filter(t => t.completed).length
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleDateString();
    }
    
    return new Date(timestamp).toLocaleDateString();
  };

  const getDateLabel = (dateString) => {
    const today = new Date().toLocaleDateString();
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString();
    
    if (dateString === today) return 'Today';
    if (dateString === yesterday) return 'Yesterday';
    return dateString;
  };

  const todayCompleted = completedHistory[new Date().toLocaleDateString()]?.length || 0;

  // Get motivational message based on progress
  const getMotivationalMessage = () => {
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
    
    if (todayCompleted === 0) {
      return {
        emoji: '🌸',
        message: `Good ${timeOfDay}! Ready to make today productive?`
      };
    } else if (todayCompleted < 3) {
      return {
        emoji: '💪',
        message: 'Great start! Keep the momentum going!'
      };
    } else if (todayCompleted < 5) {
      return {
        emoji: '🔥',
        message: "You're on fire! Amazing progress today!"
      };
    } else {
      return {
        emoji: '🌟',
        message: 'Productivity champion! You\'re crushing it!'
      };
    }
  };

  const motivation = getMotivationalMessage();

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Daily Progress Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-rose-400 via-pink-400 to-rose-500 text-white rounded-2xl p-5 sm:p-7 shadow-xl">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-10 rounded-full -translate-y-20 translate-x-20"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white opacity-10 rounded-full translate-y-16 -translate-x-16"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="text-4xl animate-pulse">{motivation.emoji}</div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">Daily Goals</h2>
                <p className="text-sm sm:text-base opacity-90">{motivation.message}</p>
              </div>
            </div>
            <Target size={32} className="text-white/80" />
          </div>
          
          {/* Progress Stats */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2.5 sm:p-3 text-center">
              <div className="text-xl sm:text-2xl font-bold">{todayCompleted}</div>
              <div className="text-xs opacity-90">Completed Today</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2.5 sm:p-3 text-center">
              <div className="text-xl sm:text-2xl font-bold">{stats.active}</div>
              <div className="text-xs opacity-90">In Progress</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2.5 sm:p-3 text-center">
              <div className="text-xl sm:text-2xl font-bold">
                {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
              </div>
              <div className="text-xs opacity-90">Achievement</div>
            </div>
          </div>
        </div>
      </div>

      {/* Add New Task */}
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg">
        <h2 className="text-lg sm:text-xl font-semibold text-rose-600 mb-3 sm:mb-4 flex items-center gap-2">
          <Plus className="text-rose-500" size={20} />
          Add New Task
        </h2>
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && addTodo()}
              placeholder="What needs to be done today?"
              className="flex-1 px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-rose-200 rounded-lg focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all"
            />
            <button
              onClick={addTodo}
              disabled={!newTodo.trim()}
              className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition-all ${
                newTodo.trim()
                  ? 'bg-rose-500 text-white hover:bg-rose-600'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Add
            </button>
          </div>
          
          {/* Note input */}
          <div className="relative">
            <div className="absolute left-3 top-2.5 text-gray-400">
              <StickyNote size={16} />
            </div>
            <input
              type="text"
              value={newTodoNote}
              onChange={(e) => setNewTodoNote(e.target.value)}
              placeholder="Add a note (optional)"
              className="w-full pl-10 pr-4 py-2 text-sm border border-rose-200 rounded-lg focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 justify-center">
        {[
          { id: 'all', label: 'All Tasks' },
          { id: 'active', label: 'Active' },
          { id: 'completed', label: 'Completed' }
        ].map((filterOption) => (
          <button
            key={filterOption.id}
            onClick={() => setFilter(filterOption.id)}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-sm font-medium transition-all ${
              filter === filterOption.id
                ? 'bg-rose-500 text-white shadow-md'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            {filterOption.label}
            <span className="ml-2 text-xs">
              ({filterOption.id === 'all' ? stats.total : 
                filterOption.id === 'active' ? stats.active : stats.completed})
            </span>
          </button>
        ))}
      </div>

      {/* Tasks List */}
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-rose-600 mb-4 flex items-center gap-2">
          <CheckCircle className="text-rose-500" size={20} />
          {filter === 'all' ? 'All Tasks' : filter === 'active' ? 'Active Tasks' : 'Completed Tasks'}
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
          </div>
        ) : filteredTodos.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">
              {filter === 'completed' ? '🎯' : filter === 'active' ? '✨' : '📝'}
            </div>
            <p className="text-gray-500 text-sm sm:text-base">
              {filter === 'completed' ? 'No completed tasks yet. Keep working!' : 
               filter === 'active' ? 'All caught up! No active tasks.' : 
               'Your task list is empty. Add your first task above!'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTodos.map((todo) => (
              <div
                key={todo.id}
                className={`group flex items-center gap-3 p-3 sm:p-4 rounded-lg transition-all ${
                  todo.completed 
                    ? 'bg-gray-50 hover:bg-gray-100' 
                    : 'bg-rose-50 hover:bg-rose-100'
                }`}
              >
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo.id, todo.completed)}
                  className="w-5 h-5 text-rose-500 rounded focus:ring-2 focus:ring-rose-300 cursor-pointer"
                />
                
                {editingId === todo.id ? (
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && saveEdit()}
                        className="flex-1 px-3 py-1 text-sm sm:text-base border border-rose-300 rounded focus:outline-none focus:border-rose-500"
                        autoFocus
                      />
                      <button
                        onClick={saveEdit}
                        className="text-green-600 hover:text-green-700 p-1"
                      >
                        <Check size={18} />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="text-gray-500 hover:text-gray-700 p-1"
                      >
                        <X size={18} />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={editingNote}
                      onChange={(e) => setEditingNote(e.target.value)}
                      placeholder="Add a note (optional)"
                      className="w-full px-3 py-1 text-sm border border-rose-200 rounded focus:outline-none focus:border-rose-400"
                    />
                  </div>
                ) : (
                  <>
                    <div className="flex-1">
                      <div className="flex items-start gap-2">
                        <span
                          className={`text-sm sm:text-base transition-all ${
                            todo.completed
                              ? 'text-gray-500 line-through'
                              : 'text-gray-800'
                          }`}
                        >
                          {todo.text}
                        </span>
                        {todo.note && (
                          <button
                            onClick={() => toggleNoteExpanded(todo.id)}
                            className="text-rose-400 hover:text-rose-600 transition-colors"
                            title={expandedNotes[todo.id] ? "Hide note" : "Show note"}
                          >
                            <StickyNote size={14} />
                          </button>
                        )}
                      </div>
                      
                      {/* Show note if it exists and is expanded */}
                      {todo.note && expandedNotes[todo.id] && (
                        <div className="mt-2 pl-6 pr-2">
                          <p className="text-xs sm:text-sm text-gray-600 bg-rose-50 rounded px-3 py-2 border-l-2 border-rose-300">
                            {todo.note}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!todo.completed && (
                        <button
                          onClick={() => startEdit(todo)}
                          className="text-gray-400 hover:text-rose-600 transition-colors p-1"
                          title="Edit task"
                        >
                          <Edit2 size={16} />
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          console.log('Delete button clicked for todo:', todo.id, todo);
                          deleteTodo(todo.id);
                        }}
                        className="text-red-500 hover:text-red-700 transition-colors p-1"
                        title="Delete task"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed History */}
      {Object.keys(completedHistory).length > 0 && (
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-rose-100">
          <div 
            className="flex items-center justify-between mb-4 cursor-pointer group"
            onClick={() => setShowHistory(!showHistory)}
          >
            <h3 className="text-lg font-semibold text-rose-600 flex items-center gap-2 group-hover:text-rose-700 transition-colors">
              <Calendar className="text-rose-500" size={20} />
              Achievement History
            </h3>
            <ChevronDown 
              size={20} 
              className={`text-rose-400 transition-transform ${showHistory ? 'rotate-180' : ''}`}
            />
          </div>
          
          {showHistory && (
            <div className="space-y-3">
              <div className="flex gap-2 flex-wrap">
                {Object.keys(completedHistory)
                  .sort((a, b) => new Date(b) - new Date(a))
                  .slice(0, 7)
                  .map(dateKey => (
                    <button
                      key={dateKey}
                      onClick={() => setSelectedHistoryDate(
                        selectedHistoryDate === dateKey ? null : dateKey
                      )}
                      className={`px-3 py-1.5 text-xs sm:text-sm rounded-full transition-all transform hover:scale-105 ${
                        selectedHistoryDate === dateKey
                          ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md'
                          : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                      }`}
                    >
                      <span className="font-medium">{getDateLabel(dateKey)}</span>
                      <span className="ml-1 opacity-80">({completedHistory[dateKey].length})</span>
                    </button>
                  ))}
              </div>
              
              {selectedHistoryDate && (
                <div className="mt-3 p-4 bg-gradient-to-br from-rose-50 to-pink-50 rounded-lg border border-rose-200">
                  <h4 className="text-sm font-semibold text-rose-800 mb-3 flex items-center gap-2">
                    <Star className="text-rose-500" size={16} />
                    {getDateLabel(selectedHistoryDate)} Achievements
                  </h4>
                  <div className="space-y-2">
                    {completedHistory[selectedHistoryDate].map((task) => (
                      <div key={task.id} className="text-sm text-gray-700 bg-white/50 p-2 rounded-md">
                        <div className="flex items-start gap-2">
                          <CheckCircle size={14} className="text-rose-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <span>{task.text}</span>
                            {task.note && (
                              <p className="text-xs text-gray-500 mt-1 pl-4">
                                📝 {task.note}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TodoTab;