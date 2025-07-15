import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSupabase } from '@/context/SupabaseContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Hash, Wand2, X, Copy, RefreshCw, Sparkles, TrendingUp, BookMarked, Plus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const HashtagManager = ({ caption, onHashtagsChange, initialHashtags = [] }) => {
  const { user, isAuthenticated } = useAuth();
  const { supabase } = useSupabase();
  
  const [selectedHashtags, setSelectedHashtags] = useState(initialHashtags);
  const [suggestedHashtags, setSuggestedHashtags] = useState([]);
  const [customHashtag, setCustomHashtag] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categorizedHashtags, setCategorizedHashtags] = useState({
    trending: [],
    category: [],
    suggested: []
  });
  
  // Saved collections
  const [savedCollections, setSavedCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState('');
  const [collectionsLoading, setCollectionsLoading] = useState(false);

  // Load saved collections on mount
  useEffect(() => {
    if (isAuthenticated && user) {
      loadSavedCollections();
    }
  }, [isAuthenticated, user]);

  // Generate hashtags when caption changes
  useEffect(() => {
    if (caption && caption.trim().length > 0) {
      generateHashtags();
    }
  }, [caption]);

  // Notify parent component when hashtags change
  useEffect(() => {
    onHashtagsChange(selectedHashtags);
  }, [selectedHashtags, onHashtagsChange]);

  const loadSavedCollections = async () => {
    try {
      setCollectionsLoading(true);
      const { data, error } = await supabase
        .from('hashtag_collections')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
      
      if (error) throw error;
      setSavedCollections(data || []);
    } catch (error) {
      console.error('Error loading collections:', error);
    } finally {
      setCollectionsLoading(false);
    }
  };

  const loadCollection = (collectionId) => {
    const collection = savedCollections.find(c => c.id === collectionId);
    if (collection && collection.hashtags) {
      const newHashtags = [...new Set([...selectedHashtags, ...collection.hashtags])];
      setSelectedHashtags(newHashtags);
      toast.success(`Added ${collection.hashtags.length} hashtags from "${collection.name}"`);
    }
  };

  const generateHashtags = async () => {
    if (!caption.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/generate-hashtags-advanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ caption }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate hashtags');
      }

      const data = await response.json();
      setSuggestedHashtags(data.hashtags || []);
      setCategorizedHashtags(data.categorized || {
        trending: [],
        category: [],
        suggested: []
      });
      toast.success(`Generated ${data.hashtags?.length || 0} hashtags!`);
    } catch (err) {
      setError('Failed to generate hashtags. Please try again.');
      console.error('Error generating hashtags:', err);
    } finally {
      setLoading(false);
    }
  };

  const addHashtag = (hashtag) => {
    const cleanHashtag = hashtag.startsWith('#') ? hashtag : `#${hashtag}`;
    if (!selectedHashtags.includes(cleanHashtag) && selectedHashtags.length < 30) {
      setSelectedHashtags([...selectedHashtags, cleanHashtag]);
    }
  };

  const removeHashtag = (hashtag) => {
    setSelectedHashtags(selectedHashtags.filter(h => h !== hashtag));
  };

  const addCustomHashtag = () => {
    if (customHashtag.trim()) {
      const cleanHashtag = customHashtag.trim().startsWith('#') 
        ? customHashtag.trim() 
        : `#${customHashtag.trim()}`;
      
      if (!selectedHashtags.includes(cleanHashtag) && selectedHashtags.length < 30) {
        setSelectedHashtags([...selectedHashtags, cleanHashtag]);
        setCustomHashtag('');
      }
    }
  };

  const copyHashtags = () => {
    const hashtagString = selectedHashtags.join(' ');
    navigator.clipboard.writeText(hashtagString);
    // You might want to show a toast notification here
  };

  const clearAllHashtags = () => {
    setSelectedHashtags([]);
  };

  const HashtagBadge = ({ hashtag, onRemove, clickable = false, onClick }) => (
    <Badge 
      variant="secondary" 
      className={`m-1 ${clickable ? 'cursor-pointer hover:bg-blue-100' : ''}`}
      onClick={onClick}
    >
      {hashtag}
      {onRemove && (
        <X 
          className="w-3 h-3 ml-1 cursor-pointer hover:text-red-500" 
          onClick={(e) => {
            e.stopPropagation();
            onRemove(hashtag);
          }}
        />
      )}
    </Badge>
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Hash className="w-5 h-5" />
          Hashtag Manager
          <Badge variant="outline" className="ml-auto">
            {selectedHashtags.length}/30
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Generate Button and Saved Collections */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={generateHashtags}
              disabled={loading || !caption.trim()}
              className="flex items-center gap-2 flex-1 sm:flex-none"
              variant="default"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4" />
              )}
              {loading ? 'Generating...' : 'Generate Hashtags'}
            </Button>
            
            {selectedHashtags.length > 0 && (
              <>
                <Button
                  onClick={copyHashtags}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy All
                </Button>
                <Button
                  onClick={clearAllHashtags}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Clear All
                </Button>
              </>
            )}
          </div>
          
          {/* Saved Collections */}
          {isAuthenticated && savedCollections.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={selectedCollection} onValueChange={setSelectedCollection}>
                <SelectTrigger className="flex-1">
                  <BookMarked className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Load saved collection..." />
                </SelectTrigger>
                <SelectContent>
                  {savedCollections.map((collection) => (
                    <SelectItem key={collection.id} value={collection.id}>
                      {collection.name} ({collection.hashtags?.length || 0} hashtags)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => {
                  if (selectedCollection) {
                    loadCollection(selectedCollection);
                    setSelectedCollection('');
                  }
                }}
                disabled={!selectedCollection}
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add to Post
              </Button>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <Alert>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Selected Hashtags */}
        {selectedHashtags.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Selected Hashtags ({selectedHashtags.length})</h4>
            <div className="flex flex-wrap border rounded-lg p-3 min-h-[60px] bg-gray-50">
              {selectedHashtags.map((hashtag) => (
                <HashtagBadge
                  key={hashtag}
                  hashtag={hashtag}
                  onRemove={removeHashtag}
                />
              ))}
            </div>
          </div>
        )}

        {/* Add Custom Hashtag */}
        <div>
          <h4 className="font-medium mb-2">Add Custom Hashtag</h4>
          <div className="flex gap-2">
            <Input
              placeholder="Enter custom hashtag"
              value={customHashtag}
              onChange={(e) => setCustomHashtag(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addCustomHashtag();
                }
              }}
            />
            <Button
              onClick={addCustomHashtag}
              disabled={!customHashtag.trim() || selectedHashtags.length >= 30}
            >
              Add
            </Button>
          </div>
        </div>

        {/* Suggested Hashtags */}
        {suggestedHashtags.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Suggested Hashtags</h4>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all" className="flex items-center gap-1">
                  <Sparkles className="w-4 h-4" />
                  All
                </TabsTrigger>
                <TabsTrigger value="trending" className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  Trending
                </TabsTrigger>
                <TabsTrigger value="category" className="flex items-center gap-1">
                  <Hash className="w-4 h-4" />
                  Category
                </TabsTrigger>
                <TabsTrigger value="seasonal" className="flex items-center gap-1">
                  <Sparkles className="w-4 h-4" />
                  Seasonal
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="mt-4">
                <div className="flex flex-wrap max-h-40 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                  {suggestedHashtags.map((hashtag) => (
                    <HashtagBadge
                      key={hashtag}
                      hashtag={hashtag}
                      clickable={!selectedHashtags.includes(hashtag)}
                      onClick={() => {
                        if (!selectedHashtags.includes(hashtag)) {
                          addHashtag(hashtag);
                        }
                      }}
                    />
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="trending" className="mt-4">
                <div className="flex flex-wrap max-h-40 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                  {categorizedHashtags.trending.map((hashtag) => (
                    <HashtagBadge
                      key={hashtag}
                      hashtag={`#${hashtag}`}
                      clickable={!selectedHashtags.includes(`#${hashtag}`)}
                      onClick={() => {
                        if (!selectedHashtags.includes(`#${hashtag}`)) {
                          addHashtag(hashtag);
                        }
                      }}
                    />
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="category" className="mt-4">
                <div className="flex flex-wrap max-h-40 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                  {categorizedHashtags.category.map((hashtag) => (
                    <HashtagBadge
                      key={hashtag}
                      hashtag={`#${hashtag}`}
                      clickable={!selectedHashtags.includes(`#${hashtag}`)}
                      onClick={() => {
                        if (!selectedHashtags.includes(`#${hashtag}`)) {
                          addHashtag(hashtag);
                        }
                      }}
                    />
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="seasonal" className="mt-4">
                <div className="flex flex-wrap max-h-40 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                  {(categorizedHashtags.seasonal || []).map((hashtag) => (
                    <HashtagBadge
                      key={hashtag}
                      hashtag={`#${hashtag}`}
                      clickable={!selectedHashtags.includes(`#${hashtag}`)}
                      onClick={() => {
                        if (!selectedHashtags.includes(`#${hashtag}`)) {
                          addHashtag(hashtag);
                        }
                      }}
                    />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Helper Text */}
        <p className="text-sm text-gray-600">
          💡 Tip: Use 5-10 hashtags for better engagement. Mix trending and niche hashtags for optimal reach.
        </p>
      </CardContent>
    </Card>
  );
};

export default HashtagManager;
