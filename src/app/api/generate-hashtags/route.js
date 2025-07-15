import { NextResponse } from 'next/server';

// Popular hashtag categories and trending hashtags
const HASHTAG_CATEGORIES = {
  lifestyle: [
    'lifestyle', 'life', 'vibes', 'mood', 'daily', 'moments', 'blessed', 'grateful',
    'happiness', 'peace', 'mindfulness', 'wellness', 'selfcare', 'inspiration',
    'motivation', 'positivity', 'goodvibes', 'energy', 'mindset', 'growth'
  ],
  food: [
    'food', 'foodie', 'delicious', 'yummy', 'tasty', 'recipe', 'cooking', 'chef',
    'restaurant', 'homemade', 'organic', 'healthy', 'nutrition', 'foodporn',
    'instafood', 'foodstagram', 'foodblogger', 'cuisine', 'dinner', 'lunch'
  ],
  travel: [
    'travel', 'wanderlust', 'adventure', 'explore', 'vacation', 'trip', 'journey',
    'destination', 'travelgram', 'instatravel', 'backpacking', 'culture',
    'photography', 'nature', 'landscape', 'cityscape', 'sunset', 'beach', 'mountains'
  ],
  fitness: [
    'fitness', 'workout', 'gym', 'health', 'strong', 'motivation', 'training',
    'exercise', 'bodybuilding', 'cardio', 'strength', 'muscle', 'transformation',
    'fitlife', 'healthylifestyle', 'runner', 'yoga', 'pilates', 'crossfit'
  ],
  fashion: [
    'fashion', 'style', 'outfit', 'ootd', 'clothing', 'designer', 'trendy',
    'fashionista', 'stylish', 'look', 'beauty', 'accessories', 'shopping',
    'brand', 'luxury', 'streetstyle', 'vintage', 'model', 'photoshoot'
  ],
  business: [
    'business', 'entrepreneur', 'startup', 'success', 'leadership', 'innovation',
    'marketing', 'strategy', 'growth', 'networking', 'professional', 'career',
    'investment', 'finance', 'productivity', 'goals', 'hustle', 'mindset'
  ],
  photography: [
    'photography', 'photo', 'photographer', 'camera', 'shot', 'capture', 'lens',
    'portrait', 'landscape', 'street', 'nature', 'art', 'creative', 'moment',
    'light', 'composition', 'editing', 'digital', 'film', 'studio'
  ],
  music: [
    'music', 'song', 'musician', 'artist', 'concert', 'live', 'studio', 'recording',
    'guitar', 'piano', 'singing', 'songwriter', 'band', 'performance', 'melody',
    'rhythm', 'lyrics', 'album', 'single', 'cover'
  ],
  art: [
    'art', 'artist', 'painting', 'drawing', 'creative', 'artwork', 'design',
    'illustration', 'sketch', 'canvas', 'colors', 'brush', 'gallery', 'exhibition',
    'handmade', 'craft', 'digital', 'abstract', 'portrait', 'landscape'
  ],
  technology: [
    'technology', 'tech', 'innovation', 'digital', 'software', 'coding', 'developer',
    'programming', 'app', 'website', 'ai', 'machine', 'learning', 'data',
    'cybersecurity', 'cloud', 'mobile', 'gadget', 'future', 'automation'
  ]
};

// Popular general hashtags
const TRENDING_HASHTAGS = [
  'love', 'instagood', 'photooftheday', 'beautiful', 'happy', 'cute', 'follow',
  'like4like', 'followme', 'picoftheday', 'instadaily', 'amazing', 'bestoftheday',
  'smile', 'instamood', 'fun', 'friends', 'family', 'life', 'cool', 'style',
  'repost', 'instapic', 'my', 'sun', 'sky', 'nofilter', 'happiness', 'pretty',
  'swag', 'photo', 'music', 'beach', 'tflers', 'followforfollow', 'l4l', 'girl',
  'look', 'instalike', 'party', 'summer', 'likeforlike', 'all_shots', 'textgram',
  'family', 'igdaily', 'followback', 'instacool', 'amazing', 'bestoftheday',
  'girls', 'night', 'baby', 'iphoneonly', 'sunset', 'dog', 'flowers', 'cat'
];

