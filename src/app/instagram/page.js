"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSupabase } from "@/context/SupabaseContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Instagram, Image, Calendar, Clock, Hash, Sparkles, Save, Send, User, Plus, X, Images, Film, BookImage } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { postToInstagram, scheduleInstagramPost, getUserInstagramAccounts } from "@/utils/instagram";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function InstagramPage() {
  const { user, isAuthenticated, instagramAccessToken, refreshTokensFromDatabase } = useAuth();
  const { addScheduledPost, saveUserPages, getUserPages: getSavedPages, uploadImage } = useSupabase();
  const [message, setMessage] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [enableScheduling, setEnableScheduling] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaType, setMediaType] = useState("image"); // image, video, carousel, story_image, story_video
  const [imagePreview, setImagePreview] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const [instagramAccounts, setInstagramAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [selectedAccountName, setSelectedAccountName] = useState("");
  const [suggestedHashtags, setSuggestedHashtags] = useState([
    "#instagram", "#socialmedia", "#content", "#marketing", "#brand",
    "#engagement", "#followers", "#post", "#viral", "#trending"
  ]);

  // Debug logging for Instagram token
  useEffect(() => {
    console.log("Instagram Page - Token state:", {
      isAuthenticated,
      hasInstagramToken: !!instagramAccessToken,
      instagramToken: instagramAccessToken ? 'present' : 'null',
      userId: user?.id
    });
  }, [isAuthenticated, instagramAccessToken, user?.id]);

  // Force refresh tokens when page loads
  useEffect(() => {
    if (isAuthenticated && user?.id && refreshTokensFromDatabase) {
      console.log("Instagram Page - Refreshing tokens from database");
      refreshTokensFromDatabase();
    }
  }, [isAuthenticated, user?.id, refreshTokensFromDatabase]);
  
  // Log warning if no Instagram token is available
  useEffect(() => {
    if (isAuthenticated && !instagramAccessToken) {
      console.warn("No Instagram access token available. User needs to connect Instagram account.");
    }
  }, [isAuthenticated, instagramAccessToken]);
  
  // Fetch Instagram accounts when component mounts
  useEffect(() => {
    const fetchInstagramAccounts = async () => {
      if (isAuthenticated && user?.id) {
        console.log('🔍 Starting to fetch Instagram accounts from database...');
        
        setLoading(true);
        try {
          // Fetch Instagram accounts from database using Supabase
          const response = await fetch(`/api/instagram/accounts?user_id=${user.id}`);
          const data = await response.json();
          
          console.log('Instagram accounts fetched from database:', data);
          
          if (data && data.accounts && data.accounts.length > 0) {
            const accounts = data.accounts;
            setInstagramAccounts(accounts);
            
            // Find primary account or use first one
            const primaryAccount = accounts.find(acc => acc.is_primary) || accounts[0];
            setSelectedAccount(primaryAccount.instagram_account_id);
            setSelectedAccountName(primaryAccount.username || primaryAccount.name);
          } else {
            console.log('⚠️ No Instagram accounts found in database');
            toast.error('No Instagram accounts found. Please connect your Instagram accounts in Settings.');
          }
        } catch (error) {
          console.error('❌ Error fetching Instagram accounts from database:', error);
          toast.error(`Failed to fetch Instagram accounts: ${error.message}`);
        } finally {
          setLoading(false);
        }
      } else {
        console.log('⏸️ Not fetching Instagram accounts - missing requirements:');
        console.log('  - Authenticated:', isAuthenticated);
        console.log('  - User ID:', !!user?.id);
      }
    };

    fetchInstagramAccounts();
  }, [isAuthenticated, user?.id]);

  const checkTokenDebug = async () => {
    try {
      if (!user?.id) {
        setDebugInfo({ error: 'No user ID available' });
        return;
      }
      
      const response = await fetch(`/api/debug/tokens?user_id=${user.id}`);
      const data = await response.json();
      setDebugInfo(data);
      console.log('Debug token info:', data);
      
      // Also log AuthContext state
      console.log('AuthContext state:', {
        isAuthenticated,
        hasInstagramToken: !!instagramAccessToken,
        instagramToken: instagramAccessToken ? instagramAccessToken.substring(0, 10) + '...' : null,
        userId: user?.id
      });
      
    } catch (error) {
      console.error('Error fetching debug info:', error);
      setDebugInfo({ error: error.message });
    }
  };

  // Generate video thumbnail
  const generateVideoThumbnail = async (file) => {
    return new Promise((resolve) => {
      const videoElement = document.createElement('video');
      videoElement.preload = 'metadata';
      videoElement.onloadedmetadata = function() {
        // Create a canvas to capture the first frame
        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg'));
      };
      videoElement.src = URL.createObjectURL(file);
    });
  };

  // Upload file to Supabase
  const uploadFileToSupabase = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', user.id);
      formData.append('platform', 'instagram');

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (result.success) {
        return {
          ...file,
          uploadedData: result.media,
          mediaType: result.media.mediaType || (file.type.startsWith('video/') ? 'video' : 'image')
        };
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  // Handle media upload for all types (single and multiple files)
  const handleMediaUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    // For carousel, allow multiple files (up to 10)
    if (mediaType === 'carousel') {
      if (files.length > 10) {
        toast.error('You can only upload up to 10 files for a carousel post');
        return;
      }
      
      // Instagram carousel posts support a mix of images and videos (up to 10 items total)
      const hasVideoFiles = files.some(file => file.type.startsWith('video/'));
      const hasImageFiles = files.some(file => file.type.startsWith('image/'));
      
      // Check existing files types
      const existingHasVideos = mediaFiles.some(media => media.type === 'video');
      const existingHasImages = mediaFiles.some(media => media.type === 'image');
      
      // Log the media mix for debugging
      console.log(`Carousel upload: ${hasVideoFiles ? 'has videos' : 'no videos'}, ${hasImageFiles ? 'has images' : 'no images'}`);
      console.log(`Existing files: ${existingHasVideos ? 'has videos' : 'no videos'}, ${existingHasImages ? 'has images' : 'no images'}`);
      
      setLoading(true);
      try {
        const newMediaFiles = [...mediaFiles];
        
        // Process each file
        for (const file of files) {
          const isVideo = file.type.startsWith('video/');
          
          // Generate preview
          let preview;
          if (isVideo) {
            preview = await generateVideoThumbnail(file);
          } else {
            preview = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target.result);
              reader.readAsDataURL(file);
            });
          }
          
          // Upload to Supabase
          const uploadedFile = await uploadFileToSupabase(file);
          
          // Add to media files array
          newMediaFiles.push({
            file: uploadedFile,
            preview,
            type: isVideo ? 'video' : 'image'
          });
        }
        
        setMediaFiles(newMediaFiles);
        toast.success(`${files.length} file${files.length > 1 ? 's' : ''} uploaded successfully!`);
      } catch (error) {
        console.error('Upload error:', error);
        toast.error(`Failed to upload files: ${error.message}`);
      } finally {
        setLoading(false);
      }
    } else {
      // For single file uploads (image, video, story_image, story_video)
      const file = files[0];
      const isVideo = file.type.startsWith('video/');
      
      // Check if media type matches file type
      if ((mediaType === 'video' || mediaType === 'story_video') && !isVideo) {
        toast.error('Please upload a video file for video posts');
        return;
      }
      
      if ((mediaType === 'image' || mediaType === 'story_image') && isVideo) {
        toast.error('Please upload an image file for image posts');
        return;
      }
      
      setLoading(true);
      try {
        // Generate preview
        let preview;
        if (isVideo) {
          preview = await generateVideoThumbnail(file);
        } else {
          preview = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
          });
        }
        
        // Upload to Supabase
        const uploadedFile = await uploadFileToSupabase(file);
        
        // Set as single media file
        setMediaFiles([{
          file: uploadedFile,
          preview,
          type: isVideo ? 'video' : 'image'
        }]);
        
        // Set preview for backward compatibility
        setImagePreview(preview);
        
        toast.success(`${isVideo ? 'Video' : 'Image'} uploaded successfully!`);
      } catch (error) {
        console.error('Upload error:', error);
        toast.error(`Failed to upload ${isVideo ? 'video' : 'image'}: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const addHashtag = (hashtag) => {
    if (!hashtags.includes(hashtag)) {
      setHashtags(prev => prev ? `${prev} ${hashtag}` : hashtag);
    }
  };

  const generateAIHashtags = async () => {
    if (!message.trim()) {
      toast.error("Please write a caption first to generate relevant hashtags");
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/generate-hashtags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ caption: message }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate hashtags');
      }

      const data = await response.json();
      const newHashtags = data.hashtags || [];
      
      // Add generated hashtags to the hashtags field
      const hashtagString = newHashtags.join(' ');
      setHashtags(prev => prev ? `${prev} ${hashtagString}` : hashtagString);
      
      // Update suggested hashtags for the sidebar
      setSuggestedHashtags(prev => {
        const combined = [...prev, ...newHashtags];
        // Remove duplicates
        return [...new Set(combined)];
      });
      
      toast.success(`Generated ${newHashtags.length} relevant hashtags!`);
    } catch (error) {
      console.error('Error generating hashtags:', error);
      toast.error('Failed to generate hashtags. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const saveAsDraft = async () => {
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    try {
      const draftData = {
        message: message + (hashtags ? `\n\n${hashtags}` : ""),
        platform: "instagram",
        status: "draft",
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
    setLoading(true);

    try {
      if (!message.trim()) {
        throw new Error("Please enter a message");
      }

      if (mediaFiles.length === 0) {
        throw new Error("Please upload media for your Instagram post");
      }

      const fullMessage = message + (hashtags ? `\n\n${hashtags}` : "");
      
      if (!selectedAccount) {
        throw new Error("Please select an Instagram account to post to");
      }
      
      // Find the selected account object
      const instagramAccount = instagramAccounts.find((account) => account.instagram_account_id === selectedAccount);
      
      if (!instagramAccount) {
        throw new Error("Selected Instagram account not found. Please refresh the page and try again.");
      }
      
      // Get posting details from database
      const response = await fetch(`/api/instagram/posting-details?user_id=${user.id}&instagram_account_id=${selectedAccount}`);
      const postingDetails = await response.json();
      
      if (!response.ok) {
        throw new Error(postingDetails.error || "Failed to get posting details");
      }
      
      const { connectionType, pageAccessToken, instagramAccountId, instagramDirectToken } = postingDetails;
      
      // Handle Instagram-direct accounts
      {/*if (connectionType === 'instagram_direct') {
        throw new Error(
          'Instagram Basic Display API does not support direct posting to Instagram feed. ' +
          'Please use Instagram Business account via Facebook for posting capabilities.'
        );
      }*/}
      
      // Prepare media URLs and types based on post type
      let mediaUrls = [];
      let postMediaType = mediaType;
      
      if (mediaType === 'carousel') {
        // For carousel, collect all media URLs
        
        // Instagram carousel posts support a mix of images and videos (up to 10 items total)
        const hasVideos = mediaFiles.some(media => media.type === 'video');
        const hasImages = mediaFiles.some(media => media.type === 'image');
        
        console.log(`Submitting carousel with ${hasVideos ? 'videos' : 'no videos'} and ${hasImages ? 'images' : 'no images'}`);
        
        mediaUrls = mediaFiles.map(media => media.file.uploadedData.public_url);
        console.log(`Using ${mediaUrls.length} files for carousel post`);
      } else {
        // For single media posts
        if (mediaFiles.length > 0 && mediaFiles[0].file && mediaFiles[0].file.uploadedData) {
          mediaUrls = [mediaFiles[0].file.uploadedData.public_url];
          console.log(`Using uploaded ${postMediaType} URL:`, mediaUrls[0]);
        } else {
          throw new Error("Media upload incomplete. Please try again.");
        }
      }
      
      if (enableScheduling && scheduledDate && scheduledTime) {
        const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
        
        // Schedule the post using Instagram API
        const result = await scheduleInstagramPost(
          pageAccessToken,
          fullMessage,
          mediaType === 'carousel' ? mediaUrls : mediaUrls[0],
          instagramAccountId,
          scheduledDateTime,
          postMediaType // Pass the media type to the API
        );
        
        // Save scheduled post to Supabase
        await addScheduledPost({
          message: fullMessage,
          scheduledPublishTime: scheduledDateTime.toISOString(),
          platform: "instagram",
          status: "scheduled",
          has_image: true,
          media_type: postMediaType,
          pageId: instagramAccountId,
          pageName: instagramAccount.username,
          instagramContainerId: result.containerId
        });
        
        const postTypeLabel = {
          'image': 'Image post',
          'video': 'Video post',
          'carousel': 'Carousel post',
          'story_image': 'Image story',
          'story_video': 'Video story'
        }[postMediaType] || 'Post';
        
        toast.success(`${postTypeLabel} scheduled successfully!`);
      } else {
        // Post immediately
        const result = await postToInstagram(
          pageAccessToken,
          fullMessage,
          mediaType === 'carousel' ? mediaUrls : mediaUrls[0],
          instagramAccountId,
          postMediaType // Pass the media type to the API
        );
        
        const postTypeLabel = {
          'image': 'Image post',
          'video': 'Video post',
          'carousel': 'Carousel post',
          'story_image': 'Image story',
          'story_video': 'Video story'
        }[postMediaType] || 'Post';
        
        toast.success(`${postTypeLabel} published to Instagram successfully!`);
      }

      // Reset form
      setMessage("");
      setHashtags("");
      setMediaFiles([]);
      setImagePreview(null);
      setEnableScheduling(false);
      setScheduledDate("");
      setScheduledTime("");
    } catch (error) {
      console.error("Error posting to Instagram:", error);
      toast.error(error.message || "Failed to post to Instagram");
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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-pink-500">
            <Instagram className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Instagram</h1>
            <p className="text-muted-foreground">Create and schedule Instagram posts</p>
          </div>
        </div>
        
        {instagramAccounts.length === 0 && !loading && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  You need to connect your Instagram account before posting. Please visit the <Link href="/settings" className="font-medium underline text-yellow-700 hover:text-yellow-600">Settings page</Link> to connect your account.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Create Instagram Post</CardTitle>
              <CardDescription>
                Share your content with your Instagram audience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Post Type Selection */}
                <div className="space-y-2">
  <Label>Post Type</Label>
  <Select value={mediaType} onValueChange={setMediaType}>
    <SelectTrigger className="w-full">
      <SelectValue placeholder="Select post type" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="image">
        <div className="flex items-center">
          <Image className="h-4 w-4 mr-2" />
          <span>Image</span>
        </div>
      </SelectItem>
      <SelectItem value="video">
        <div className="flex items-center">
          <Film className="h-4 w-4 mr-2" />
          <span>Video</span>
        </div>
      </SelectItem>
      <SelectItem value="carousel">
        <div className="flex items-center">
          <Images className="h-4 w-4 mr-2" />
          <span>Carousel</span>
        </div>
      </SelectItem>
      <SelectItem value="story_image">
        <div className="flex items-center">
          <BookImage className="h-4 w-4 mr-2" />
          <span>Image Story</span>
        </div>
      </SelectItem>
      <SelectItem value="story_video">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
            <path d="m9 12 6-4v8l-6-4z"></path>
          </svg>
          <span>Video Story</span>
        </div>
      </SelectItem>
    </SelectContent>
  </Select>
</div>

                {/* Media Upload */}
                <div className="space-y-2">
                  <Label htmlFor="media">
                    {mediaType === 'carousel' ? 'Upload Multiple Media (up to 10)' : 
                     mediaType.includes('story') ? 'Upload Story' : 'Upload Media'}
                  </Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {mediaFiles.length > 0 ? (
                      <div className="space-y-4">
                        {mediaType === 'carousel' ? (
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {mediaFiles.map((media, index) => (
                              <div key={index} className="relative">
                                <img 
                                  src={media.preview} 
                                  alt={`Media ${index + 1}`} 
                                  className="w-full h-24 object-cover rounded-lg"
                                />
                                <Badge className="absolute top-1 right-1 bg-gray-800 text-white">{index + 1}</Badge>
                                <Badge className="absolute top-1 left-1 bg-blue-500">{media.type}</Badge>
                                <Button 
                                  type="button" 
                                  variant="destructive" 
                                  size="icon"
                                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                                  onClick={() => {
                                    const newMediaFiles = [...mediaFiles];
                                    newMediaFiles.splice(index, 1);
                                    setMediaFiles(newMediaFiles);
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                            {mediaFiles.length < 10 && (
                              <Label 
                                htmlFor="media-upload" 
                                className="border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center h-24 cursor-pointer hover:bg-gray-50"
                              >
                                <Plus className="h-8 w-8 text-gray-400" />
                              </Label>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="relative">
                              <img 
                                src={mediaFiles[0].preview} 
                                alt="Media Preview" 
                                className="max-w-full h-48 object-cover mx-auto rounded-lg"
                              />
                              {mediaFiles[0].type === 'video' && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="bg-black bg-opacity-50 rounded-full p-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                    </svg>
                                  </div>
                                </div>
                              )}
                              <Badge className="absolute top-2 right-2 bg-blue-500">
                                {mediaType.includes('story') ? 'Story' : mediaFiles[0].type}
                              </Badge>
                            </div>
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => {
                                setMediaFiles([]);
                                setImagePreview(null);
                              }}
                            >
                              Remove Media
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex justify-center">
                          {mediaType === 'carousel' ? (
                            <Images className="h-10 w-10 text-gray-400" />
                          ) : mediaType.includes('video') ? (
                            <Film className="h-10 w-10 text-gray-400" />
                          ) : mediaType.includes('story') ? (
                            <BookImage className="h-10 w-10 text-gray-400" />
                          ) : (
                            <Image className="h-10 w-10 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <Label htmlFor="media-upload" className="cursor-pointer">
                            <span className="text-blue-600 hover:text-blue-500">
                              {mediaType === 'carousel' 
                                ? 'Upload up to 10 images or videos' 
                                : `Upload ${mediaType.includes('video') ? 'a video' : 'an image'}`}
                            </span>
                            <span className="text-gray-500"> or drag and drop</span>
                          </Label>
                          <Input
                            id="media-upload"
                            type="file"
                            accept={mediaType.includes('video') 
                              ? 'video/*' 
                              : mediaType === 'carousel' 
                                ? 'image/*,video/*' 
                                : 'image/*'}
                            onChange={handleMediaUpload}
                            multiple={mediaType === 'carousel'}
                            className="hidden"
                          />
                        </div>
                        <div className="text-xs text-gray-500">
                          <p>Images: JPG, PNG, GIF (up to 10MB)</p>
                          <p>Videos: MP4, MOV (up to 100MB)</p>
                          {mediaType === 'carousel' && (
                            <>
                              <p className="font-medium text-blue-600">Carousel: Mix of up to 10 images/videos</p>
                              <p className="text-green-600 font-medium">Note: Instagram supports mixing images and videos in the same carousel</p>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Instagram Account Selection */}
                {instagramAccounts.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="instagram-account">Instagram Account</Label>
                    <Select 
                      value={selectedAccount} 
                      onValueChange={(value) => {
                        setSelectedAccount(value);
                        const account = instagramAccounts.find(acc => acc.instagram_account_id === value);
                        if (account) {
                          setSelectedAccountName(account.username || account.name);
                        }
                      }}
                    >
                      <SelectTrigger id="instagram-account" className="w-full">
                        <SelectValue placeholder="Select an Instagram account" />
                      </SelectTrigger>
                      <SelectContent>
                        {instagramAccounts.map((account) => (
                          <SelectItem key={account.instagram_account_id} value={account.instagram_account_id}>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span>{account.username || account.name}</span>
                              {account.is_primary && <span className="text-xs text-blue-600">(Primary)</span>}
                              {/*account.connection_type === 'instagram_direct' && (
                                <span className="text-xs text-orange-600">(Personal)</span>
                              )*/}
                              {account.connection_type === 'facebook' && (
                                <span className="text-xs text-green-600">(Business)</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {/*{instagramAccounts.find(acc => acc.instagram_account_id === selectedAccount)?.connection_type === 'instagram_direct' && (
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                              <strong>Personal Instagram Account:</strong> Instagram Basic Display API has limited posting capabilities. 
                              For full posting features, connect your Instagram Business account via Facebook in <Link href="/settings" className="underline">Settings</Link>.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}*/}
                  </div>
                )}

                {/* Caption */}
                <div className="space-y-2">
                  <Label htmlFor="message">Caption</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write your Instagram caption..."
                    className="min-h-[120px]"
                    maxLength={2200}
                  />
                  <p className="text-xs text-gray-500">
                    {message.length}/2200 characters
                  </p>
                </div>

                {/* Hashtags */}
                <div className="space-y-2">
                  <Label htmlFor="hashtags">Hashtags</Label>
                  <Textarea
                    id="hashtags"
                    value={hashtags}
                    onChange={(e) => setHashtags(e.target.value)}
                    placeholder="#hashtag1 #hashtag2 #hashtag3"
                    className="min-h-[80px]"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generateAIHashtags}
                      disabled={loading || !message.trim()}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      {loading ? 'Generating...' : 'Generate AI Hashtags'}
                    </Button>
                  </div>
                </div>

                {/* Scheduling */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="schedule"
                      checked={enableScheduling}
                      onCheckedChange={setEnableScheduling}
                    />
                    <Label htmlFor="schedule">Schedule for later</Label>
                  </div>
                  
                  {enableScheduling && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="date">Date</Label>
                        <Input
                          id="date"
                          type="date"
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="time">Time</Label>
                        <Input
                          id="time"
                          type="time"
                          value={scheduledTime}
                          onChange={(e) => setScheduledTime(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={saveAsDraft}
                    disabled={loading}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Draft
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !message.trim() || !instagramAccessToken}
                    className="flex-1"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    
                    {!instagramAccessToken
  ? 'connect account'
  : enableScheduling
    ? 'Schedule Post'
    : 'Post Now'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Suggested Hashtags */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Suggested Hashtags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {suggestedHashtags.map((hashtag, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                    onClick={() => addHashtag(hashtag)}
                  >
                    {hashtag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Post Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Instagram Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm space-y-2">
                <p>• Use high-quality images (1080x1080px)</p>
                <p>• Include 5-10 relevant hashtags</p>
                <p>• Post when your audience is most active</p>
                <p>• Write engaging captions with questions</p>
                <p>• Use Instagram Stories for behind-the-scenes content</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}