// src/components/Tabs/TodoTab.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { dbFunctions } from '../../utils/database';

const TodoTab = ({ user }) => {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [completedHistory, setCompletedHistory] = useState({});
  const [showHistory, setShowHistory] = useState(true);
  const [selectedHistoryDate, setSelectedHistoryDate] = useState(null);

  useEffect(() => {
    loadTodos();
    loadCompletedHistory();
  }, [user.uid]);

  const loadTodos = async () => {
    try {
      setLoading(true);
      const result = await dbFunctions.getUserDocuments('todos', user.uid);
      
      if (result.success) {
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
      // Get completed tasks from the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const result = await dbFunctions.getUserDocuments('todos', user.uid);
      
      if (result.success) {
        const completedTasks = result.documents.filter(todo => 
          todo.completed && todo.completedAt
        );
        
        // Group by completion date
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
      alert('Please enter a task!');
      return;
    }

    try {
      const todoData = {
        userId: user.uid,
        text: newTodo.trim(),
        completed: false,
        completedAt: null
      };

      const result = await dbFunctions.add('todos', todoData);
      
      if (result.success) {
        setNewTodo('');
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
        await loadCompletedHistory(); // Reload history to update completed tasks
      } else {
        alert('Error updating task. Please try again.');
      }
    } catch (error) {
      console.error('Error toggling todo:', error);
    }
  };

  const deleteTodo = async (todoId) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
      const result = await dbFunctions.delete('todos', todoId);
      
      if (result.success) {
        setTodos(todos.filter(todo => todo.id !== todoId));
        await loadCompletedHistory(); // Update history after deletion
      } else {
        alert('Error deleting task. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting todo:', error);
      alert('Error deleting task. Please try again.');
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

  // Get today's completed tasks count
  const todayCompleted = completedHistory[new Date().toLocaleDateString()]?.length || 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Daily Progress Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-rose-400 via-pink-400 to-purple-400 text-white rounded-2xl p-5 sm:p-7 shadow-xl ring-2 ring-white/20">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full translate-y-12 -translate-x-12"></div>
        
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold mb-2 flex items-center gap-2">
              <span className="text-2xl">✨</span> Today's Progress
            </h2>
            <p className="text-sm sm:text-base font-medium">
              {todayCompleted === 0 ? (
                "Ready to start your day? Let's accomplish something amazing! 🌟"
              ) : todayCompleted === 1 ? (
                "Great start! You've completed 1 task today! Keep going! 💪"
              ) : (
                `Amazing! You've completed ${todayCompleted} tasks today! 🎉`
              )}
            </p>
            {todayCompleted > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex -space-x-1">
                  {[...Array(Math.min(todayCompleted, 5))].map((_, i) => (
                    <div key={i} className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-xs backdrop-blur-sm">
                      ✓
                    </div>
                  ))}
                  {todayCompleted > 5 && (
                    <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-xs backdrop-blur-sm">
                      +{todayCompleted - 5}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="relative">
            <CheckCircle size={48} className="text-white/80" />
            {todayCompleted > 0 && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold text-gray-900">
                {todayCompleted}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add New Task */}
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg">
        <h2 className="text-lg sm:text-xl font-semibold text-rose-600 mb-3 sm:mb-4">
          Add New Task
        </h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTodo()}
            placeholder="What needs to be done?"
            className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border border-rose-200 rounded-lg focus:outline-none focus:border-rose-400"
          />
          <button
            onClick={addTodo}
            className="px-4 sm:px-6 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
          >
            <Plus size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Completed Tasks History */}
      {Object.keys(completedHistory).length > 0 && (
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-rose-100">
          <div 
            className="flex items-center justify-between mb-3 cursor-pointer group"
            onClick={() => setShowHistory(!showHistory)}
          >
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 group-hover:text-rose-600 transition-colors">
              <Calendar className="text-rose-500" size={20} />
              Recent Achievements
            </h3>
            <div className={`transform transition-transform ${showHistory ? 'rotate-180' : ''}`}>
              <ChevronDown size={20} className="text-rose-400" />
            </div>
          </div>
          
          {showHistory && (
            <div className="space-y-3">
              {/* Date Pills */}
              <div className="flex gap-2 flex-wrap">
                {Object.keys(completedHistory)
                  .sort((a, b) => new Date(b) - new Date(a))
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
              
              {/* Selected Date Tasks */}
              {selectedHistoryDate && (
                <div className="mt-3 p-4 bg-gradient-to-br from-rose-50 to-pink-50 rounded-lg border border-rose-200">
                  <h4 className="text-sm font-semibold text-rose-800 mb-3 flex items-center gap-2">
                    <span className="text-lg">🌸</span>
                    {getDateLabel(selectedHistoryDate)} Achievements
                  </h4>
                  <div className="space-y-2">
                    {completedHistory[selectedHistoryDate].map((task, index) => (
                      <div key={task.id} className="text-sm text-gray-700 flex items-start gap-2 bg-white/50 p-2 rounded-md">
                        <span className="text-rose-500 mt-0.5">✓</span>
                        <span className="flex-1">{task.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-3 sm:p-4 shadow-lg border border-gray-100 text-center">
          <div className="text-xl sm:text-2xl font-bold text-gray-800">{stats.total}</div>
          <div className="text-xs sm:text-sm text-gray-600">Total Tasks</div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-white rounded-xl p-3 sm:p-4 shadow-lg border border-orange-100 text-center">
          <div className="text-xl sm:text-2xl font-bold text-orange-600">{stats.active}</div>
          <div className="text-xs sm:text-sm text-gray-600">Active</div>
        </div>
        <div className="bg-gradient-to-br from-rose-50 to-white rounded-xl p-3 sm:p-4 shadow-lg border border-rose-100 text-center">
          <div className="text-xl sm:text-2xl font-bold text-rose-600">{stats.completed}</div>
          <div className="text-xs sm:text-sm text-gray-600">Completed</div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg">
        {/* Filter Buttons */}
        <div className="flex gap-2 mb-3 sm:mb-4">
          {['all', 'active', 'completed'].map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base rounded-lg capitalize transition-colors ${
                filter === filterOption
                  ? 'bg-rose-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filterOption}
            </button>
          ))}
        </div>

        {/* Todo List */}
        {loading ? (
          <p className="text-gray-500 text-center py-8 text-sm sm:text-base">Loading tasks...</p>
        ) : filteredTodos.length === 0 ? (
          <p className="text-gray-500 text-center py-8 text-sm sm:text-base">
            {filter === 'completed' ? 'No completed tasks yet!' : 
             filter === 'active' ? 'No active tasks. Great job!' : 
             'No tasks yet. Add one above!'}
          </p>
        ) : (
          <div className="space-y-2">
            {filteredTodos.map((todo) => (
              <div
                key={todo.id}
                className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo.id, todo.completed)}
                  className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500 rounded focus:ring-rose-500"
                />
                <span
                  className={`flex-1 text-sm sm:text-base ${
                    todo.completed
                      ? 'text-gray-400 line-through'
                      : 'text-gray-800'
                  }`}
                >
                  {todo.text}
                </span>
                <span className="text-xs text-gray-500 hidden sm:inline">
                  {todo.completed && todo.completedAt
                    ? `✓ ${formatDate(todo.completedAt)}`
                    : formatDate(todo.createdAt)}
                </span>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="text-red-500 hover:text-red-700 transition-colors p-1"
                >
                  <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TodoTab;