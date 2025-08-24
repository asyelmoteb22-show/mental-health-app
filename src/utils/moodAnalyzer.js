// src/utils/moodAnalyzer.js
import { chatModel, MOOD_ANALYSIS_PROMPT } from '../config/gemini';

// Enhanced mood categories with more nuance
export const MOOD_CATEGORIES = {
  VERY_HAPPY: { emoji: '😊', label: 'Very Happy', color: '#10b981', score: 5 },
  HAPPY: { emoji: '🙂', label: 'Happy', color: '#34d399', score: 4 },
  NEUTRAL: { emoji: '😐', label: 'Neutral', color: '#fbbf24', score: 3 },
  SAD: { emoji: '😔', label: 'Sad', color: '#60a5fa', score: 2 },
  VERY_SAD: { emoji: '😢', label: 'Very Sad', color: '#3b82f6', score: 1 },
  ANXIOUS: { emoji: '😰', label: 'Anxious', color: '#f87171', score: 2 },
  ANGRY: { emoji: '😠', label: 'Angry', color: '#ef4444', score: 1 },
  GRATEFUL: { emoji: '🙏', label: 'Grateful', color: '#a78bfa', score: 5 },
  STRESSED: { emoji: '😫', label: 'Stressed', color: '#fb923c', score: 2 },
  EXCITED: { emoji: '🤗', label: 'Excited', color: '#f472b6', score: 5 }
};

// AI-powered mood analysis
export const analyzeMoodWithAI = async (journalText) => {
  try {
    const prompt = `
    Analyze the emotional content of this journal entry and respond with ONLY a JSON object.
    
    Journal Entry: "${journalText}"
    
    Respond with this exact JSON structure:
    {
      "primaryMood": "one of: VERY_HAPPY, HAPPY, NEUTRAL, SAD, VERY_SAD, ANXIOUS, ANGRY, GRATEFUL, STRESSED, EXCITED",
      "confidence": 0.0 to 1.0,
      "emotionalTones": ["array of detected emotions"],
      "keyPhrases": ["important emotional phrases from the text"],
      "suggestion": "A brief, supportive suggestion based on the mood (max 50 words)"
    }
    
    IMPORTANT: Return ONLY valid JSON, no markdown, no extra text.
    `;

    const result = await chatModel.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Clean up the response (remove any markdown or extra formatting)
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Parse the JSON response
    const analysis = JSON.parse(text);
    
    // Get the mood category
    const moodCategory = MOOD_CATEGORIES[analysis.primaryMood] || MOOD_CATEGORIES.NEUTRAL;
    
    return {
      mood: `${moodCategory.emoji} ${moodCategory.label}`,
      moodData: moodCategory,
      confidence: analysis.confidence,
      emotionalTones: analysis.emotionalTones,
      keyPhrases: analysis.keyPhrases,
      suggestion: analysis.suggestion,
      rawAnalysis: analysis
    };
  } catch (error) {
    console.error('AI Mood Analysis Error:', error);
    // Fallback to simple keyword analysis
    return fallbackMoodAnalysis(journalText);
  }
};

// Fallback mood analysis (your current implementation)
export const fallbackMoodAnalysis = (text) => {
  const positive = ['happy', 'joy', 'grateful', 'excited', 'love', 'wonderful', 'amazing', 'great', 'good', 'smile', 'blessed'];
  const negative = ['sad', 'angry', 'frustrated', 'worried', 'anxious', 'stress', 'bad', 'terrible', 'hate', 'fear'];
  
  const lowerText = text.toLowerCase();
  const positiveCount = positive.filter(word => lowerText.includes(word)).length;
  const negativeCount = negative.filter(word => lowerText.includes(word)).length;
  
  let moodCategory = MOOD_CATEGORIES.NEUTRAL;
  
  if (positiveCount > negativeCount) {
    moodCategory = positiveCount > 2 ? MOOD_CATEGORIES.VERY_HAPPY : MOOD_CATEGORIES.HAPPY;
  } else if (negativeCount > positiveCount) {
    moodCategory = negativeCount > 2 ? MOOD_CATEGORIES.VERY_SAD : MOOD_CATEGORIES.SAD;
  }
  
  return {
    mood: `${moodCategory.emoji} ${moodCategory.label}`,
    moodData: moodCategory,
    confidence: 0.5,
    emotionalTones: [],
    keyPhrases: [],
    suggestion: "Keep journaling to track your emotional patterns!",
    rawAnalysis: null
  };
};

// Analyze mood trends over time
export const analyzeMoodTrends = async (moodHistory) => {
  if (!moodHistory || moodHistory.length < 3) {
    return {
      trend: 'insufficient_data',
      insights: [],
      recommendation: 'Keep tracking your moods to see patterns!'
    };
  }

  try {
    const recentMoods = moodHistory.slice(-7); // Last 7 entries
    const moodData = recentMoods.map(m => ({
      date: new Date(m.createdAt?.seconds * 1000 || m.createdAt).toLocaleDateString(),
      mood: m.mood,
      score: m.moodData?.score || 3
    }));

    const prompt = `
    Analyze this mood history and provide insights. Respond with ONLY a JSON object.
    
    Mood History: ${JSON.stringify(moodData)}
    
    Respond with:
    {
      "trend": "improving, stable, declining, or variable",
      "insights": ["array of 2-3 specific observations"],
      "recommendation": "One actionable suggestion based on the pattern (max 50 words)"
    }
    
    IMPORTANT: Return ONLY valid JSON.
    `;

    const result = await chatModel.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(text);
  } catch (error) {
    console.error('Trend Analysis Error:', error);
    return {
      trend: 'unknown',
      insights: ['Unable to analyze trends at this time'],
      recommendation: 'Keep tracking your moods consistently!'
    };
  }
};