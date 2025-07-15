import { NextResponse } from 'next/server';

// Enhanced hashtag generation with better AI analysis
const HASHTAG_DATABASE = {
  // Popular hashtags by engagement rate and reach
  high_engagement: [
    'love', 'instagood', 'photooftheday', 'beautiful', 'happy', 'cute', 'follow',
    'nature', 'art', 'photography', 'travel', 'style', 'instadaily', 'amazing'
  ],
  
  // Category-specific hashtags with high performance
  categories: {
    lifestyle: {
      primary: ['lifestyle', 'life', 'vibes', 'mood', 'daily', 'moments'],
      secondary: ['blessed', 'grateful', 'happiness', 'peace', 'mindfulness', 'wellness'],
      niche: ['selfcare', 'inspiration', 'motivation', 'positivity', 'goodvibes', 'energy']
    },
    food: {
      primary: ['food', 'foodie', 'delicious', 'yummy', 'tasty', 'recipe'],
      secondary: ['cooking', 'chef', 'restaurant', 'homemade', 'organic', 'healthy'],
      niche: ['foodporn', 'instafood', 'foodstagram', 'foodblogger', 'cuisine', 'gourmet']
    },
    travel: {
      primary: ['travel', 'wanderlust', 'adventure', 'explore', 'vacation', 'trip'],
      secondary: ['journey', 'destination', 'travelgram', 'instatravel', 'backpacking'],
      niche: ['culture', 'landscape', 'cityscape', 'sunset', 'beach', 'mountains']
    },
    fitness: {
      primary: ['fitness', 'workout', 'gym', 'health', 'strong', 'motivation'],
      secondary: ['training', 'exercise', 'bodybuilding', 'cardio', 'strength'],
      niche: ['transformation', 'fitlife', 'healthylifestyle', 'runner', 'yoga', 'crossfit']
    },
    business: {
      primary: ['business', 'entrepreneur', 'startup', 'success', 'leadership'],
      secondary: ['innovation', 'marketing', 'strategy', 'growth', 'networking'],
      niche: ['professional', 'career', 'investment', 'productivity', 'goals', 'hustle']
    },
    fashion: {
      primary: ['fashion', 'style', 'outfit', 'ootd', 'clothing', 'trendy'],
      secondary: ['fashionista', 'stylish', 'look', 'beauty', 'accessories'],
      niche: ['designer', 'luxury', 'streetstyle', 'vintage', 'model', 'photoshoot']
    },
    technology: {
      primary: ['technology', 'tech', 'innovation', 'digital', 'software'],
      secondary: ['coding', 'developer', 'programming', 'app', 'website'],
      niche: ['ai', 'machinelearning', 'data', 'cybersecurity', 'cloud', 'automation']
    },
    art: {
      primary: ['art', 'artist', 'painting', 'drawing', 'creative', 'artwork'],
      secondary: ['design', 'illustration', 'sketch', 'canvas', 'colors'],
      niche: ['gallery', 'exhibition', 'handmade', 'craft', 'abstract', 'portrait']
    }
  },

  // Trending hashtags by time of year/season
  seasonal: {
    general: ['2025', 'new', 'fresh', 'trending', 'viral', 'popular'],
    summer: ['summer', 'beach', 'sun', 'vacation', 'hot', 'sunny'],
    winter: ['winter', 'cozy', 'warm', 'holiday', 'cold', 'snow'],
    spring: ['spring', 'bloom', 'fresh', 'green', 'growth', 'renewal'],
    fall: ['autumn', 'fall', 'leaves', 'cozy', 'harvest', 'orange']
  }
};

