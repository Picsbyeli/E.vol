// AI-powered content generation with local server support and API fallback
import axios from 'axios';

// Local AI server configuration
const LOCAL_AI_URL = import.meta.env.VITE_LOCAL_AI_URL || 'http://localhost:8000';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;

// Cache for frequently requested content
const questionCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Check if local AI server is available
 */
async function checkLocalAI() {
  try {
    const response = await axios.get(`${LOCAL_AI_URL}/health`, { timeout: 2000 });
    return response.data.status === 'healthy';
  } catch (error) {
    console.warn('Local AI server not available, falling back to API');
    return false;
  }
}

/**
 * Generate AI content using local server
 */
async function generateWithLocalAI(gameType, difficulty, topic) {
  const prompts = {
    riddle: `Generate a ${difficulty} difficulty riddle. Return a JSON object with:
    {
      "q": "the riddle text",
      "a": "the answer",
      "hint": "a helpful hint",
      "difficulty": "${difficulty}",
      "category": "riddle type (logic, wordplay, math, etc.)"
    }`,
    
    trivia: `Generate a ${difficulty} difficulty trivia question${topic ? ` about ${topic}` : ''}. Return a JSON object with:
    {
      "grade": 5,
      "question": "the question",
      "choices": ["option A", "option B", "option C", "option D"],
      "answerIdx": 0,
      "category": "${topic || 'general'}"
    }`,
    
    emoji: `Generate an emoji puzzle where players guess the phrase/movie/book from emojis. Return a JSON object with:
    {
      "emojis": "🎬🦁👑",
      "answer": "THE LION KING",
      "hint": "Disney animated movie",
      "difficulty": "${difficulty}",
      "category": "movie/book/phrase/saying"
    }`,
    
    word: `Generate a word guessing game. Return a JSON object with:
    {
      "word": "BUTTERFLY",
      "category": "Animals",
      "difficulty": "${difficulty}",
      "hint": "Colorful insect that transforms from a caterpillar"
    }`
  };

  const response = await axios.post(`${LOCAL_AI_URL}/generate`, {
    prompt: prompts[gameType],
    max_tokens: 500,
    temperature: 0.8,
    game_type: gameType,
    use_local: true
  });

  return {
    ...response.data,
    source: 'local',
    model_used: response.data.model_used,
    performance: {
      inference_time_ms: response.data.inference_time_ms,
      tokens_per_second: response.data.tokens_per_second
    }
  };
}

/**
 * Generate AI content using DeepSeek API (fallback)
 */
async function generateWithAPI(gameType, difficulty, topic) {
  if (!API_KEY || API_KEY === 'YOUR_DEEPSEEK_API_KEY') {
    throw new Error('DeepSeek API key not configured');
  }

  const prompts = {
    riddle: `Generate a ${difficulty} difficulty riddle. Return a JSON object with:
    {
      "q": "the riddle text",
      "a": "the answer",
      "hint": "a helpful hint",
      "difficulty": "${difficulty}",
      "category": "riddle type (logic, wordplay, math, etc.)"
    }`,
    
    trivia: `Generate a ${difficulty} difficulty trivia question${topic ? ` about ${topic}` : ''}. Return a JSON object with:
    {
      "grade": 5,
      "question": "the question",
      "choices": ["option A", "option B", "option C", "option D"],
      "answerIdx": 0,
      "category": "${topic || 'general'}"
    }`,
    
    emoji: `Generate an emoji puzzle where players guess the phrase/movie/book from emojis. Return a JSON object with:
    {
      "emojis": "�🦁�",
      "answer": "THE LION KING",
      "hint": "Disney animated movie",
      "difficulty": "${difficulty}",
      "category": "movie/book/phrase/saying"
    }`,
    
    word: `Generate a word guessing game. Return a JSON object with:
    {
      "word": "BUTTERFLY",
      "category": "Animals",
      "difficulty": "${difficulty}",
      "hint": "Colorful insect that transforms from a caterpillar"
    }`
  };

  const response = await axios.post(
    DEEPSEEK_API_URL,
    {
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompts[gameType] }],
      temperature: 0.8,
      max_tokens: 500
    },
    {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  // Handle specific API errors
  if (response.status === 402) {
    throw new Error('DeepSeek API requires payment/credits. Please add credits to your account or use local inference.');
  }
  
  if (response.status === 401) {
    throw new Error('DeepSeek API key is invalid. Please check your API key.');
  }
  
  if (response.status === 429) {
    throw new Error('DeepSeek API rate limit exceeded. Please wait and try again.');
  }

  const content = response.data.choices[0].message.content;
  
  // Try to parse JSON response
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return {
        ...JSON.parse(jsonMatch[0]),
        source: 'api',
        model_used: 'deepseek-chat'
      };
    }
  } catch (parseError) {
    console.warn('Failed to parse JSON response, using fallback');
  }

  // Fallback response
  return {
    question: content,
    answer: 'Generated content',
    hint: 'AI-generated content',
    difficulty,
    category: gameType,
    source: 'api',
    model_used: 'deepseek-chat'
  };
}

