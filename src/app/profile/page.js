'use client';






import { useState, useEffect } from 'react';
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Mail, 
  Phone, 
  MapPin, 
  AlertTriangle, 
  CheckCircle, 
  User, 
  Settings, 
  Calendar,
  Users,
  Activity,
  Globe,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Linkedin,
  ExternalLink,
  Edit3
} from 'lucide-react';
import { format } from 'date-fns';

export default function Profile() {
  const { user, isAuthenticated, supabase } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (isAuthenticated && user && supabase) {
      fetchProfileData();
      fetchConnectedAccounts();
    }
  }, [isAuthenticated, user, supabase]);

  const fetchProfileData = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      } else {
        setProfileData(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchConnectedAccounts = async () => {
    try {
      const [facebookResponse, instagramResponse, youtubeResponse] = await Promise.all([
        supabase.from('facebook_pages').select('*').eq('user_id', user.id),
        supabase.from('instagram_accounts').select('*').eq('user_id', user.id),
        supabase.from('youtube_channels').select('*').eq('user_id', user.id)
      ]);

      const accounts = [];

      if (facebookResponse.data) {
        accounts.push(...facebookResponse.data.map(acc => ({
          ...acc,
          platform: 'facebook',
          platformName: 'Facebook',
          icon: Facebook,
          color: 'text-blue-600'
        })));
      }

      if (instagramResponse.data) {
        accounts.push(...instagramResponse.data.map(acc => ({
          ...acc,
          platform: 'instagram',
          platformName: 'Instagram',
          icon: Instagram,
          color: 'text-pink-600'
        })));
      }

      if (youtubeResponse.data) {
        accounts.push(...youtubeResponse.data.map(acc => ({
          ...acc,
          platform: 'youtube',
          platformName: 'YouTube',
          icon: Youtube,
          color: 'text-red-600'
        })));
      }

      setConnectedAccounts(accounts);
    } catch (error) {
      console.error('Error fetching connected accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserInitials = () => {
    if (!user) return 'U';
    
    if (user.name) {
      const parts = user.name.trim().split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return parts[0][0].toUpperCase();
    }
    
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    
    return 'U';
  };

  const formatJoinDate = (date) => {
    if (!date) return 'Not available';
    return format(new Date(date), 'MMMM yyyy');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Please sign in to view your profile.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Manage your personal information and connected accounts
          </p>
        </div>

        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-6">
          <div className="px-6 py-8">
            <div className="flex items-center space-x-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user?.picture} alt={user?.name} />
                <AvatarFallback className="text-2xl bg-blue-500 text-white">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {user?.name || 'User Name'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">{user?.email}</p>
                <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Joined {formatJoinDate(user?.created_at)}
                  </span>
                  <span className="flex items-center">
                    <Globe className="h-4 w-4 mr-1" />
                    {connectedAccounts.length} connected accounts
                  </span>
                </div>
              </div>
              <Button variant="outline" className="hidden sm:flex items-center gap-2">
                <Edit3 className="h-4 w-4" />
                Edit Profile
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-1/2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="accounts">Connected Accounts</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {user?.name || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{user?.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">User ID</label>
                    <p className="mt-1 text-sm font-mono text-gray-600 dark:text-gray-400 text-xs">
                      {user?.id}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Account Status</label>
                    <div className="mt-1">
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Posts scheduled
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Connected Platforms</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{connectedAccounts.length}</div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Social accounts linked
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Account Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Free</div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Current plan
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="accounts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Connected Social Accounts
                </CardTitle>
              </CardHeader>
              <CardContent>
                {connectedAccounts.length > 0 ? (
                  <div className="space-y-4">
                    {connectedAccounts.map((account) => {
                      const IconComponent = account.icon;
                      return (
                        <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className={`p-2 rounded-lg ${account.color} bg-opacity-10`}>
                              <IconComponent className={`h-5 w-5 ${account.color}`} />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {account.name || account.displayName || account.page_name || account.channel_title}
                              </h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {account.platformName}
                              </p>
                              {account.username && (
                                <p className="text-xs text-gray-400 dark:text-gray-500">
                                  @{account.username}
                                </p>
                              )}
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Globe className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      No social accounts connected yet
                    </p>
                    <Button variant="outline" onClick={() => window.location.href = '/settings'}>
                      Connect Accounts
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No recent activity to display
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                    Your recent posts and account activities will appear here
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