// Advanced content analysis keywords
const CONTENT_ANALYSIS = {
  emotions: {
    positive: {
      keywords: ['happy', 'joy', 'excited', 'love', 'amazing', 'beautiful', 'wonderful', 'great', 'awesome', 'fantastic'],
      hashtags: ['happy', 'joy', 'love', 'blessed', 'grateful', 'amazing', 'wonderful', 'positivevibes', 'goodenergy']
    },
    inspirational: {
      keywords: ['inspire', 'motivate', 'dream', 'goal', 'achieve', 'success', 'growth', 'journey', 'progress'],
      hashtags: ['inspiration', 'motivation', 'goals', 'success', 'growth', 'journey', 'progress', 'mindset', 'believe']
    },
    relaxed: {
      keywords: ['chill', 'relax', 'peaceful', 'calm', 'quiet', 'serene', 'tranquil', 'zen'],
      hashtags: ['chill', 'relax', 'peaceful', 'calm', 'zen', 'tranquil', 'mindfulness', 'selfcare', 'wellness']
    }
  },

  activities: {
    social: {
      keywords: ['friends', 'family', 'party', 'celebration', 'together', 'group', 'team'],
      hashtags: ['friends', 'family', 'together', 'squad', 'team', 'social', 'gathering', 'celebration']
    },
    creative: {
      keywords: ['create', 'make', 'build', 'design', 'craft', 'artistic', 'creative'],
      hashtags: ['creative', 'art', 'design', 'handmade', 'craft', 'artistic', 'maker', 'diy']
    },
    learning: {
      keywords: ['learn', 'study', 'education', 'knowledge', 'skill', 'practice', 'improve'],
      hashtags: ['learning', 'education', 'knowledge', 'skill', 'growth', 'development', 'practice', 'improve']
    }
  }
};

function analyzeContentSentiment(caption) {
  const lowercaseCaption = caption.toLowerCase();
  const sentiments = {};
  
  // Analyze emotions
  Object.entries(CONTENT_ANALYSIS.emotions).forEach(([emotion, data]) => {
    const matches = data.keywords.filter(keyword => lowercaseCaption.includes(keyword)).length;
    if (matches > 0) {
      sentiments[emotion] = matches;
    }
  });

  // Analyze activities
  Object.entries(CONTENT_ANALYSIS.activities).forEach(([activity, data]) => {
    const matches = data.keywords.filter(keyword => lowercaseCaption.includes(keyword)).length;
    if (matches > 0) {
      sentiments[activity] = matches;
    }
  });

  return sentiments;
}

function detectCategories(caption) {
  const lowercaseCaption = caption.toLowerCase();
  const categoryScores = {};
  
  // Initialize category scores
  Object.keys(HASHTAG_DATABASE.categories).forEach(category => {
    categoryScores[category] = 0;
  });
  
  // Score each category based on keyword matches
  Object.entries(HASHTAG_DATABASE.categories).forEach(([category, hashtags]) => {
    const allHashtags = [...hashtags.primary, ...hashtags.secondary, ...hashtags.niche];
    
    allHashtags.forEach(hashtag => {
      if (lowercaseCaption.includes(hashtag)) {
        // Primary hashtags get higher weight
        if (hashtags.primary.includes(hashtag)) {
          categoryScores[category] += 3;
        } else if (hashtags.secondary.includes(hashtag)) {
          categoryScores[category] += 2;
        } else {
          categoryScores[category] += 1;
        }
      }
    });
  });
  
  // Return top categories
  return Object.entries(categoryScores)
    .filter(([_, score]) => score > 0)
    .sort(([_, a], [__, b]) => b - a)
    .slice(0, 3)
    .map(([category, _]) => category);
}

