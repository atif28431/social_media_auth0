"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSupabase } from "@/context/SupabaseContext";
import { 
  getUserPages as getFacebookPages, 
  postToFacebook, 
  schedulePost, 
  validateAccessToken,
  refreshUserPages,
  needsReconnection 
} from "@/utils/facebook";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Facebook,Trash2, Image,Upload ,Globe ,MessageSquare ,Smartphone ,ImageIcon ,FolderOpen , Calendar, Clock, Users, Save, Send, Link as LinkIcon, Link2, AlertTriangle, RefreshCw, Video, Film, Check, Shield, Lightbulb, MessageCircle, BarChart } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import ImageGallery from "@/components/ImageGallery";
import PostTips from "@/components/PostTips";

export default function FacebookPage() {
  const { user, isAuthenticated, fbAccessToken } = useAuth();
  const { addScheduledPost, saveUserPages, getUserPages: getSavedPages } = useSupabase();
  const [message, setMessage] = useState("");
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState("");
  const [selectedPageName, setSelectedPageName] = useState("");
  const [enableScheduling, setEnableScheduling] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [mediaFile, setMediaFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedMediaUrl, setSelectedMediaUrl] = useState(null);
  const [mediaType, setMediaType] = useState("image"); // image, video, reel, story_image, story_video
  const [linkUrl, setLinkUrl] = useState("");
  const [postType, setPostType] = useState("text"); // text, image, link, video, reel, story_image, story_video
  const [tokenExpired, setTokenExpired] = useState(false);
  const [refreshingTokens, setRefreshingTokens] = useState(false);

  // Check token validity on mount
  useEffect(() => {
    const checkTokenValidity = async () => {
      if (fbAccessToken) {
        const expired = await needsReconnection(fbAccessToken);
        setTokenExpired(expired);
        if (expired) {
          toast.error("Your Facebook session has expired. Please reconnect your account.");
        }
      }
    };

    checkTokenValidity();
  }, [fbAccessToken]);

  // Handle token refresh callback
  const handleTokenRefresh = async (refreshedPages) => {
    console.log('🔄 Tokens refreshed, updating pages...');
    setPages(refreshedPages);
    
    // Update selected page if it exists in refreshed pages
    if (selectedPage) {
      const updatedPage = refreshedPages.find(p => p.id === selectedPage);
      if (updatedPage) {
        setSelectedPageName(updatedPage.name);
      }
    }
    
    // Save refreshed pages to database
    try {
      await saveUserPages(refreshedPages);
      console.log('✅ Refreshed pages saved to database');
      setTokenExpired(false);
      toast.success("Facebook tokens refreshed successfully!");
    } catch (error) {
      console.error('Error saving refreshed pages:', error);
    }
  };

  // Manual token refresh function
  const refreshTokens = async () => {
    if (!fbAccessToken) {
      toast.error("No Facebook token available. Please reconnect your account.");
      return;
    }

    setRefreshingTokens(true);
    try {
      console.log('🔄 Manually refreshing Facebook tokens...');
      const refreshedPages = await refreshUserPages(fbAccessToken);
      await handleTokenRefresh(refreshedPages);
    } catch (error) {
      console.error('Manual token refresh failed:', error);
      toast.error("Failed to refresh tokens. Please reconnect your Facebook account.");
      setTokenExpired(true);
    } finally {
      setRefreshingTokens(false);
    }
  };

  // Fetch user's Facebook pages when component mounts
  useEffect(() => {
    const fetchPages = async () => {
      if (isAuthenticated && fbAccessToken && user?.id && !tokenExpired) {
        console.log('🔍 Starting to fetch Facebook pages...');
        console.log('User ID:', user.id);
        console.log('FB Access Token exists:', !!fbAccessToken);
        console.log('FB Access Token (first 20 chars):', fbAccessToken?.substring(0, 20) + '...');
        
        setLoading(true);
        try {
          // First try to get saved pages from database
          console.log('📊 Checking for saved pages in database...');
          const savedPages = await getSavedPages();
          console.log('Saved pages from database:', savedPages);
          
          if (savedPages && savedPages.length > 0) {
            // Convert database format to component format
            const formattedPages = savedPages.map(page => ({
              id: page.page_id,
              name: page.page_name,
              access_token: page.access_token,
              category: page.category
            }));
            
            // Validate at least one token before using saved pages
            const firstPageToken = formattedPages[0]?.access_token;
            if (firstPageToken) {
              const isTokenValid = await validateAccessToken(firstPageToken);
              if (isTokenValid) {
                setPages(formattedPages);
                setSelectedPage(formattedPages[0].id);
                setSelectedPageName(formattedPages[0].name);
                console.log('✅ Using saved pages with valid tokens:', formattedPages);
              } else {
                console.log('⚠️ Saved tokens are invalid, fetching fresh ones...');
                throw new Error('Saved tokens are invalid');
              }
            } else {
              throw new Error('No access token found in saved pages');
            }
          } else {
            console.log('📡 No saved pages found, fetching from Facebook API...');
            throw new Error('No saved pages found');
          }
        } catch (error) {
          console.log('🔄 Fetching fresh pages from Facebook API...');
          try {
            // If no saved pages or invalid tokens, fetch from Facebook API
            const fetchedPages = await getFacebookPages(fbAccessToken);
            console.log('Pages fetched from Facebook API:', fetchedPages);
            
            if (fetchedPages && fetchedPages.length > 0) {
              setPages(fetchedPages);
              setSelectedPage(fetchedPages[0].id);
              setSelectedPageName(fetchedPages[0].name);
              console.log('💾 Saving pages to database...');
              // Save pages to database for future use
              const saveResult = await saveUserPages(fetchedPages);
              console.log('Save result:', saveResult);
              setTokenExpired(false);
            } else {
              console.log('⚠️ No pages found from Facebook API');
              toast.error('No Facebook pages found. Make sure you have pages associated with your Facebook account.');
            }
          } catch (apiError) {
            console.error('❌ Error fetching pages from API:', apiError);
            if (apiError.message.includes('invalid') || apiError.message.includes('expired')) {
              setTokenExpired(true);
              toast.error('Your Facebook session has expired. Please reconnect your account.');
            } else {
              toast.error(`Failed to fetch Facebook pages: ${apiError.message}`);
            }
          }
        } finally {
          setLoading(false);
        }
      } else {
        console.log('⏸️ Not fetching pages - missing requirements:');
        console.log('  - Authenticated:', isAuthenticated);
        console.log('  - FB Access Token:', !!fbAccessToken);
        console.log('  - User ID:', !!user?.id);
        console.log('  - Token Valid:', !tokenExpired);
      }
    };

    fetchPages();
  }, [isAuthenticated, fbAccessToken, user?.id, tokenExpired]);

  // Updated handleMediaUpload function with better error handling
const handleMediaUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  console.log('📤 Starting media upload...', {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type
  });

  setMediaFile(file);

  // Determine media type based on file type and current post type
  let type = "image";
  if (file.type.startsWith("video/")) {
    if (postType === "reel") {
      type = "reel";
    } else if (postType === "story_video") {
      type = "story_video";
    } else {
      type = "video";
    }
  } else if (file.type.startsWith("image/")) {
    if (postType === "story_image") {
      type = "story_image";
    } else {
      type = "image";
    }
  }
  
  setMediaType(type);

  // Create a preview
  const reader = new FileReader();
  reader.onloadend = () => {
    setImagePreview(reader.result);
  };
  reader.readAsDataURL(file);

  // Show uploading toast
  const uploadingToast = toast.loading(`Uploading ${type}...`);

  try {
    // Upload to Supabase Storage
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', user.id);
    formData.append('platform', 'facebook');
    formData.append('mediaType', type);

    console.log('🔄 Making API request to /api/upload/media...');

    const response = await fetch('/api/upload/media', {
      method: 'POST',
      body: formData,
    });

    console.log('📡 Response status:', response.status);
    
    // Check if response is ok
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Response not ok:', errorText);
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }

    // Try to parse JSON response
    let result;
    try {
      const responseText = await response.text();
      console.log('📝 Raw response:', responseText);
      
      // Check if it's HTML (error page)
      if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
        throw new Error('Server returned HTML error page instead of JSON. Check server logs.');
      }
      
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      throw new Error('Invalid server response. Please check server logs.');
    }

    console.log('✅ Upload result:', result);
    
    if (result.success) {
      // Store the uploaded media data for later use
      setMediaFile({
        ...file,
        uploadedData: result.media
      });
      setSelectedMediaUrl(result.media.public_url);
      toast.dismiss(uploadingToast);
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully!`);
    } else {
      console.error('❌ Upload failed:', result.error);
      toast.dismiss(uploadingToast);
      toast.error(`Failed to upload ${type}: ${result.error}`);
      
      // Reset states on failure
      setMediaFile(null);
      setImagePreview(null);
      setSelectedMediaUrl(null);
    }
  } catch (error) {
    console.error('❌ Error in media upload:', error);
    toast.dismiss(uploadingToast);
    toast.error(`Failed to upload ${type}: ${error.message}`);
    
    // Reset states on error
    setMediaFile(null);
    setImagePreview(null);
    setSelectedMediaUrl(null);
  }
};


  const saveAsDraft = async () => {
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    try {
      const draftData = {
        message,
        platform: "facebook",
        status: "draft",
        page_id: selectedPage,
        page_name: selectedPageName,
        post_type: postType,
        link_url: linkUrl,
        user_id: user.id,
        created_at: new Date().toISOString()
      };

      // In a real implementation, save to database
      toast.success("Draft saved successfully!");
    } catch (error) {
      console.error("Error saving draft:", error);
      toast.error("Failed to save draft");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (tokenExpired) {
      toast.error("Your Facebook session has expired. Please refresh tokens or reconnect your account.");
      return;
    }
    
    setLoading(true);

    try {
      if (!message.trim() && !['image', 'video', 'reel', 'story_image', 'story_video'].includes(postType)) {
        throw new Error("Please enter a message");
      }

      if (!selectedPage) {
        throw new Error("Please select a Facebook Page to post to");
      }

      if (!fbAccessToken) {
        throw new Error("Please connect your Facebook account first");
      }

      // Find the selected page object
      const pageObj = pages.find((p) => p.id === selectedPage);
      if (!pageObj || !pageObj.access_token) {
        throw new Error("No access token found for selected page");
      }

      // Get the media URL to include in the post
      let mediaUrl = null;
      if (selectedMediaUrl) {
        mediaUrl = selectedMediaUrl;
      } else if (mediaFile && mediaFile.uploadedData) {
        mediaUrl = mediaFile.uploadedData.public_url;
      }

      // Determine the correct media type to send to the API
      let apiMediaType = postType;
      
      // For text posts, ensure we don't send any media type that could trigger video upload
      if (postType === "text") {
        apiMediaType = "text";
        mediaUrl = null; // Ensure no media URL is sent for text posts
      }

      let result;
      if (enableScheduling && scheduledDate && scheduledTime) {
        const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
        
        // Schedule the post with token refresh capability and media
        result = await schedulePost(
          pageObj.access_token,
          message,
          scheduledDateTime,
          selectedPage,
          fbAccessToken,
          handleTokenRefresh,
          mediaUrl,
          apiMediaType
        );
        
        // Save scheduled post to Supabase
        await addScheduledPost({
          message,
          scheduledPublishTime: scheduledDateTime.toISOString(),
          pageId: selectedPage,
          pageName: selectedPageName,
          platform: "facebook",
          status: "scheduled",
          facebook_post_id: result?.id || null,
          post_type: postType,
          link_url: linkUrl,
          media_url: mediaUrl,
          media_type: mediaType
        });
        
        toast.success("Post scheduled successfully!");
      } else {
        // Post immediately with token refresh capability and media
        result = await postToFacebook(
          pageObj.access_token,
          message,
          selectedPage,
          fbAccessToken,
          handleTokenRefresh,
          mediaUrl,
          apiMediaType
        );
        
        toast.success("Post published successfully!");
      }

      // Reset form
      setMessage("");
      setMediaFile(null);
      setImagePreview(null);
      setSelectedMediaUrl(null);
      setLinkUrl("");
      setPostType("text");
      setEnableScheduling(false);
      setScheduledDate("");
      setScheduledTime("");
    } catch (error) {
      console.error("Error posting to Facebook:", error);
      
      if (error.message.includes('expired') || error.message.includes('invalid')) {
        setTokenExpired(true);
        toast.error("Your Facebook session has expired. Please refresh tokens or reconnect your account.");
      } else {
        toast.error(error.message || "Failed to post to Facebook");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl text-center">
        <h1 className="text-2xl font-bold mb-4">Please log in to continue</h1>
        <Link href="/login">
          <Button>Go to Login</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-8 max-w-5xl">
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4 justify-lg-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
              <Facebook className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex">Facebook

                {fbAccessToken && (
            <div className="mt-3 sm:mt-0 sm:ml-auto flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${tokenExpired ? 'bg-red-500' : 'bg-green-500'}`} />
              <span className="text-sm">
                {tokenExpired ? 'Session Expired' : 'Connected'}
              </span>
            </div>
          )}
              </h1>
              <p className="text-muted-foreground text-sm md:text-base">Create and schedule Facebook posts</p>
            </div>
          </div>
          
          
        </div>
        
        {!fbAccessToken && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4 mb-6 shadow-sm">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
              <p className="text-yellow-800 flex-1">
                Facebook account not connected. 
                <Link href="/settings" className="underline font-medium ml-1 text-blue-600 hover:text-blue-800">
                  Connect your account
                </Link>
              </p>
            </div>
          </div>
        )}

        {/* Token expiration warning */}
        {tokenExpired && fbAccessToken && (
          <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-4 mb-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-800 font-medium">Facebook Session Expired</p>
                  <p className="text-red-700 text-sm">Your Facebook tokens have expired. Refresh them or reconnect your account.</p>
                </div>
              </div>
              <div className="flex gap-2 mt-3 sm:mt-0 sm:ml-auto">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={refreshTokens}
                  disabled={refreshingTokens}
                  className="shadow-sm"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshingTokens ? 'animate-spin' : ''}`} />
                  {refreshingTokens ? 'Refreshing...' : 'Refresh'}
                </Button>
                <Link href="/settings">
                  <Button size="sm" variant="outline" className="shadow-sm">
                    Reconnect
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
        {/* Main Content Area */}
        <div className="lg:col-span-8 order-1 lg:order-1">
          <Card className="shadow-md border-0 overflow-hidden">
            <CardHeader className="">
              <CardTitle>Create Facebook Post</CardTitle>
              <CardDescription>
                Share content with your Facebook audience
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Page Selector */}
                <div className="space-y-2">
                  <Label htmlFor="page" className="text-sm font-medium">Post to</Label>
                  <Select
                    value={selectedPage}
                    onValueChange={(value) => {
                      setSelectedPage(value);
                      const page = pages.find((p) => p.id === value);
                      if (page) setSelectedPageName(page.name);
                    }}
                    disabled={tokenExpired}
                  >
                    <SelectTrigger className="bg-white dark:bg-gray-800 border shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <SelectValue placeholder="Select a page" />
                    </SelectTrigger>
                    <SelectContent>
                      {pages.length > 0 ? (
                        pages.map((page) => (
                          <SelectItem key={page.id} value={page.id}>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-blue-500 dark:text-white" />
                              {page.name}
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-center text-sm text-gray-500">
                          No pages found
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Post Type Tabs */}
                <div className="mt-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="post-type" className="text-sm font-medium mb-2 block">Post Type</Label>
                      <Select 
                        value={postType} 
                        onValueChange={(value) => {
                          setPostType(value);
                          // Reset media when switching to text post
                          if (value === "text") {
                            setMediaFile(null);
                            setImagePreview(null);
                            setSelectedMediaUrl(null);
                            setMediaType("text");
                          }
                        }} 
                        disabled={tokenExpired}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select post type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">
                            <div className="flex items-center gap-2">
                              <span className="i-lucide-text-cursor h-4 w-4" />
                              <span>Text Post</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="image">
                            <div className="flex items-center gap-2">
                              <span className="i-lucide-image h-4 w-4" />
                              <span>Image Post</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="link">
                            <div className="flex items-center gap-2">
                              <span className="i-lucide-link h-4 w-4" />
                              <span>Link Post</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="video">
                            <div className="flex items-center gap-2">
                              <span className="i-lucide-video h-4 w-4" />
                              <span>Video Post</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="reel">
                            <div className="flex items-center gap-2">
                              <span className="i-lucide-film h-4 w-4" />
                              <span>Reel</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="story_image">
                            <div className="flex items-center gap-2">
                              <span className="i-lucide-image h-4 w-4" />
                              <span>Image Story</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="story_video">
                            <div className="flex items-center gap-2">
                              <span className="i-lucide-video h-4 w-4" />
                              <span>Video Story</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    </div>

                  {postType === "text" && (
                    <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="What's on your mind?"
                        className="min-h-[120px]"
                        maxLength={63206}
                        disabled={tokenExpired}
                      />
                      <p className="text-xs text-gray-500">
                        {message.length}/63,206 characters
                      </p>
                    </div>
                  </div>
                  )}

                  {postType === "image" && (
                    <div className="space-y-4 mt-4">
                    {/* Image Upload */}
                    <div className="space-y-3">
                      <Label htmlFor="image" className="text-sm font-medium flex items-center gap-2">
                        <Image className="h-4 w-4 text-blue-500" />
                        <span>Upload Image</span>
                      </Label>
                      <div className="border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 md:p-6 transition-all hover:bg-gray-100 dark:hover:bg-gray-800 text-center">
                        {(imagePreview || selectedMediaUrl) ? (
                          <div className="space-y-4">
                            <div className="relative group overflow-hidden rounded-lg shadow-md max-w-md mx-auto">
                              <img 
                                src={selectedMediaUrl || imagePreview} 
                                alt="Preview" 
                                className="w-full h-48 sm:h-64 object-cover transition-transform group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button 
                                  type="button" 
                                  variant="destructive" 
                                  size="sm"
                                  className="shadow-md"
                                  onClick={() => {
                                    setMediaFile(null);
                                    setImagePreview(null);
                                    setSelectedMediaUrl(null);
                                  }}
                                  disabled={tokenExpired}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Remove
                                </Button>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 justify-center">
                              <ImageGallery 
                                platform="facebook" 
                                onImageSelect={(url, imageData) => {
                                  setSelectedMediaUrl(url);
                                  setMediaFile(imageData);
                                  setImagePreview(null);
                                }}
                                selectedImageUrl={selectedMediaUrl}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="p-4 rounded-full bg-blue-50 dark:bg-blue-900/20 w-16 h-16 mx-auto flex items-center justify-center">
                              <Image className="h-8 w-8 text-blue-500" />
                            </div>
                            <div className="space-y-3">
                              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                                <Label 
                                  htmlFor="image-upload" 
                                  className={`${tokenExpired ? "cursor-not-allowed opacity-50" : "cursor-pointer"} inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-colors`}
                                >
                                  <Upload className="h-4 w-4" />
                                  <span>Upload image</span>
                                </Label>
                                <Input
                                  id="image-upload"
                                  type="file"
                                  accept="image/*"
                                  onChange={handleMediaUpload}
                                  className="hidden"
                                  disabled={tokenExpired}
                                />
                                <span className="text-sm text-gray-500">or</span>
                                <ImageGallery 
                                  platform="facebook" 
                                  onImageSelect={(url, imageData) => {
                                    setSelectedMediaUrl(url);
                                    setMediaFile(imageData);
                                    setImagePreview(null);
                                  }}
                                  selectedImageUrl={selectedMediaUrl}
                                />
                              </div>
                              <p className="text-xs text-gray-500">Drag and drop your image here or click to browse</p>
                              <div className="flex items-center justify-center gap-2">
                                <Badge variant="outline" className="text-xs font-normal">
                                  PNG
                                </Badge>
                                <Badge variant="outline" className="text-xs font-normal">
                                  JPG
                                </Badge>
                                <Badge variant="outline" className="text-xs font-normal">
                                  Max 10MB
                                </Badge>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-sm font-medium flex items-center gap-2">
                        <span className="i-lucide-text h-4 w-4 text-blue-500" />
                        <span>Caption</span>
                      </Label>
                      <Textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Write a caption for your image..."
                        className="min-h-[120px] resize-y border shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        disabled={tokenExpired}
                      />
                    </div>
                  </div>
                  )}

                  {postType === "link" && (
                    <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="link" className="text-sm font-medium flex items-center gap-2">
                        <Link className="h-4 w-4 text-blue-500" />
                        <span>Link URL</span>
                      </Label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <Globe className="h-4 w-4 text-gray-400" />
                        </div>
                        <Input
                          id="link"
                          type="url"
                          value={linkUrl}
                          onChange={(e) => setLinkUrl(e.target.value)}
                          placeholder="https://example.com"
                          className="pl-10 border shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          disabled={tokenExpired}
                        />
                      </div>
                      {linkUrl && (
                        <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-blue-500" />
                            <p className="text-sm font-medium truncate">{linkUrl}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-sm font-medium flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-blue-500" />
                        <span>Message</span>
                      </Label>
                      <Textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Share your thoughts about this link..."
                        className="min-h-[120px] resize-y border shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        disabled={tokenExpired}
                      />
                      <p className="text-xs text-gray-500">Add context to your link to increase engagement</p>
                    </div>
                  </div>
                  )}

                  {postType === "video" && (
                    <div className="space-y-4 mt-4">
                    {/* Video Upload */}
                    <div className="space-y-3">
                      <Label htmlFor="video" className="text-sm font-medium flex items-center gap-2">
                        <Video className="h-4 w-4 text-blue-500" />
                        <span>Upload Video</span>
                      </Label>
                      <div className="border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 md:p-6 transition-all hover:bg-gray-100 dark:hover:bg-gray-800 text-center">
                        {selectedMediaUrl ? (
                          <div className="space-y-4">
                            <div className="relative group overflow-hidden rounded-lg shadow-md max-w-md mx-auto">
                              <video 
                                src={selectedMediaUrl} 
                                controls
                                className="w-full h-48 sm:h-64 object-cover"
                              />
                              <div className="absolute bottom-0 right-0 p-2">
                                <Button 
                                  type="button" 
                                  variant="destructive" 
                                  size="sm"
                                  className="shadow-md"
                                  onClick={() => {
                                    setMediaFile(null);
                                    setSelectedMediaUrl(null);
                                  }}
                                  disabled={tokenExpired}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Remove
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="p-4 rounded-full bg-blue-50 dark:bg-blue-900/20 w-16 h-16 mx-auto flex items-center justify-center">
                              <Video className="h-8 w-8 text-blue-500" />
                            </div>
                            <div className="space-y-3">
                              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                                <Label 
                                  htmlFor="video-upload" 
                                  className={`${tokenExpired ? "cursor-not-allowed opacity-50" : "cursor-pointer"} inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-colors`}
                                >
                                  <Upload className="h-4 w-4" />
                                  <span>Upload video</span>
                                </Label>
                                <Input
                                  id="video-upload"
                                  type="file"
                                  accept="video/*"
                                  onChange={handleMediaUpload}
                                  className="hidden"
                                  disabled={tokenExpired}
                                />
                              </div>
                              <p className="text-xs text-gray-500">Drag and drop your video here or click to browse</p>
                              <div className="flex items-center justify-center gap-2">
                                <Badge variant="outline" className="text-xs font-normal">
                                  MP4
                                </Badge>
                                <Badge variant="outline" className="text-xs font-normal">
                                  MOV
                                </Badge>
                                <Badge variant="outline" className="text-xs font-normal">
                                  Max 100MB
                                </Badge>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-sm font-medium flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-blue-500" />
                        <span>Caption</span>
                      </Label>
                      <Textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Write a caption for your video..."
                        className="min-h-[120px] resize-y border shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        disabled={tokenExpired}
                      />
                      <p className="text-xs text-gray-500">A good caption can increase engagement with your video</p>
                    </div>
                  </div>
                  )}

                  {postType === "reel" && (
                    <div className="space-y-4 mt-4">
                    {/* Reel Upload */}
                    <div className="space-y-3">
                      <Label htmlFor="reel" className="text-sm font-medium flex items-center gap-2">
                        <Film className="h-4 w-4 text-blue-500" />
                        <span>Upload Reel</span>
                      </Label>
                      <div className="border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 md:p-6 transition-all hover:bg-gray-100 dark:hover:bg-gray-800 text-center">
                        {selectedMediaUrl ? (
                          <div className="space-y-4">
                            <div className="relative group overflow-hidden rounded-lg shadow-md max-w-md mx-auto">
                              <video 
                                src={selectedMediaUrl} 
                                controls
                                className="w-full h-64 sm:h-80 object-cover"
                              />
                              <div className="absolute bottom-0 right-0 p-2">
                                <Button 
                                  type="button" 
                                  variant="destructive" 
                                  size="sm"
                                  className="shadow-md"
                                  onClick={() => {
                                    setMediaFile(null);
                                    setSelectedMediaUrl(null);
                                  }}
                                  disabled={tokenExpired}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Remove
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="p-4 rounded-full bg-blue-50 dark:bg-blue-900/20 w-16 h-16 mx-auto flex items-center justify-center">
                              <Film className="h-8 w-8 text-blue-500" />
                            </div>
                            <div className="space-y-3">
                              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                                <Label 
                                  htmlFor="reel-upload" 
                                  className={`${tokenExpired ? "cursor-not-allowed opacity-50" : "cursor-pointer"} inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-colors`}
                                >
                                  <Upload className="h-4 w-4" />
                                  <span>Upload reel</span>
                                </Label>
                                <Input
                                  id="reel-upload"
                                  type="file"
                                  accept="video/*"
                                  onChange={handleMediaUpload}
                                  className="hidden"
                                  disabled={tokenExpired}
                                />
                              </div>
                              <p className="text-xs text-gray-500">Drag and drop your reel here or click to browse</p>
                              <div className="flex flex-col items-center justify-center gap-2">
                                <div className="flex items-center justify-center gap-2">
                                  <Badge variant="outline" className="text-xs font-normal">
                                    MP4
                                  </Badge>
                                  <Badge variant="outline" className="text-xs font-normal">
                                    MOV
                                  </Badge>
                                  <Badge variant="outline" className="text-xs font-normal">
                                    Max 100MB
                                  </Badge>
                                </div>
                                <Badge variant="secondary" className="text-xs font-normal mt-1">
                                  <Smartphone className="h-3 w-3 mr-1" />
                                  Vertical format recommended
                                </Badge>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-sm font-medium flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-blue-500" />
                        <span>Caption</span>
                      </Label>
                      <Textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Write a caption for your reel..."
                        className="min-h-[120px] resize-y border shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        disabled={tokenExpired}
                      />
                      <p className="text-xs text-gray-500">Engaging captions can help your reel reach more people</p>
                    </div>
                  </div>
                  )}

                  {postType === "story_image" && (
                    <div className="space-y-4 mt-4">
                    {/* Story Image Upload */}
                    <div className="space-y-3">
                      <Label htmlFor="story_image" className="text-sm font-medium flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-blue-500" />
                        <span>Story Image</span>
                      </Label>
                      <div className="border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 md:p-6 transition-all hover:bg-gray-100 dark:hover:bg-gray-800 text-center">
                        {selectedMediaUrl ? (
                          <div className="space-y-4">
                            <div className="relative group overflow-hidden rounded-lg shadow-md max-w-md mx-auto">
                              <img 
                                src={selectedMediaUrl} 
                                alt="Preview" 
                                className="w-full h-64 sm:h-80 object-cover"
                              />
                              <div className="absolute bottom-0 right-0 p-2">
                                <Button 
                                  type="button" 
                                  variant="destructive" 
                                  size="sm"
                                  className="shadow-md"
                                  onClick={() => {
                                    setMediaFile(null);
                                    setSelectedMediaUrl(null);
                                  }}
                                  disabled={tokenExpired}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Remove
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="p-4 rounded-full bg-blue-50 dark:bg-blue-900/20 w-16 h-16 mx-auto flex items-center justify-center">
                              <ImageIcon className="h-8 w-8 text-blue-500" />
                            </div>
                            <div className="space-y-3">
                              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                                <Label 
                                  htmlFor="story-image-upload" 
                                  className={`${tokenExpired ? "cursor-not-allowed opacity-50" : "cursor-pointer"} inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-colors`}
                                >
                                  <Upload className="h-4 w-4" />
                                  <span>Upload image</span>
                                </Label>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => document.getElementById('image-gallery-trigger').click()}
                                  disabled={tokenExpired}
                                  className="flex items-center gap-2"
                                >
                                  <FolderOpen className="h-4 w-4" />
                                  <span>Browse gallery</span>
                                </Button>
                                <Input
                                  id="story-image-upload"
                                  type="file"
                                  accept="image/*"
                                  onChange={handleMediaUpload}
                                  className="hidden"
                                  disabled={tokenExpired}
                                />
                              </div>
                              <p className="text-xs text-gray-500">Drag and drop your image here or click to browse</p>
                              <div className="flex flex-col items-center justify-center gap-2">
                                <div className="flex items-center justify-center gap-2">
                                  <Badge variant="outline" className="text-xs font-normal">
                                    PNG
                                  </Badge>
                                  <Badge variant="outline" className="text-xs font-normal">
                                    JPG
                                  </Badge>
                                  <Badge variant="outline" className="text-xs font-normal">
                                    Max 10MB
                                  </Badge>
                                </div>
                                <Badge variant="secondary" className="text-xs font-normal mt-1">
                                  <Smartphone className="h-3 w-3 mr-1" />
                                  9:16 ratio recommended
                                </Badge>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-sm font-medium flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-blue-500" />
                        <span>Caption</span>
                      </Label>
                      <Textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Write a caption for your story..."
                        className="min-h-[120px] resize-y border shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        disabled={tokenExpired}
                      />
                      <p className="text-xs text-gray-500">Add a caption to provide context to your story</p>
                    </div>
                  </div>
                  )}

                  {postType === "story_video" && (
                    <div className="space-y-4 mt-4">
                    {/* Story Video Upload */}
                    <div className="space-y-3">
                      <Label htmlFor="story_video" className="text-sm font-medium flex items-center gap-2">
                        <Video className="h-4 w-4 text-blue-500" />
                        <span>Story Video</span>
                      </Label>
                      <div className="border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 md:p-6 transition-all hover:bg-gray-100 dark:hover:bg-gray-800 text-center">
                        {selectedMediaUrl ? (
                          <div className="space-y-4">
                            <div className="relative group overflow-hidden rounded-lg shadow-md max-w-md mx-auto">
                              <video 
                                src={selectedMediaUrl} 
                                controls
                                className="w-full h-64 sm:h-80 object-cover"
                              />
                              <div className="absolute bottom-0 right-0 p-2">
                                <Button 
                                  type="button" 
                                  variant="destructive" 
                                  size="sm"
                                  className="shadow-md"
                                  onClick={() => {
                                    setMediaFile(null);
                                    setSelectedMediaUrl(null);
                                  }}
                                  disabled={tokenExpired}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Remove
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="p-4 rounded-full bg-blue-50 dark:bg-blue-900/20 w-16 h-16 mx-auto flex items-center justify-center">
                              <Video className="h-8 w-8 text-blue-500" />
                            </div>
                            <div className="space-y-3">
                              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                                <Label 
                                  htmlFor="story-video-upload" 
                                  className={`${tokenExpired ? "cursor-not-allowed opacity-50" : "cursor-pointer"} inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-colors`}
                                >
                                  <Upload className="h-4 w-4" />
                                  <span>Upload video</span>
                                </Label>
                                <Input
                                  id="story-video-upload"
                                  type="file"
                                  accept="video/*"
                                  onChange={handleMediaUpload}
                                  className="hidden"
                                  disabled={tokenExpired}
                                />
                              </div>
                              <p className="text-xs text-gray-500">Drag and drop your video here or click to browse</p>
                              <div className="flex flex-col items-center justify-center gap-2">
                                <div className="flex items-center justify-center gap-2">
                                  <Badge variant="outline" className="text-xs font-normal">
                                    MP4
                                  </Badge>
                                  <Badge variant="outline" className="text-xs font-normal">
                                    MOV
                                  </Badge>
                                  <Badge variant="outline" className="text-xs font-normal">
                                    Max 100MB
                                  </Badge>
                                </div>
                                <Badge variant="secondary" className="text-xs font-normal mt-1">
                                  <Smartphone className="h-3 w-3 mr-1" />
                                  9:16 ratio recommended
                                </Badge>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-sm font-medium flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-blue-500" />
                        <span>Caption</span>
                      </Label>
                      <Textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Write a caption for your story..."
                        className="min-h-[120px] resize-y border shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        disabled={tokenExpired}
                      />
                      <p className="text-xs text-gray-500">Add a caption to provide context to your story</p>
                    </div>
                  </div>
                  )}
                </div>

                {/* Scheduling */}
                <div className="space-y-4 mt-6 border-t pt-6 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="schedule"
                        checked={enableScheduling}
                        onCheckedChange={setEnableScheduling}
                        disabled={tokenExpired}
                        className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                      />
                      <Label 
                        htmlFor="schedule" 
                        className="text-sm font-medium flex items-center gap-2"
                      >
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span>Schedule for later</span>
                      </Label>
                    </div>
                    {enableScheduling && (
                      <Badge variant="outline" className="text-xs font-normal">
                        {scheduledDate} at {scheduledTime}
                      </Badge>
                    )}
                  </div>
                  
                  {enableScheduling && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700">
                      <div className="space-y-2">
                        <Label 
                          htmlFor="date" 
                          className="text-sm font-medium flex items-center gap-2"
                        >
                          <Calendar className="h-4 w-4 text-blue-500" />
                          <span>Date</span>
                        </Label>
                        <Input
                          id="date"
                          type="date"
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          disabled={tokenExpired}
                          className="border shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label 
                          htmlFor="time" 
                          className="text-sm font-medium flex items-center gap-2"
                        >
                          <Clock className="h-4 w-4 text-blue-500" />
                          <span>Time</span>
                        </Label>
                        <Input
                          id="time"
                          type="time"
                          value={scheduledTime}
                          onChange={(e) => setScheduledTime(e.target.value)}
                          disabled={tokenExpired}
                          className="border shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={saveAsDraft}
                    disabled={loading || tokenExpired}
                    className="w-full sm:w-auto border-gray-200 hover:bg-gray-50 hover:text-gray-900 dark:border-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-50 transition-all"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Draft
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !message.trim() || !selectedPage || tokenExpired}
                    className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 text-white transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>{enableScheduling ? 'Schedule Post' : 'Post Now'}</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 lg:col-span-4 order-2">
          {/* Connected Pages */}
          <Card className="border-blue-100 dark:border-blue-900/30 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Facebook className="h-5 w-5 text-blue-600" />
                  <span>Your Pages</span>
                </CardTitle>
                {tokenExpired && (
                  <Badge variant="destructive" className="w-fit">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Session Expired
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Select a page to post content</p>
            </CardHeader>
            <CardContent>
              {pages.length > 0 ? (
                <div className="space-y-2">
                  {pages.map((page) => (
                    <div 
                      key={page.id} 
                      className={`flex items-center justify-between p-3 rounded-lg ${selectedPage === page.id ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700'} border hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer ${tokenExpired ? 'opacity-50 pointer-events-none' : ''}`}
                      onClick={() => setSelectedPage(page.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                          <Users className="h-4 w-4 dark:text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{page.name}</p>
                          {page.category && (
                            <p className="text-xs text-muted-foreground">{page.category}</p>
                          )}
                        </div>
                      </div>
                      {selectedPage === page.id && (
                        <Check className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 px-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                        <RefreshCw className="h-5 w-5 animate-spin" />
                      </div>
                      <span className="text-sm font-medium mt-2">Loading pages...</span>
                      <p className="text-xs text-muted-foreground">Please wait while we fetch your Facebook pages</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <span className="text-sm font-medium mt-2">No pages found</span>
                      <p className="text-xs text-muted-foreground">Make sure you have admin access to Facebook pages</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Token Status Card */}
          {fbAccessToken && (
            <Card className={`border ${tokenExpired ? 'border-red-100 dark:border-red-900/30' : 'border-green-100 dark:border-green-900/30'} shadow-sm`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Shield className={`h-5 w-5 ${tokenExpired ? 'text-red-500' : 'text-green-500'}`} />
                  <span>Connection Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className={`flex items-center gap-3 p-3 rounded-lg ${tokenExpired ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30' : 'bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30'} border`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tokenExpired ? 'bg-red-100 dark:bg-red-900/20 text-red-600' : 'bg-green-100 dark:bg-green-900/20 text-green-600'}`}>
                      {tokenExpired ? (
                        <AlertTriangle className="h-4 w-4" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {tokenExpired ? 'Session Expired' : 'Connected to Facebook'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {tokenExpired 
                          ? 'Your session has expired. Please refresh or reconnect.' 
                          : 'Your account is successfully connected and ready to post.'}
                      </p>
                    </div>
                  </div>
                  
                  {tokenExpired && (
                    <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700">
                      <p className="text-xs text-muted-foreground">
                        Your Facebook session has expired. Refresh your tokens or reconnect your account to continue posting.
                      </p>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={refreshTokens}
                          disabled={refreshingTokens}
                          className="flex-1 border-gray-200 hover:bg-gray-50 hover:text-gray-900 dark:border-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-50 transition-all"
                        >
                          <RefreshCw className={`h-3 w-3 mr-1 ${refreshingTokens ? 'animate-spin' : ''}`} />
                          Refresh
                        </Button>
                        <Link href="/settings" className="flex-1">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="w-full border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-all"
                          >
                            <Link2 className="h-3 w-3 mr-1" />
                            Reconnect
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Post Tips */}
          
          <PostTips/>
        </div>
      </div>
    </div>
  );
}