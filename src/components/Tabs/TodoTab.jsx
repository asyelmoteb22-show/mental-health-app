// src/components/Tabs/TodoTab.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { dbFunctions } from '../../utils/database';

const TodoTab = ({ user }) => {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTodos();
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

  const addTodo = async () => {
    if (!newTodo.trim()) {
      alert('Please enter a task!');
      return;
    }

    try {
      const todoData = {
        userId: user.uid,
        text: newTodo.trim(),
        completed: false
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
      const result = await dbFunctions.update('todos', todoId, {
        completed: !currentStatus
      });
      
      if (result.success) {
        // Update local state for immediate UI feedback
        setTodos(todos.map(todo => 
          todo.id === todoId 
            ? { ...todo, completed: !currentStatus }
            : todo
        ));
      } else {
        alert('Error updating task. Please try again.');
        await loadTodos(); // Reload to ensure sync
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
        // Remove from local state immediately
        setTodos(todos.filter(todo => todo.id !== todoId));
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

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h2 className="text-xl font-semibold text-rose-600 mb-4">Add New Task</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTodo()}
            placeholder="What needs to be done?"
            className="flex-1 px-4 py-2 border border-rose-200 rounded-lg focus:outline-none focus:border-rose-400"
          />
          <button
            onClick={addTodo}
            className="px-6 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-lg text-center">
          <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Tasks</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-lg text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.active}</div>
          <div className="text-sm text-gray-600">Active</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-lg text-center">
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-lg">
        <div className="flex gap-2 mb-4">
          {['all', 'active', 'completed'].map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                filter === filterOption
                  ? 'bg-rose-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filterOption}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-gray-500 text-center py-8">Loading tasks...</p>
        ) : filteredTodos.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            {filter === 'completed' ? 'No completed tasks yet!' : 
             filter === 'active' ? 'No active tasks. Great job!' : 
             'No tasks yet. Add one above!'}
          </p>
        ) : (
          <div className="space-y-2">
            {filteredTodos.map((todo) => (
              <div
                key={todo.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo.id, todo.completed)}
                  className="w-5 h-5 text-rose-500 rounded focus:ring-rose-500"
                />
                <span
                  className={`flex-1 ${
                    todo.completed
                      ? 'text-gray-400 line-through'
                      : 'text-gray-800'
                  }`}
                >
                  {todo.text}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDate(todo.createdAt)}
                </span>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="text-red-500 hover:text-red-700 transition-colors"
                >
                  <Trash2 size={18} />
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