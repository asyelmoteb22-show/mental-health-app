// src/components/Auth/Auth.jsx
import React, { useState } from 'react';
import { authFunctions } from '../../utils/auth';

const Auth = ({ onAuth }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    // Basic password validation for signup
    if (!isLogin && password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      let result;
      if (isLogin) {
        result = await authFunctions.signIn(email, password);
      } else {
        result = await authFunctions.signUp(email, password);
      }
      
      if (result.success) {
        onAuth();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-rose-600 mb-6 text-center">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h1>
        
        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-rose-200 focus:outline-none focus:border-rose-400"
            disabled={loading}
          />
          
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-rose-200 focus:outline-none focus:border-rose-400"
            disabled={loading}
          />
          
          {error && <p className="text-red-500 text-sm">{error}</p>}
          
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`w-full py-3 rounded-lg transition-colors ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-rose-500 text-white hover:bg-rose-600'
            }`}
          >
            {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </div>
        
        <p className="text-center mt-4 text-gray-600">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-rose-500 hover:underline"
            disabled={loading}
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;