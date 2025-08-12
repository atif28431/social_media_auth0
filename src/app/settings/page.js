"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash, Facebook, Instagram, Twitter, Linkedin, Settings, User, FileText, Plus, Youtube, Shield, Scale } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user, isAuthenticated, fbAccessToken, instagramAccessToken, youtubeAccessToken, refreshTokensFromDatabase, supabase } = useAuth();
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user && supabase && user.id) {
      console.log('Fetching connected accounts for user:', user.id);
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
      // Fetch Facebook accounts with their pages hierarchically
      const [facebookAccounts, instagramAccounts, youtubeChannels] = await Promise.all([
        supabase
          .from("facebook_accounts")
          .select(`
            *,
            facebook_pages(*)
          `)
          .eq("user_id", user.id)
          .eq("is_active", true),
        supabase
           .from("instagram_accounts")
          .select("id, instagram_account_id, username, name, profile_picture_url, page_name, created_at, is_primary")
          .eq("user_id", user.id),
        supabase
          .from("youtube_accounts")
          .select("id, youtube_channel_id, channel_name, channel_description, profile_picture_url, created_at")
          .eq("user_id", user.id)
      ]);

      const accounts = [];

      // Add Facebook accounts with their pages
      if (facebookAccounts.data && facebookAccounts.data.length > 0) {
        facebookAccounts.data.forEach(account => {
          accounts.push({
            id: account.id,
            platform: 'facebook',
            name: 'Facebook',
            displayName: account.facebook_user_name,
            icon: Facebook,
            color: 'bg-blue-500',
            connected: true,
            accountId: account.facebook_user_id,
            type: 'main_account',
            isPrimary: account.is_primary,
            pages: account.facebook_pages || []
          });
        });
      }

      // Add Instagram accounts
      if (instagramAccounts.data && instagramAccounts.data.length > 0) {
        instagramAccounts.data.forEach(account => {
          accounts.push({
            id: account.id,
            platform: 'instagram',
            name: 'Instagram',
            displayName: account.username || account.name,
            icon: Instagram,
            color: 'bg-pink-500',
            connected: true,
            accountId: account.instagram_account_id,
            profilePicture: account.profile_picture_url,
            type: 'account',
            isPrimary: account.is_primary
          });
        });
      }

      // Add YouTube channels
      if (youtubeChannels.data && youtubeChannels.data.length > 0) {
        youtubeChannels.data.forEach(channel => {
          accounts.push({
            id: channel.id,
            platform: 'youtube',
            name: 'YouTube',
            displayName: channel.channel_name,
            description: channel.channel_description,
            icon: Youtube,
            color: 'bg-red-500',
            connected: true,
            accountId: channel.youtube_channel_id,
            profilePicture: channel.profile_picture_url,
            type: 'channel'
          });
        });
      }

      setConnectedAccounts(accounts);
    } catch (error) {
      console.error("Error fetching connected accounts:", error);
      toast.error("Failed to load connected accounts");
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

  const connectInstagramFacebook = () => {
    const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
    const redirectUri = `${window.location.origin}/instagram-callback`;
    const scope = "instagram_basic,pages_show_list,instagram_manage_comments,instagram_content_publish,instagram_manage_insights";
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Store state in localStorage for verification
    localStorage.setItem('instagram_state', state);
    
    window.location.href = `https://www.facebook.com/v23.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code&auth_type=rerequest&state=${state}`;
  };

  const connectInstagramDirect = async () => {
    try {
      if (!user?.id) {
        toast.error('User not authenticated');
        return;
      }

      // Check if Instagram App ID is configured
      if (!process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID) {
        toast.error('Instagram Basic Display API not configured');
        return;
      }

      // Open Instagram Basic Display OAuth in popup
      const popup = window.open(
        '',
        'instagram-direct-auth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      // Generate auth URL
      const response = await fetch(`/api/instagram/direct-auth?user_id=${user.id}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate auth URL');
      }

      if (popup) {
        popup.location.href = data.auth_url;
      }

      // Listen for popup completion
      const handleMessage = async (event) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.success) {
          toast.success('Instagram account connected successfully!');
          await fetchConnectedAccounts();
          if (refreshTokensFromDatabase) {
            await refreshTokensFromDatabase();
          }
        } else if (event.data.error) {
          toast.error(`Failed to connect Instagram: ${event.data.error}`);
        }
        
        window.removeEventListener('message', handleMessage);
      };

      window.addEventListener('message', handleMessage);

    } catch (error) {
      console.error('Instagram direct connection error:', error);
      toast.error(error.message || 'Failed to connect Instagram account');
    }
  };

  const connectInstagram = () => {
    // Show modal with connection options
    const modal = document.createElement('div');
    modal.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center;">
        <div style="background: white; padding: 2rem; border-radius: 8px; max-width: 400px; width: 90%; text-align: center;">
          <h3 style="margin-bottom: 1rem;">Connect Instagram Account</h3>
          <p style="margin-bottom: 1.5rem; color: #666;">Choose how you want to connect your Instagram account:</p>
          <div style="display: flex; flex-direction: column; gap: 1rem;">
            <button id="facebook-method" style="padding: 1rem; background: #1877F2; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Connect via Facebook (Business Accounts)
            </button>
            <button id="direct-method" style="padding: 1rem; background: #E4405F; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Connect via Instagram (Personal Accounts)
            </button>
            <button id="cancel-method" style="padding: 0.5rem; background: #f5f5f5; color: #333; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;">
              Cancel
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('#facebook-method').onclick = () => {
      document.body.removeChild(modal);
      connectInstagramFacebook();
    };
    
    modal.querySelector('#direct-method').onclick = () => {
      document.body.removeChild(modal);
      connectInstagramDirect();
    };
    
    modal.querySelector('#cancel-method').onclick = () => {
      document.body.removeChild(modal);
    };
    
    modal.onclick = (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    };
  };

  

  const disconnectAccount = async (platform, accountId) => {
    if (!supabase) {
      toast.error('Database not available. Please refresh the page and try again.');
      return;
    }
    
    setLoading(true);
    try {
      let tableName;
      switch (platform) {
        case 'facebook':
          tableName = 'facebook_pages';
          break;
        case 'instagram':
          tableName = 'instagram_accounts';
          break;
        case 'youtube':
          tableName = 'youtube_accounts';
          break;
        default:
          throw new Error('Invalid platform');
      }

      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq("id", accountId)
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      // If no more accounts of this type, also clear from user_sessions for backward compatibility
      const { data: remainingAccounts } = await supabase
        .from(tableName)
        .select('id')
        .eq("user_id", user.id)
        .limit(1);

      if (!remainingAccounts || remainingAccounts.length === 0) {
        if (platform === 'youtube') {
          await supabase
            .from("user_sessions")
            .update({
              youtube_access_token: null,
              youtube_refresh_token: null,
              youtube_token_expires_at: null,
              updated_at: new Date().toISOString()
            })
            .eq("user_id", user.id);
          
          localStorage.removeItem('yt_access_token');
          localStorage.removeItem('yt_refresh_token');
        }
      }
      
      toast.success(`${platform.charAt(0).toUpperCase() + platform.slice(1)} account disconnected successfully`);
      fetchConnectedAccounts();
      // Refresh AuthContext to update connection status immediately
      if (refreshTokensFromDatabase) {
        await refreshTokensFromDatabase();
      }
    } catch (error) {
      console.error(`Error disconnecting ${platform}:`, error);
      toast.error(`Failed to disconnect ${platform} account`);
    } finally {
      setLoading(false);
    }
  };

  const setPrimaryAccount = async (platform, accountId) => {
    if (!supabase) {
      toast.error('Database not available. Please refresh the page and try again.');
      return;
    }
    
    setLoading(true);
    try {
      let tableName;
      switch (platform) {
        case 'facebook':
          tableName = 'facebook_accounts';
          break;
        case 'instagram':
          tableName = 'instagram_accounts';
          break;
        default:
          throw new Error('Invalid platform');
      }

      // First, set all accounts/pages for this platform to non-primary
      const { error: resetError } = await supabase
        .from(tableName)
        .update({ is_primary: false })
        .eq('user_id', user.id);

      if (resetError) throw resetError;

      // Then, set the selected account/page as primary
      const { error: setError } = await supabase
        .from(tableName)
        .update({ is_primary: true })
        .eq('id', accountId);

      if (setError) throw setError;

      toast.success('Primary account set successfully');
      fetchConnectedAccounts();
    } catch (error) {
      console.error('Error setting primary account:', error);
      toast.error('Failed to set primary account');
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
      <div><Card className="w-full">
            <CardHeader>
              <CardTitle>Connected Social Media Accounts</CardTitle>
              <CardDescription>
                Connect your social media accounts to start posting and scheduling content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {socialPlatforms.map((platform) => {
                  const platformAccounts = connectedAccounts.filter(acc => acc.platform === platform.platform);
                  const isConnected = platformAccounts.length > 0;
                  const IconComponent = platform.icon;
                  
                  return (
                    <div key={platform.platform} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${platform.color}`}>
                            <IconComponent className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-medium">{platform.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {platformAccounts.length} account{platformAccounts.length !== 1 ? 's' : ''} connected
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={platform.connectFn}
                          disabled={loading}
                          className="w-auto"
                        >
                          Add Another
                        </Button>
                      </div>
                      
                      {platformAccounts.length > 0 && (
                        <div className="space-y-3">
                          {platform.platform === 'facebook' ? (
                            // Facebook hierarchical display
                            platformAccounts.map((account) => (
                              <div key={account.id} className="border rounded-lg bg-muted/20">
                                {/* Main Facebook Account */}
                                <div className="flex items-center justify-between p-3 border-b">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                                      <Facebook className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                    <h4 className="font-medium text-sm">{account.displayName}</h4>
                                    <div className="text-xs text-muted-foreground">
                                      Main Account {account.isPrimary && <Badge variant="secondary" className="ml-1">Primary</Badge>}
                                    </div>
                                    <p className="text-xs text-muted-foreground font-mono">
                                      {account.accountId}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {!account.isPrimary ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setPrimaryAccount('facebook', account.id)}
                                      disabled={loading}
                                      className="text-green-600 border-green-600 hover:bg-green-50"
                                    >
                                      Set Primary
                                    </Button>
                                  ) : (
                                    <Badge variant="default" className="bg-green-500 text-white">
                                      Primary
                                    </Badge>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => disconnectAccount('facebook', account.id)}
                                    disabled={loading}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash />
                                  </Button>
                                </div>
                                </div>
                                
                                {/* Pages under this account */}
                                {account.pages && account.pages.length > 0 && (
                                  <div className="space-y-2 p-3">
                                    <p className="text-xs font-medium text-muted-foreground mb-2">Pages ({account.pages.length})</p>
                                    {account.pages.map((page) => (
                                      <div key={page.id} className="flex items-center justify-between p-2 ml-4 border-l-2 border-blue-200 rounded-r-lg">
                                        <div className="flex items-center gap-2">
                                          <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center">
                                            <FileText className="w-3 h-3 text-blue-600" />
                                          </div>
                                          <div>
                                            <h5 className="text-sm font-medium">{page.page_name}</h5>
                                            <p className="text-xs text-muted-foreground">{page.category}</p>
                                            {page.is_primary && <Badge variant="secondary" className="text-xs">Primary Page</Badge>}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {!page.is_primary ? (
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => setPrimaryAccount('facebook', page.id)}
                                              disabled={loading}
                                              className="text-green-600 border-green-600 hover:bg-green-50 text-xs h-7"
                                            >
                                              Set Primary
                                            </Button>
                                          ) : (
                                            <Badge variant="default" className="bg-green-500 text-white text-xs">
                                              Primary
                                            </Badge>
                                          )}
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => disconnectAccount('facebook', page.id)}
                                            disabled={loading}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 px-2 text-xs"
                                          >
                                            <Trash />
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            // Other platforms (flat display)
                            platformAccounts.map((account) => (
                              <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                                <div className="flex items-center gap-3">
                                  {account.profilePicture && (
                                    <img 
                                      src={account.profilePicture} 
                                      alt={account.displayName}
                                      className="w-10 h-10 rounded-full object-cover"
                                      onError={(e) => e.target.style.display = 'none'}
                                    />
                                  )}
                                  <div>
                                    <h4 className="font-medium text-sm">{account.displayName}</h4>
                                    {account.category && (
                                      <p className="text-xs text-muted-foreground">{account.category}</p>
                                    )}
                                    {account.description && (
                                      <p className="text-xs text-muted-foreground line-clamp-1">{account.description}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground font-mono">
                                      {account.accountId}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {platform.platform !== 'youtube' && !account.isPrimary ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setPrimaryAccount(platform.platform, account.id)}
                                      disabled={loading}
                                      className="text-green-600 border-green-600 hover:bg-green-50"
                                    >
                                      Set Primary
                                    </Button>
                                  ) : platform.platform !== 'youtube' && account.isPrimary ? (
                                    <Badge variant="default" className="bg-green-500 text-white">
                                      Primary
                                    </Badge>
                                  ) : null}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => disconnectAccount(platform.platform, account.id)}
                                    disabled={loading}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash />
                                  </Button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                      
                      {platformAccounts.length === 0 && (
                          <div className="text-center py-6 border-t">
                            <p className="text-sm text-muted-foreground mb-3">
                              No {platform.name} accounts connected
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={platform.connectFn}
                              disabled={loading}
                            >
                              Connect {platform.name}
                            </Button>
                          </div>
                        )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card></div>
      
    </div>
  );
}