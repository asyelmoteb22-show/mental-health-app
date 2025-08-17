// src/utils/helpers.js
import { quotes, reflectionQuestions } from './constants';

export const getQuoteOfDay = () => {
  const today = new Date().toDateString();
  const savedQuote = localStorage.getItem('quoteOfDay');
  if (savedQuote) {
    const { date, quote } = JSON.parse(savedQuote);
    if (date === today) return quote;
  }
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  localStorage.setItem('quoteOfDay', JSON.stringify({ date: today, quote }));
  return quote;
};

export const getDailyQuestions = () => {
  const today = new Date().toDateString();
  const savedQuestions = localStorage.getItem('dailyQuestions');
  if (savedQuestions) {
    const { date, questions } = JSON.parse(savedQuestions);
    if (date === today) return questions;
  }
  
  const shuffled = [...reflectionQuestions].sort(() => 0.5 - Math.random());
  const questions = shuffled.slice(0, 5);
  localStorage.setItem('dailyQuestions', JSON.stringify({ date: today, questions }));
  return questions;
};

export const analyzeMood = (text) => {
  const positive = ['happy', 'joy', 'grateful', 'excited', 'love', 'wonderful', 'amazing', 'great', 'good', 'smile', 'blessed'];
  const negative = ['sad', 'angry', 'frustrated', 'worried', 'anxious', 'stress', 'bad', 'terrible', 'hate', 'fear'];
  
  const lowerText = text.toLowerCase();
  const positiveCount = positive.filter(word => lowerText.includes(word)).length;
  const negativeCount = negative.filter(word => lowerText.includes(word)).length;
  
  if (positiveCount > negativeCount) return '😊 Happy';
  if (negativeCount > positiveCount) return '😔 Sad';
  return '😐 Neutral';
};