/**
 * Main function to generate questions with local/API fallback and caching
 */
export async function generateQuestion(type = 'riddle', difficulty = 'medium', topic = null) {
  // Create cache key
  const cacheKey = `${type}-${difficulty}-${topic || 'default'}`;
  
  // Check cache first
  const cached = questionCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return { ...cached.data, cached: true };
  }

  try {
    let result;
    
    // Try local AI server first
    const localAvailable = await checkLocalAI();
    if (localAvailable) {
      try {
        result = await generateWithLocalAI(type, difficulty, topic);
        console.log('Generated content using local AI server');
      } catch (localError) {
        console.warn('Local AI generation failed:', localError.message);
        result = await generateWithAPI(type, difficulty, topic);
        console.log('Fallback to API successful');
      }
    } else {
      result = await generateWithAPI(type, difficulty, topic);
      console.log('Generated content using DeepSeek API');
    }

    // Parse the response text if it's a string
    if (typeof result.text === 'string') {
      try {
        const jsonMatch = result.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          result = { ...result, ...parsed };
        }
      } catch (parseError) {
        console.warn('Failed to parse response text');
      }
    }

    // Cache the result
    questionCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    return result;

  } catch (error) {
    console.error('AI Generation Error:', error);
    
    // Ultimate fallback questions
    const fallbacks = {
      riddle: {
        q: "I speak without a mouth and hear without ears. I have no body, but come alive with wind. What am I?",
        a: "An echo",
        hint: "Think about sound",
        difficulty,
        category: "logic",
        source: 'fallback'
      },
      trivia: {
        grade: 5,
        question: "What is the capital of France?",
        choices: ["London", "Berlin", "Paris", "Madrid"],
        answerIdx: 2,
        category: "geography",
        source: 'fallback'
      },
      emoji: {
        emojis: "🍎📱",
        answer: "APPLE",
        hint: "Technology company",
        difficulty,
        category: "brand",
        source: 'fallback'
      },
      word: {
        word: "PUZZLE",
        category: "Games",
        difficulty,
        hint: "What you're solving right now",
        source: 'fallback'
      }
    };

    return fallbacks[type] || fallbacks.riddle;
  }
}

/**
 * Generate multiple questions with rate limiting
 */
export async function generateMultipleQuestions(type = 'riddle', count = 5, difficulty = 'medium') {
  const questions = [];
  
  for (let i = 0; i < count; i++) {
    const question = await generateQuestion(type, difficulty);
    if (question) {
      questions.push(question);
    }
    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return questions;
}

/**
 * Get AI server performance metrics
 */
export async function getAIMetrics() {
  try {
    const response = await axios.get(`${LOCAL_AI_URL}/metrics`);
    return response.data;
  } catch (error) {
    console.warn('Could not get AI metrics:', error.message);
    return null;
  }
}

/**
 * Clear question cache
 */
export function clearQuestionCache() {
  questionCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  const now = Date.now();
  const validEntries = Array.from(questionCache.values())
    .filter(entry => now - entry.timestamp < CACHE_DURATION);
  
  return {
    total_entries: questionCache.size,
    valid_entries: validEntries.length,
    cache_hit_potential: validEntries.length / Math.max(questionCache.size, 1)
  };
}