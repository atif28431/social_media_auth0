"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Facebook, Instagram, Twitter, Linkedin, Settings, User, FileText, Plus, Youtube } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user, isAuthenticated, fbAccessToken, instagramAccessToken, youtubeAccessToken, refreshTokensFromDatabase, supabase } = useAuth();
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user && supabase) {
      fetchConnectedAccounts();
    }
  }, [isAuthenticated, user, supabase]);

  // Handle OAuth callbacks for Facebook, Instagram, and YouTube
  useEffect(() => {
    const handleCallbacks = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const facebookToken = urlParams.get('facebook_token');
      const facebookUserId = urlParams.get('facebook_user_id');
      const instagramConnected = urlParams.get('instagram_connected');
      const youtubeConnected = urlParams.get('youtube_connected');
      const youtubeSuccess = urlParams.get('success'); // Handle success from YouTube callback
      const error = urlParams.get('error');

      // Handle Instagram connection success
      if (instagramConnected === 'true') {
        fetchConnectedAccounts();
        // Refresh AuthContext to update Instagram connection status immediately
        if (refreshTokensFromDatabase) {
          await refreshTokensFromDatabase();
        }
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      // Handle YouTube connection success
      if (youtubeConnected === 'true' || youtubeSuccess === 'true') {
        toast.success('YouTube account connected successfully!');
        fetchConnectedAccounts();
        // Refresh AuthContext to update YouTube connection status immediately
        if (refreshTokensFromDatabase) {
          await refreshTokensFromDatabase();
        }
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      if (error) {
        toast.error('Facebook authentication failed. Please try again.');
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      if (facebookToken && user?.id) {
        setLoading(true);
        try {
          const response = await fetch('/api/facebook/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              access_token: facebookToken,
              user_id: user.id,
            }),
          });

          const data = await response.json();

          if (data.success) {
            toast.success('Facebook account connected successfully!');
            fetchConnectedAccounts();
            // Refresh AuthContext to update Facebook connection status immediately
            if (refreshTokensFromDatabase) {
              await refreshTokensFromDatabase();
            }
          } else {
            toast.error(data.error || 'Failed to connect Facebook account');
          }
        } catch (error) {
          console.error('Error processing Facebook token:', error);
          toast.error('Failed to connect Facebook account');
        } finally {
          setLoading(false);
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    };

    handleCallbacks();
  }, [user?.id, refreshTokensFromDatabase]);

  const fetchConnectedAccounts = async () => {
    if (!supabase) {
      console.warn('Supabase not available, skipping fetchConnectedAccounts');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from("user_sessions")
        .select("facebook_access_token, instagram_access_token, youtube_access_token")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching connected accounts:", error);
        return;
      }

      const accounts = [];
      if (data?.facebook_access_token) {
        accounts.push({ platform: 'facebook', name: 'Facebook', icon: Facebook, connected: true, color: 'bg-blue-500' });
      }
      if (data?.instagram_access_token) {
        accounts.push({ platform: 'instagram', name: 'Instagram', icon: Instagram, connected: true, color: 'bg-pink-500' });
      }
      if (data?.twitter_access_token) {
        accounts.push({ platform: 'twitter', name: 'Twitter', icon: Twitter, connected: true, color: 'bg-sky-500' });
      }
      if (data?.linkedin_access_token) {
        accounts.push({ platform: 'linkedin', name: 'LinkedIn', icon: Linkedin, connected: true, color: 'bg-blue-700' });
      }
      // Use AuthContext youtubeAccessToken instead of database query for consistency
      if (youtubeAccessToken) {
        accounts.push({ platform: 'youtube', name: 'YouTube', icon: Youtube, connected: true, color: 'bg-red-500' });
      }


      setConnectedAccounts(accounts);
    } catch (error) {
      console.error("Error fetching connected accounts:", error);
    }
  };

  const connectFacebook = () => {
    const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
    const redirectUri = `${window.location.origin}/api/facebook/token`;
    const scope = "pages_show_list,pages_manage_posts,pages_read_engagement,pages_read_user_content,public_profile,email";
    window.location.href = `https://www.facebook.com/v23.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code&auth_type=rerequest&state=${user.id}`;
  };
  const handleConnectYoutube = async () => {
    try {
      // Add return URL and user ID to redirect back to settings after connecting
      const authUrl = `/api/auth/youtube-auth?return=settings&user_id=${encodeURIComponent(user.id)}`;
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error connecting YouTube account:', error);
      toast.error(error.message || 'Failed to connect YouTube account');
    }
  };

  const connectInstagram = () => {
    const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
    const redirectUri = `${window.location.origin}/instagram-callback`;
    const scope = "instagram_basic,pages_show_list,instagram_manage_comments,instagram_content_publish,instagram_manage_insights";
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Store state in localStorage for verification
    localStorage.setItem('instagram_state', state);
    
    window.location.href = `https://www.facebook.com/v23.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code&auth_type=rerequest&state=${state}`;
  };

  

  const disconnectAccount = async (platform) => {
    if (!supabase) {
      toast.error('Database not available. Please refresh the page and try again.');
      return;
    }
    
    setLoading(true);
    try {
      const updateData = {};
      
      // Handle YouTube disconnect differently
      if (platform === 'youtube') {
        updateData.youtube_access_token = null;
        updateData.youtube_refresh_token = null;
        updateData.youtube_token_expires_at = null;
      } else {
        updateData[`${platform}_access_token`] = null;
      }
      
      updateData.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from("user_sessions")
        .update(updateData)
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      // Remove from localStorage
      if (platform === 'youtube') {
        localStorage.removeItem('yt_access_token');
        localStorage.removeItem('yt_refresh_token');
      } else {
        localStorage.removeItem(`${platform.substring(0, 2)}_access_token`);
      }
      
      toast.success(`${platform.charAt(0).toUpperCase() + platform.slice(1)} disconnected successfully`);
      fetchConnectedAccounts();
      // Refresh AuthContext to update connection status immediately
      if (refreshTokensFromDatabase) {
        await refreshTokensFromDatabase();
      }
    } catch (error) {
      console.error(`Error disconnecting ${platform}:`, error);
      toast.error(`Failed to disconnect ${platform}`);
    } finally {
      setLoading(false);
    }
  };

  const socialPlatforms = [
    { platform: 'facebook', name: 'Facebook', icon: Facebook, color: 'bg-blue-500', connectFn: connectFacebook },
    { platform: 'instagram', name: 'Instagram', icon: Instagram, color: 'bg-pink-500', connectFn: connectInstagram },
    { platform: 'twitter', name: 'Twitter', icon: Twitter, color: 'bg-sky-500', connectFn: () => toast.info('Twitter integration coming soon!') },
    { platform: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'bg-blue-700', connectFn: () => toast.info('LinkedIn integration coming soon!') },
    { platform: 'youtube', name: 'YouTube', icon: Youtube, color: 'bg-red-500', connectFn: handleConnectYoutube },
  ];

  if (!isAuthenticated) {
    return <div>Loading...</div>;
  }

  return (
    <div className="w-full p-4 md:p-6">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account and social media connections</p>
      </div>

      <Tabs defaultValue="accounts" className="w-full">
        <TabsList className="grid w-full grid-cols-3 gap-1 sm:gap-0 mb-4 sm:mb-6 sticky top-0 bg-background z-10">
          <TabsTrigger value="accounts" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-1 sm:py-2">
            <Settings className="h-3 w-3 sm:h-4 sm:w-4" /> <span className="sm:inline">Social Accounts</span><span className="inline sm:hidden">Accounts</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-1 sm:py-2">
            <User className="h-3 w-3 sm:h-4 sm:w-4" /> Profile
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-1 sm:py-2">
            <FileText className="h-3 w-3 sm:h-4 sm:w-4" /> Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-6 w-full">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Connected Social Media Accounts</CardTitle>
              <CardDescription>
                Connect your social media accounts to start posting and scheduling content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {socialPlatforms.map((platform) => {
                  // Check connection status from AuthContext for YouTube, database for others
                  let isConnected;
                  if (platform.platform === 'youtube') {
                    isConnected = !!youtubeAccessToken;
                  } else {
                    isConnected = connectedAccounts.some(acc => acc.platform === platform.platform);
                  }
                  const IconComponent = platform.icon;
                  
                  return (
                    <div key={platform.platform} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg gap-3 sm:gap-0">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${platform.color}`}>
                          <IconComponent className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-medium">{platform.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {isConnected ? 'Connected' : 'Not connected'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {isConnected ? (
                          <>
                            <Badge variant="secondary" className="text-green-600 hidden sm:inline-flex">
                              Connected
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => disconnectAccount(platform.platform)}
                              disabled={loading}
                              className="w-full sm:w-auto"
                            >
                              Disconnect
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={platform.connectFn}
                            disabled={loading}
                            className="w-full sm:w-auto"
                          >
                            Connect
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-6 w-full">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Manage your account details and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 border rounded-lg">
                  <label className="text-sm font-medium">Email</label>
                  <p className="text-sm text-muted-foreground mt-1 break-all">{user?.email || 'Not available'}</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <label className="text-sm font-medium">Name</label>
                  <p className="text-sm text-muted-foreground mt-1">{user?.name || 'Not available'}</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <label className="text-sm font-medium">User ID</label>
                  <p className="text-sm text-muted-foreground mt-1 font-mono text-xs break-all">{user?.id || 'Not available'}</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <label className="text-sm font-medium">Account Type</label>
                  <p className="text-sm text-muted-foreground mt-1">Free Plan</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>



        <TabsContent value="templates" className="space-y-6 w-full">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Post Templates</CardTitle>
              <CardDescription>
                Create reusable templates for your social media posts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6 sm:py-8">
                <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-medium mb-2">Templates Coming Soon</h3>
                <p className="text-muted-foreground mb-4 text-sm sm:text-base px-2 sm:px-0">
                  Create and save post templates for Instagram and Facebook to speed up your content creation.
                </p>
                <Button disabled className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}