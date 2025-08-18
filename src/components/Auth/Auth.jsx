// src/components/Auth/Auth.jsx
import React, { useState } from 'react';
import { authFunctions } from '../../utils/auth';
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';

const Auth = ({ onAuth }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Password validation
  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*]/.test(password)) {
      errors.push('Password must contain at least one special character (!@#$%^&*)');
    }
    return errors;
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    // Email validation
    if (!email) {
      errors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    // Password validation
    if (!password) {
      errors.password = 'Password is required';
    } else if (!isLogin) {
      const passwordErrors = validatePassword(password);
      if (passwordErrors.length > 0) {
        errors.password = passwordErrors[0]; // Show first error
      }
    }
    
    // Confirm password validation (signup only)
    if (!isLogin) {
      if (!confirmPassword) {
        errors.confirmPassword = 'Please confirm your password';
      } else if (password !== confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    setError('');
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      let result;
      if (isLogin) {
        result = await authFunctions.signIn(email, password);
      } else {
        result = await authFunctions.signUp(email, password);
      }
      
      if (result.success) {
        // Clear form
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        onAuth();
      } else {
        // Handle specific Firebase errors
        if (result.error.includes('user-not-found')) {
          setError('No account found with this email. Please sign up first.');
        } else if (result.error.includes('wrong-password')) {
          setError('Incorrect password. Please try again.');
        } else if (result.error.includes('email-already-in-use')) {
          setError('An account with this email already exists. Please login instead.');
        } else if (result.error.includes('weak-password')) {
          setError('Password is too weak. Please choose a stronger password.');
        } else if (result.error.includes('invalid-email')) {
          setError('Invalid email address format.');
        } else {
          setError(result.error || 'Authentication failed. Please try again.');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Clear errors when switching between login/signup
  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setValidationErrors({});
    setPassword('');
    setConfirmPassword('');
  };

  // Password strength indicator
  const getPasswordStrength = () => {
    if (!password) return { strength: 0, text: '', color: '' };
    
    const errors = validatePassword(password);
    const strength = 5 - errors.length;
    
    if (strength <= 1) return { strength: 20, text: 'Very Weak', color: 'bg-red-500' };
    if (strength === 2) return { strength: 40, text: 'Weak', color: 'bg-orange-500' };
    if (strength === 3) return { strength: 60, text: 'Fair', color: 'bg-yellow-500' };
    if (strength === 4) return { strength: 80, text: 'Good', color: 'bg-blue-500' };
    return { strength: 100, text: 'Strong', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 w-full max-w-md mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-rose-600 mb-2 text-center">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h1>
        <p className="text-sm sm:text-base text-gray-600 text-center mb-6">
          {isLogin 
            ? 'Login to continue your mental wellness journey' 
            : 'Start your journey to better mental health'}
        </p>
        
        <div className="space-y-4">
          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setValidationErrors({ ...validationErrors, email: '' });
                }}
                className={`w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg border ${
                  validationErrors.email ? 'border-red-500' : 'border-rose-200'
                } focus:outline-none focus:border-rose-400`}
                disabled={loading}
              />
            </div>
            {validationErrors.email && (
              <p className="text-red-500 text-xs sm:text-sm mt-1 flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {validationErrors.email}
              </p>
            )}
          </div>
          
          {/* Password Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={isLogin ? 'Enter your password' : 'Create a strong password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setValidationErrors({ ...validationErrors, password: '' });
                }}
                className={`w-full pl-10 pr-12 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg border ${
                  validationErrors.password ? 'border-red-500' : 'border-rose-200'
                } focus:outline-none focus:border-rose-400`}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {validationErrors.password && (
              <p className="text-red-500 text-xs sm:text-sm mt-1 flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {validationErrors.password}
              </p>
            )}
            
            {/* Password Strength Indicator (Signup only) */}
            {!isLogin && password && (
              <div className="mt-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-600">Password strength:</span>
                  <span className={`text-xs font-medium ${
                    passwordStrength.color.replace('bg-', 'text-')
                  }`}>
                    {passwordStrength.text}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                    style={{ width: `${passwordStrength.strength}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Confirm Password (Signup only) */}
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setValidationErrors({ ...validationErrors, confirmPassword: '' });
                  }}
                  className={`w-full pl-10 pr-12 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg border ${
                    validationErrors.confirmPassword ? 'border-red-500' : 'border-rose-200'
                  } focus:outline-none focus:border-rose-400`}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {validationErrors.confirmPassword && (
                <p className="text-red-500 text-xs sm:text-sm mt-1 flex items-center">
                  <AlertCircle size={14} className="mr-1" />
                  {validationErrors.confirmPassword}
                </p>
              )}
            </div>
          )}
          
          {/* Password Requirements (Signup only) */}
          {!isLogin && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs sm:text-sm font-medium text-blue-900 mb-2">Password Requirements:</p>
              <ul className="text-xs text-blue-800 space-y-1">
                <li className={password.length >= 8 ? 'line-through' : ''}>
                  • At least 8 characters
                </li>
                <li className={/[A-Z]/.test(password) ? 'line-through' : ''}>
                  • One uppercase letter
                </li>
                <li className={/[a-z]/.test(password) ? 'line-through' : ''}>
                  • One lowercase letter
                </li>
                <li className={/[0-9]/.test(password) ? 'line-through' : ''}>
                  • One number
                </li>
                <li className={/[!@#$%^&*]/.test(password) ? 'line-through' : ''}>
                  • One special character (!@#$%^&*)
                </li>
              </ul>
            </div>
          )}
          
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg flex items-start">
              <AlertCircle size={18} className="mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm">{error}</p>
            </div>
          )}
          
          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`w-full py-2.5 sm:py-3 text-sm sm:text-base rounded-lg transition-colors font-medium ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-rose-500 text-white hover:bg-rose-600'
            }`}
          >
            {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </div>
        
        {/* Toggle Login/Signup */}
        <p className="text-center mt-6 text-sm sm:text-base text-gray-600">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={toggleMode}
            className="text-rose-500 hover:underline font-medium"
            disabled={loading}
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
        
        {/* Forgot Password (Login only) */}
        {isLogin && (
          <p className="text-center mt-2">
            <button className="text-xs sm:text-sm text-gray-500 hover:text-gray-700">
              Forgot your password?
            </button>
          </p>
        )}
      </div>
    </div>
  );
};

export default Auth;