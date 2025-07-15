"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSupabase } from "@/context/SupabaseContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Hash, 
  Plus, 
  Wand2, 
  Copy, 
  Trash2, 
  Edit, 
  Save, 
  X, 
  RefreshCw, 
  TrendingUp, 
  Sparkles,
  BookMarked,
  Search,
  Filter,
  Download,
  Upload,
  Star,
  BarChart3
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function HashtagPage() {
  const { user, isAuthenticated } = useAuth();
  const { supabase } = useSupabase();
  
  // State management
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  
  // Generation state
  const [generationCaption, setGenerationCaption] = useState("");
  const [generatedHashtags, setGeneratedHashtags] = useState([]);
  const [selectedHashtags, setSelectedHashtags] = useState([]);
  const [categorizedHashtags, setCategorizedHashtags] = useState({});
  const [generationLoading, setGenerationLoading] = useState(false);
  
  // Collection management
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const [newCollection, setNewCollection] = useState({
    name: "",
    description: "",
    category: "general",
    hashtags: []
  });

  // Load collections on mount
  useEffect(() => {
    if (isAuthenticated && user) {
      loadCollections();
    }
  }, [isAuthenticated, user]);

  const loadCollections = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("hashtag_collections")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCollections(data || []);
    } catch (error) {
      console.error("Error loading collections:", error);
      toast.error("Failed to load hashtag collections");
    } finally {
      setLoading(false);
    }
  };

  const generateHashtags = async () => {
    if (!generationCaption.trim()) {
      toast.error("Please enter a caption to generate hashtags");
      return;
    }

    setGenerationLoading(true);
    try {
      const response = await fetch('/api/generate-hashtags-advanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption: generationCaption }),
      });

      if (!response.ok) throw new Error('Failed to generate hashtags');

      const data = await response.json();
      setGeneratedHashtags(data.hashtags || []);
      setCategorizedHashtags(data.categorized || {});
      setSelectedHashtags([]);
      toast.success(`Generated ${data.hashtags?.length || 0} hashtags!`);
    } catch (error) {
      console.error('Error generating hashtags:', error);
      toast.error('Failed to generate hashtags');
    } finally {
      setGenerationLoading(false);
    }
  };

  const saveCollection = async () => {
    if (!newCollection.name.trim()) {
      toast.error("Collection name is required");
      return;
    }

    if (selectedHashtags.length === 0) {
      toast.error("Please select at least one hashtag");
      return;
    }

    try {
      setLoading(true);
      const collectionData = {
        ...newCollection,
        hashtags: selectedHashtags,
        user_id: user.id,
        updated_at: new Date().toISOString()
      };

      let result;
      if (editingCollection) {
        const { data, error } = await supabase
          .from("hashtag_collections")
          .update(collectionData)
          .eq("id", editingCollection.id)
          .eq("user_id", user.id)
          .select()
          .single();
        result = { data, error };
      } else {
        collectionData.created_at = new Date().toISOString();
        const { data, error } = await supabase
          .from("hashtag_collections")
          .insert(collectionData)
          .select()
          .single();
        result = { data, error };
      }

      if (result.error) throw result.error;

      toast.success(editingCollection ? "Collection updated!" : "Collection saved!");
      setShowCreateDialog(false);
      setEditingCollection(null);
      setNewCollection({ name: "", description: "", category: "general", hashtags: [] });
      setSelectedHashtags([]);
      setGeneratedHashtags([]);
      setGenerationCaption("");
      loadCollections();
    } catch (error) {
      console.error("Error saving collection:", error);
      toast.error("Failed to save collection");
    } finally {
      setLoading(false);
    }
  };

  const deleteCollection = async (collectionId) => {
    try {
      const { error } = await supabase
        .from("hashtag_collections")
        .delete()
        .eq("id", collectionId)
        .eq("user_id", user.id);

      if (error) throw error;
      
      toast.success("Collection deleted");
      loadCollections();
    } catch (error) {
      console.error("Error deleting collection:", error);
      toast.error("Failed to delete collection");
    }
  };

  const copyHashtags = (hashtags) => {
    const hashtagString = hashtags.join(' ');
    navigator.clipboard.writeText(hashtagString);
    toast.success(`Copied ${hashtags.length} hashtags to clipboard!`);
  };

  const toggleHashtagSelection = (hashtag) => {
    setSelectedHashtags(prev => 
      prev.includes(hashtag) 
        ? prev.filter(h => h !== hashtag)
        : [...prev, hashtag]
    );
  };

  const editCollection = (collection) => {
    setEditingCollection(collection);
    setNewCollection({
      name: collection.name,
      description: collection.description || "",
      category: collection.category || "general",
      hashtags: collection.hashtags || []
    });
    setSelectedHashtags(collection.hashtags || []);
    setShowCreateDialog(true);
  };

  const filteredCollections = collections.filter(collection => {
    const matchesSearch = collection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         collection.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || collection.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "general", label: "General" },
    { value: "lifestyle", label: "Lifestyle" },
    { value: "business", label: "Business" },
    { value: "food", label: "Food & Drink" },
    { value: "travel", label: "Travel" },
    { value: "fitness", label: "Fitness" },
    { value: "fashion", label: "Fashion" },
    { value: "technology", label: "Technology" },
    { value: "art", label: "Art & Design" }
  ];

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Hash className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Authentication Required</h3>
          <p className="text-muted-foreground">Please log in to manage your hashtags.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Hash className="h-8 w-8 text-purple-600" />
            Hashtag Manager
          </h1>
          <p className="text-muted-foreground mt-1">
            Generate, organize, and manage your hashtag collections
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 dark:text-white">
              <Plus className="h-4 w-4 mr-2" />
              New Collection
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCollection ? "Edit Collection" : "Create New Hashtag Collection"}
              </DialogTitle>
              <DialogDescription>
                Generate or manually add hashtags to create a reusable collection.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Collection Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="collection-name">Collection Name</Label>
                  <Input
                    id="collection-name"
                    placeholder="e.g., Fitness Monday Posts"
                    value={newCollection.name}
                    onChange={(e) => setNewCollection(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="collection-category">Category</Label>
                  <Select
                    value={newCollection.category}
                    onValueChange={(value) => setNewCollection(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.slice(1).map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="collection-description">Description (Optional)</Label>
                <Input
                  id="collection-description"
                  placeholder="Brief description of when to use these hashtags"
                  value={newCollection.description}
                  onChange={(e) => setNewCollection(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <Separator />

              {/* Hashtag Generation */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Wand2 className="h-5 w-5" />
                  Generate Hashtags
                </h3>
                
                <div className="space-y-3">
                  <Textarea
                    placeholder="Enter a sample caption to generate relevant hashtags..."
                    value={generationCaption}
                    onChange={(e) => setGenerationCaption(e.target.value)}
                    rows={3}
                  />
                  
                  <Button
                    onClick={generateHashtags}
                    disabled={generationLoading || !generationCaption.trim()}
                    className="w-full sm:w-auto"
                  >
                    {generationLoading ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    {generationLoading ? "Generating..." : "Generate Hashtags"}
                  </Button>
                </div>

                {/* Generated Hashtags */}
                {generatedHashtags.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Generated Hashtags ({generatedHashtags.length})</h4>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedHashtags([...new Set([...selectedHashtags, ...generatedHashtags])]);
                            toast.success("All hashtags selected!");
                          }}
                        >
                          Select All
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyHashtags(generatedHashtags)}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copy
                        </Button>
                      </div>
                    </div>
                    
                    <Tabs defaultValue="all" className="w-full">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="trending">Trending</TabsTrigger>
                        <TabsTrigger value="category">Category</TabsTrigger>
                        <TabsTrigger value="custom">Custom</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="all" className="mt-4">
                        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-3 border rounded-lg bg-gray-50">
                          {generatedHashtags.map((hashtag) => (
                            <Badge
                              key={hashtag}
                              variant={selectedHashtags.includes(hashtag) ? "default" : "secondary"}
                              className="cursor-pointer hover:bg-blue-100"
                              onClick={() => toggleHashtagSelection(hashtag)}
                            >
                              {hashtag}
                              {selectedHashtags.includes(hashtag) && (
                                <X className="h-3 w-3 ml-1" />
                              )}
                            </Badge>
                          ))}
                        </div>
                      </TabsContent>
                      
                      {Object.entries(categorizedHashtags).map(([category, hashtags]) => (
                        <TabsContent key={category} value={category} className="mt-4">
                          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-3 border rounded-lg bg-gray-50">
                            {hashtags.map((hashtag) => {
                              const fullHashtag = hashtag.startsWith('#') ? hashtag : `#${hashtag}`;
                              return (
                                <Badge
                                  key={fullHashtag}
                                  variant={selectedHashtags.includes(fullHashtag) ? "default" : "secondary"}
                                  className="cursor-pointer hover:bg-blue-100"
                                  onClick={() => toggleHashtagSelection(fullHashtag)}
                                >
                                  {fullHashtag}
                                  {selectedHashtags.includes(fullHashtag) && (
                                    <X className="h-3 w-3 ml-1" />
                                  )}
                                </Badge>
                              );
                            })}
                          </div>
                        </TabsContent>
                      ))}
                    </Tabs>
                  </div>
                )}

                {/* Selected Hashtags */}
                {selectedHashtags.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Selected Hashtags ({selectedHashtags.length})</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedHashtags([])}
                      >
                        Clear All
                      </Button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-blue-50 max-h-32 overflow-y-auto">
                      {selectedHashtags.map((hashtag) => (
                        <Badge
                          key={hashtag}
                          variant="default"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {hashtag}
                          <X 
                            className="h-3 w-3 ml-1 cursor-pointer" 
                            onClick={() => toggleHashtagSelection(hashtag)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Save Button */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateDialog(false);
                    setEditingCollection(null);
                    setNewCollection({ name: "", description: "", category: "general", hashtags: [] });
                    setSelectedHashtags([]);
                    setGeneratedHashtags([]);
                    setGenerationCaption("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveCollection}
                  disabled={loading || !newCollection.name.trim() || selectedHashtags.length === 0}
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {editingCollection ? "Update Collection" : "Save Collection"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search collections..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="w-full sm:w-48">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Collections */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredCollections.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Hash className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {collections.length === 0 ? "No hashtag collections yet" : "No collections match your search"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {collections.length === 0 
                ? "Create your first hashtag collection to get started" 
                : "Try adjusting your search or filter criteria"
              }
            </p>
            {collections.length === 0 && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Collection
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCollections.map((collection) => (
            <Card key={collection.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BookMarked className="h-5 w-5 text-purple-600" />
                      {collection.name}
                    </CardTitle>
                    {collection.description && (
                      <CardDescription className="mt-1">
                        {collection.description}
                      </CardDescription>
                    )}
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => editCollection(collection)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteCollection(collection.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    {categories.find(c => c.value === collection.category)?.label || collection.category}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {collection.hashtags?.length || 0} hashtags
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                {collection.hashtags && collection.hashtags.length > 0 ? (
                  <>
                    <div className="flex flex-wrap gap-1 mb-3 max-h-24 overflow-y-auto">
                      {collection.hashtags.slice(0, 10).map((hashtag) => (
                        <Badge key={hashtag} variant="secondary" className="text-xs">
                          {hashtag}
                        </Badge>
                      ))}
                      {collection.hashtags.length > 10 && (
                        <Badge variant="outline" className="text-xs">
                          +{collection.hashtags.length - 10} more
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyHashtags(collection.hashtags)}
                        className="flex-1"
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy All
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedCollection(collection)}
                      >
                        <BarChart3 className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground text-sm">No hashtags in this collection</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
