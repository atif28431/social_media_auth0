'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSupabase } from '@/context/SupabaseContext';
import { getUserYoutubeChannels, uploadVideoToYoutube, scheduleVideoForYoutube, getYoutubeCategories } from '@/utils/youtube';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock, Upload, Youtube, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';

function YoutubePostForm() {
  const { youtubeAccessToken, isAuthenticated, refreshYoutubeToken, user } = useAuth();
  const { addScheduledPost } = useSupabase();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState('');
  const [selectedChannelTitle, setSelectedChannelTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [enableScheduling, setEnableScheduling] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [scheduledDateTime, setScheduledDateTime] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('22'); // Default to 'People & Blogs'
  const [tags, setTags] = useState('');
  const [privacyStatus, setPrivacyStatus] = useState('public');
  const [error, setError] = useState('');

  // Fetch user's YouTube channels when component mounts
  useEffect(() => {
    async function fetchChannels() {
      if (!youtubeAccessToken) return;

      try {
        setLoading(true);
        setError('');
        const channelsData = await getUserYoutubeChannels(youtubeAccessToken);
        setChannels(channelsData);

        // Also fetch video categories
        const categoriesData = await getYoutubeCategories(youtubeAccessToken);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching YouTube data:', error);
        setError(error.message || 'Failed to fetch YouTube data');
        toast.error(error.message || 'Failed to fetch YouTube data');

        // If the error is due to an expired token, try to refresh it
        if (error.message?.includes('401') || error.message?.includes('invalid_token')) {
          try {
            await refreshYoutubeToken();
            // The token has been refreshed, we'll try again on the next render
          } catch (refreshError) {
            console.error('Error refreshing YouTube token:', refreshError);
          }
        }
      } finally {
        setLoading(false);
      }
    }

    fetchChannels();
  }, [youtubeAccessToken, refreshYoutubeToken]);

  // Handle video file selection
  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check if the file is a video
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a valid video file');
      return;
    }

    setVideoFile(file);

    // Create a preview URL for the video
    const previewUrl = URL.createObjectURL(file);
    setVideoPreview(previewUrl);
  };

  // Handle channel selection
  const handleChannelChange = (value) => {
    setSelectedChannel(value);
    const channel = channels.find((ch) => ch.id === value);
    if (channel) {
      setSelectedChannelTitle(channel.snippet.title);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!youtubeAccessToken) {
      toast.error('Please connect your YouTube account');
      return;
    }

    if (!user?.id) {
      toast.error('User session not found. Please log in again.');
      return;
    }

    if (!selectedChannel) {
      toast.error('Please select a YouTube channel');
      return;
    }

    if (!title) {
      toast.error('Please enter a title for your video');
      return;
    }

    if (!videoFile && !uploadedVideoUrl) {
      toast.error('Please upload a video');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // First, upload the video file to get a URL
      let videoUrl = uploadedVideoUrl;
      if (videoFile && !videoUrl) {
        console.log('📤 Uploading video file...');
        console.log('📋 User ID:', user.id);
        
        const formData = new FormData();
        formData.append('file', videoFile);
        formData.append('userId', user.id); // Make sure to pass the user ID
        formData.append('platform', 'youtube');
        formData.append('mediaType', 'video');

        const response = await fetch('/api/upload/media', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('❌ Upload error:', errorData);
          throw new Error(errorData.error || 'Failed to upload video');
        }

        const data = await response.json();
        console.log('✅ Upload successful:', data);
        videoUrl = data.media.publicUrl || data.media.public_url;
        setUploadedVideoUrl(videoUrl);
      }

      // Parse tags from comma-separated string
      const tagsList = tags.split(',').map(tag => tag.trim()).filter(tag => tag);

      if (enableScheduling && scheduledDateTime) {
        // Schedule the video for later
        const scheduledResult = await scheduleVideoForYoutube(
          youtubeAccessToken,
          title,
          description,
          videoUrl,
          scheduledDateTime,
          tagsList,
          selectedCategory,
          user.id
        );

        // Save the scheduled post to the database
        await addScheduledPost({
          message: title,
          scheduledPublishTime: scheduledDateTime.toISOString(),
          pageId: selectedChannel,
          pageName: selectedChannelTitle,
          platform: 'youtube',
          mediaUrl: videoUrl,
          youtubeVideoId: scheduledResult.id,
          youtubeTitle: title,
          youtubeDescription: description,
          youtubeTags: tagsList.join(','),
          youtubeCategoryId: selectedCategory,
          youtubePrivacyStatus: 'private', // Initially private, will be public at scheduled time
        });

        toast.success('Video scheduled successfully!');
      } else {
        // Upload the video immediately
        const uploadResult = await uploadVideoToYoutube(
          youtubeAccessToken,
          title,
          description,
          videoUrl,
          tagsList,
          selectedCategory,
          privacyStatus,
          user.id
        );

        toast.success('Video uploaded successfully!');
      }

      // Reset form
      setTitle('');
      setDescription('');
      setVideoFile(null);
      setVideoPreview(null);
      setUploadedVideoUrl('');
      setTags('');
      setEnableScheduling(false);
      setScheduledDate('');
      setScheduledTime('');
      setScheduledDateTime(null);
    } catch (error) {
      console.error('Error posting to YouTube:', error);
      setError(error.message || 'Failed to post to YouTube');
      toast.error(error.message || 'Failed to post to YouTube');

      // If the error is due to an expired token, try to refresh it
      if (error.message?.includes('401') || error.message?.includes('invalid_token')) {
        try {
          await refreshYoutubeToken();
          toast.info('Token refreshed. Please try again.');
        } catch (refreshError) {
          console.error('Error refreshing YouTube token:', refreshError);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Update scheduledDateTime when date or time changes
  useEffect(() => {
    if (scheduledDate && scheduledTime) {
      const [hours, minutes] = scheduledTime.split(':');
      const date = new Date(scheduledDate);
      date.setHours(parseInt(hours, 10));
      date.setMinutes(parseInt(minutes, 10));
      setScheduledDateTime(date);
    } else {
      setScheduledDateTime(null);
    }
  }, [scheduledDate, scheduledTime]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Youtube className="h-5 w-5 text-red-600" />
          Post to YouTube
        </CardTitle>
        <CardDescription>
          Upload or schedule videos to your YouTube channel
        </CardDescription>
      </CardHeader>

      {error && (
        <CardContent className="pt-0 pb-3">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      )}

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          

          {/* Channel Selection */}
          <div className="space-y-2">
            <Label htmlFor="channel">YouTube Channel</Label>
            <Select
              value={selectedChannel}
              onValueChange={handleChannelChange}
              disabled={loading || !youtubeAccessToken || channels.length === 0}
            >
              <SelectTrigger id="channel">
                <SelectValue placeholder="Select a channel" />
              </SelectTrigger>
              <SelectContent>
                {channels.map((channel) => (
                  <SelectItem key={channel.id} value={channel.id}>
                    {channel.snippet.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Video Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Video Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title for your video"
              disabled={loading}
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground text-right">
              {title.length}/100
            </p>
          </div>

          {/* Video Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter a description for your video"
              disabled={loading}
              rows={4}
              maxLength={5000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length}/5000
            </p>
          </div>

          {/* Video Upload */}
          <div className="space-y-2">
            <Label htmlFor="video">Video</Label>
            <div className="flex items-center gap-2">
              <Input
                id="video"
                type="file"
                accept="video/*"
                onChange={handleVideoChange}
                disabled={loading}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('video').click()}
                disabled={loading}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                {videoFile ? 'Change Video' : 'Upload Video'}
              </Button>
            </div>
            {videoFile && (
              <p className="text-sm text-muted-foreground">
                Selected: {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(2)} MB)
              </p>
            )}
            {videoPreview && (
              <div className="mt-2">
                <video
                  src={videoPreview}
                  controls
                  className="w-full max-h-[300px] rounded-md"
                />
              </div>
            )}
          </div>

          {/* Video Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
              disabled={loading || categories.length === 0}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.snippet.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="tag1, tag2, tag3"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Add relevant tags to help viewers find your video
            </p>
          </div>

          {/* Privacy Status */}
          {!enableScheduling && (
            <div className="space-y-2">
              <Label htmlFor="privacy">Privacy Status</Label>
              <Select
                value={privacyStatus}
                onValueChange={setPrivacyStatus}
                disabled={loading}
              >
                <SelectTrigger id="privacy">
                  <SelectValue placeholder="Select privacy status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="unlisted">Unlisted</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Scheduling Options */}
          <div className="flex items-center space-x-2">
            <Switch
              id="scheduling"
              checked={enableScheduling}
              onCheckedChange={setEnableScheduling}
              disabled={loading}
            />
            <Label htmlFor="scheduling">Schedule for later</Label>
          </div>

          {enableScheduling && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      disabled={loading}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {scheduledDate ? format(new Date(scheduledDate), 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={scheduledDate ? new Date(scheduledDate) : undefined}
                      onSelect={(date) => setScheduledDate(date ? date.toISOString() : '')}
                      initialFocus
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="time"
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    disabled={loading}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setTitle('');
              setDescription('');
              setVideoFile(null);
              setVideoPreview(null);
              setUploadedVideoUrl('');
              setTags('');
              setEnableScheduling(false);
              setScheduledDate('');
              setScheduledTime('');
              setScheduledDateTime(null);
              setSelectedCategory('22');
              setPrivacyStatus('public');
            }}
            disabled={loading}
          >
            Reset
          </Button>
          <Button type="submit" disabled={loading || !user?.id}>
            {loading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                {enableScheduling ? 'Scheduling...' : 'Uploading...'}
              </>
            ) : (
              <>{enableScheduling ? 'Schedule Video' : 'Upload Video'}</>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export default YoutubePostForm;