function generateSmartHashtags(caption, maxHashtags = 25) {
  const hashtags = new Set();
  
  // Detect main categories
  const categories = detectCategories(caption);
  const sentiments = analyzeContentSentiment(caption);
  
  // Add category-specific hashtags
  categories.forEach((category, index) => {
    const categoryData = HASHTAG_DATABASE.categories[category];
    if (categoryData) {
      // Primary category gets more hashtags
      const count = index === 0 ? 4 : 2;
      
      // Mix primary, secondary, and niche hashtags
      const primaryCount = Math.ceil(count * 0.5);
      const secondaryCount = Math.ceil(count * 0.3);
      const nicheCount = count - primaryCount - secondaryCount;
      
      // Add primary hashtags
      categoryData.primary
        .sort(() => Math.random() - 0.5)
        .slice(0, primaryCount)
        .forEach(tag => hashtags.add(tag));
      
      // Add secondary hashtags
      categoryData.secondary
        .sort(() => Math.random() - 0.5)
        .slice(0, secondaryCount)
        .forEach(tag => hashtags.add(tag));
      
      // Add niche hashtags
      categoryData.niche
        .sort(() => Math.random() - 0.5)
        .slice(0, nicheCount)
        .forEach(tag => hashtags.add(tag));
    }
  });
  
  // Add sentiment-based hashtags
  Object.entries(sentiments).forEach(([sentiment, score]) => {
    if (CONTENT_ANALYSIS.emotions[sentiment]) {
      const sentimentHashtags = CONTENT_ANALYSIS.emotions[sentiment].hashtags;
      sentimentHashtags
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.min(2, score))
        .forEach(tag => hashtags.add(tag));
    } else if (CONTENT_ANALYSIS.activities[sentiment]) {
      const activityHashtags = CONTENT_ANALYSIS.activities[sentiment].hashtags;
      activityHashtags
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.min(2, score))
        .forEach(tag => hashtags.add(tag));
    }
  });
  
  // Add high-engagement hashtags
  const highEngagementCount = Math.floor(Math.random() * 4) + 3;
  HASHTAG_DATABASE.high_engagement
    .sort(() => Math.random() - 0.5)
    .slice(0, highEngagementCount)
    .forEach(tag => hashtags.add(tag));
  
  // Add seasonal hashtags
  const currentMonth = new Date().getMonth();
  let seasonalTags = [];
  
  if (currentMonth >= 5 && currentMonth <= 7) { // Summer
    seasonalTags = HASHTAG_DATABASE.seasonal.summer;
  } else if (currentMonth >= 8 && currentMonth <= 10) { // Fall
    seasonalTags = HASHTAG_DATABASE.seasonal.fall;
  } else if (currentMonth >= 11 || currentMonth <= 1) { // Winter
    seasonalTags = HASHTAG_DATABASE.seasonal.winter;
  } else { // Spring
    seasonalTags = HASHTAG_DATABASE.seasonal.spring;
  }
  
  seasonalTags
    .concat(HASHTAG_DATABASE.seasonal.general)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .forEach(tag => hashtags.add(tag));
  
  // Extract relevant words from caption
  const captionWords = caption.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && word.length < 15)
    .filter(word => !['this', 'that', 'with', 'from', 'they', 'have', 'been', 'were', 'will', 'would', 'could', 'should'].includes(word));
  
  // Add relevant caption words as hashtags
  captionWords
    .slice(0, 3)
    .forEach(word => hashtags.add(word));
  
  return Array.from(hashtags).slice(0, maxHashtags);
}

function categorizeHashtags(hashtags) {
  const categorized = {
    trending: [],
    category: [],
    seasonal: [],
    custom: []
  };
  
  hashtags.forEach(hashtag => {
    const cleanTag = hashtag.replace('#', '');
    
    if (HASHTAG_DATABASE.high_engagement.includes(cleanTag)) {
      categorized.trending.push(cleanTag);
    } else if (Object.values(HASHTAG_DATABASE.categories).some(cat => 
      [...cat.primary, ...cat.secondary, ...cat.niche].includes(cleanTag)
    )) {
      categorized.category.push(cleanTag);
    } else if (Object.values(HASHTAG_DATABASE.seasonal).some(season => 
      season.includes(cleanTag)
    )) {
      categorized.seasonal.push(cleanTag);
    } else {
      categorized.custom.push(cleanTag);
    }
  });
  
  return categorized;
}

export async function POST(request) {
  try {
    const { caption } = await request.json();
    
    if (!caption || caption.trim().length === 0) {
      return NextResponse.json(
        { error: 'Caption is required' },
        { status: 400 }
      );
    }
    
    // Generate smart hashtags using enhanced algorithm
    const generatedHashtags = generateSmartHashtags(caption);
    const categories = detectCategories(caption);
    const sentiments = analyzeContentSentiment(caption);
    
    // Format hashtags with # symbol
    const formattedHashtags = generatedHashtags.map(tag => `#${tag}`);
    
    // Categorize hashtags for better organization
    const categorizedHashtags = categorizeHashtags(generatedHashtags);
    
    return NextResponse.json({
      hashtags: formattedHashtags,
      categories: categories,
      sentiments: sentiments,
      categorized: categorizedHashtags,
      count: formattedHashtags.length,
      analysis: {
        detectedCategories: categories,
        sentimentAnalysis: sentiments,
        hashtagBreakdown: {
          trending: categorizedHashtags.trending.length,
          category: categorizedHashtags.category.length,
          seasonal: categorizedHashtags.seasonal.length,
          custom: categorizedHashtags.custom.length
        }
      }
    });
    
  } catch (error) {
    console.error('Error generating hashtags:', error);
    return NextResponse.json(
      { error: 'Failed to generate hashtags' },
      { status: 500 }
    );
  }
}
