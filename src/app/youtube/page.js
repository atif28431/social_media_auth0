'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getUserYoutubeChannels } from '@/utils/youtube';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Youtube, AlertCircle, CheckCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import YoutubePostForm from '@/components/YoutubePostForm';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function YoutubePage() {
  const { youtubeAccessToken, refreshYoutubeToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [channels, setChannels] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for error or success messages from URL parameters
  useEffect(() => {
    const errorMsg = searchParams.get('error');
    const successMsg = searchParams.get('success');

    if (errorMsg) {
      setError(decodeURIComponent(errorMsg));
      toast.error(decodeURIComponent(errorMsg));
    }

    if (successMsg === 'true') {
      setSuccess(true);
      toast.success('YouTube account connected successfully!');
    }
  }, [searchParams]);

  // Fetch YouTube channels when the component mounts or when the token changes
  useEffect(() => {
    async function fetchChannels() {
      try {
        setLoading(true);
        setError(null);

        if (!youtubeAccessToken) {
          setLoading(false);
          return;
        }

        const channelsData = await getUserYoutubeChannels(youtubeAccessToken);
        setChannels(channelsData);
      } catch (error) {
        console.error('Error fetching YouTube channels:', error);
        setError(error.message || 'Failed to fetch YouTube channels');
        toast.error(error.message || 'Failed to fetch YouTube channels');

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

  // Handle connect YouTube account button click
  const handleConnectYoutube = async () => {
    try {
      window.location.href = '/api/auth/youtube-auth';
    } catch (error) {
      console.error('Error connecting YouTube account:', error);
      setError(error.message || 'Failed to connect YouTube account');
      toast.error(error.message || 'Failed to connect YouTube account');
    }
  };

  // No longer needed as we're using the integrated form
  // const handleCreatePost = () => {
  //   router.push('/create-post?platform=youtube');
  // };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">YouTube</h1>

      {/* Success Alert */}
      {success && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <AlertTitle className="text-green-800">Success!</AlertTitle>
          <AlertDescription className="text-green-700">
            Your YouTube account has been connected successfully.
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert className="mb-6 bg-red-50 border-red-200">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <AlertTitle className="text-red-800">Error</AlertTitle>
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading YouTube channels...</span>
        </div>
      )}

      {/* Not Connected State */}
      {!loading && !youtubeAccessToken && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Youtube className="h-6 w-6 mr-2 text-red-600" />
              Connect YouTube Account
            </CardTitle>
            <CardDescription>
              Connect your YouTube account to post videos directly from this platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              By connecting your YouTube account, you'll be able to:
            </p>
            <ul className="list-disc pl-5 mb-4 space-y-1">
              <li>Upload videos directly to your YouTube channel</li>
              <li>Schedule video posts for future publishing</li>
              <li>Manage your YouTube content alongside other social platforms</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button onClick={handleConnectYoutube} className="bg-red-600 hover:bg-red-700 dark:text-white">
              <Youtube className="h-5 w-5 mr-2" />
              Connect YouTube Account
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Connected State with Channels */}
      {!loading && youtubeAccessToken && channels.length > 0 && (
        <div>
          <Tabs defaultValue="post" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="post">Create Post</TabsTrigger>
              <TabsTrigger value="channels">Your Channels</TabsTrigger>
            </TabsList>
            <TabsContent value="post" className="mt-6">
              <YoutubePostForm />
            </TabsContent>
            <TabsContent value="channels" className="mt-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Your YouTube Channels</h2>
              </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {channels.map((channel) => (
              <Card key={channel.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage 
                        src={channel.snippet.thumbnails?.default?.url} 
                        alt={channel.snippet.title} 
                      />
                      <AvatarFallback>{channel.snippet.title.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{channel.snippet.title}</CardTitle>
                      {channel.snippet.customUrl && (
                        <CardDescription>{channel.snippet.customUrl}</CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {channel.statistics && (
                    <div className="grid grid-cols-3 gap-2 text-center py-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Subscribers</p>
                        <p className="font-medium">
                          {parseInt(channel.statistics.subscriberCount).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Videos</p>
                        <p className="font-medium">
                          {parseInt(channel.statistics.videoCount).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Shorts</p>
                        <p className="font-medium">
                          {parseInt(channel.statistics.shortsCount).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Views</p>
                        <p className="font-medium">
                          {parseInt(channel.statistics.viewCount).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                  {channel.snippet.description && (
                    <p className="text-sm mt-4 line-clamp-3">{channel.snippet.description}</p>
                  )}
                </CardContent>
                <CardFooter className="bg-muted/50 border-t">
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => window.open(`https://youtube.com/channel/${channel.id}`, '_blank')}
                  >
                    View Channel
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Connected but No Channels */}
      {!loading && youtubeAccessToken && channels.length === 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Youtube className="h-6 w-6 mr-2 text-red-600" />
              No YouTube Channels Found
            </CardTitle>
            <CardDescription>
              Your YouTube account is connected, but we couldn't find any channels.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              Make sure you have at least one YouTube channel associated with your Google account.
              If you believe this is an error, try reconnecting your account.
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={handleConnectYoutube} className="bg-red-600 hover:bg-red-700">
              <Youtube className="h-5 w-5 mr-2" />
              Reconnect YouTube Account
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}