// Keywords that indicate different categories
const CATEGORY_KEYWORDS = {
  lifestyle: ['life', 'living', 'daily', 'routine', 'home', 'family', 'friends', 'weekend', 'relax', 'chill'],
  food: ['food', 'eat', 'drink', 'recipe', 'cook', 'meal', 'dinner', 'lunch', 'breakfast', 'restaurant', 'cafe', 'kitchen'],
  travel: ['travel', 'trip', 'vacation', 'adventure', 'explore', 'city', 'country', 'beach', 'mountain', 'hotel', 'flight'],
  fitness: ['gym', 'workout', 'exercise', 'run', 'training', 'health', 'fit', 'strong', 'muscle', 'cardio', 'yoga'],
  fashion: ['outfit', 'style', 'fashion', 'clothes', 'dress', 'shoes', 'accessories', 'shopping', 'brand', 'look'],
  business: ['work', 'business', 'office', 'meeting', 'project', 'success', 'entrepreneur', 'startup', 'career', 'professional'],
  photography: ['photo', 'picture', 'shot', 'camera', 'photography', 'capture', 'moment', 'light', 'portrait', 'landscape'],
  music: ['music', 'song', 'concert', 'band', 'guitar', 'piano', 'singing', 'musician', 'artist', 'album'],
  art: ['art', 'painting', 'drawing', 'creative', 'design', 'artist', 'gallery', 'exhibition', 'craft', 'handmade'],
  technology: ['tech', 'technology', 'app', 'software', 'coding', 'digital', 'computer', 'innovation', 'ai', 'data']
};

function analyzeCaption(caption) {
  const lowercaseCaption = caption.toLowerCase();
  const words = lowercaseCaption.split(/\s+/);
  
  // Count category matches
  const categoryScores = {};
  
  Object.entries(CATEGORY_KEYWORDS).forEach(([category, keywords]) => {
    categoryScores[category] = 0;
    keywords.forEach(keyword => {
      if (lowercaseCaption.includes(keyword)) {
        categoryScores[category] += 1;
      }
    });
  });
  
  // Find dominant categories
  const sortedCategories = Object.entries(categoryScores)
    .filter(([_, score]) => score > 0)
    .sort(([_, a], [__, b]) => b - a)
    .slice(0, 3)
    .map(([category, _]) => category);
  
  return sortedCategories.length > 0 ? sortedCategories : ['lifestyle'];
}

function generateHashtags(caption, categories) {
  const hashtags = new Set();
  
  // Add category-specific hashtags
  categories.forEach(category => {
    if (HASHTAG_CATEGORIES[category]) {
      // Add 3-5 hashtags from each category
      const categoryHashtags = HASHTAG_CATEGORIES[category]
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.min(5, Math.floor(Math.random() * 3) + 3));
      
      categoryHashtags.forEach(tag => hashtags.add(tag));
    }
  });
  
  // Add some trending hashtags
  const trendingCount = Math.floor(Math.random() * 5) + 3;
  const selectedTrending = TRENDING_HASHTAGS
    .sort(() => Math.random() - 0.5)
    .slice(0, trendingCount);
  
  selectedTrending.forEach(tag => hashtags.add(tag));
  
  // Extract potential hashtags from caption
  const captionWords = caption.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && word.length < 20);
  
  // Add some caption-based hashtags
  captionWords.slice(0, 3).forEach(word => hashtags.add(word));
  
  return Array.from(hashtags).slice(0, 30); // Instagram allows up to 30 hashtags
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
    
    // Analyze caption to determine categories
    const categories = analyzeCaption(caption);
    
    // Generate hashtags based on categories
    const hashtags = generateHashtags(caption, categories);
    
    // Categorize hashtags for better organization
    const categorizedHashtags = {
      trending: hashtags.filter(tag => TRENDING_HASHTAGS.includes(tag)),
      category: hashtags.filter(tag => !TRENDING_HASHTAGS.includes(tag)),
      suggested: hashtags
    };
    
    return NextResponse.json({
      hashtags: hashtags.map(tag => `#${tag}`),
      categories: categories,
      categorized: categorizedHashtags,
      count: hashtags.length
    });
    
  } catch (error) {
    console.error('Error generating hashtags:', error);
    return NextResponse.json(
      { error: 'Failed to generate hashtags' },
      { status: 500 }
    );
  }
}
