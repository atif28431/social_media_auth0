"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSupabase } from "@/context/SupabaseContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ScheduledPosts from "@/components/ScheduledPosts";
import { 
  Facebook, 
  Instagram, 
  Twitter, 
  Linkedin, 
  Calendar, 
  BarChart3, 
  Settings, 
  Plus,
  ArrowRight,
  Hash,
  FileText,
  Youtube,
  RefreshCw,
  TrendingUp,
  Clock,
  CheckCircle
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function Dashboard() {
  const { user, isAuthenticated, fbAccessToken, instagramAccessToken, youtubeAccessToken } = useAuth();
  const { supabase } = useSupabase();
  const [stats, setStats] = useState({
    totalPosts: 0,
    scheduledPosts: 0,
    publishedPosts: 0,
    connectedAccounts: 0,
    drafts: 0,
    totalPages: 0,
    instagramAccounts: 0,
    thisWeekPosts: 0
  });
  const [recentPosts, setRecentPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchDashboardData();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated, supabase, user?.id]);

  const fetchDashboardData = async (isRefresh = false) => {
    if (!supabase || !user?.id) return;
    
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Fetch all data in parallel for better performance
      const [
        scheduledPostsResult,
        facebookPagesResult,
        instagramAccountsResult
      ] = await Promise.allSettled([
        supabase
          .from("scheduled_posts")
          .select("*")
          .eq("user_id", user.id),
        supabase
          .from("facebook_pages")
          .select("*")
          .eq("user_id", user.id),
        supabase
          .from("instagram_accounts")
          .select("*")
          .eq("user_id", user.id)
      ]);

      // Process scheduled posts data
      const scheduledPosts = scheduledPostsResult.status === 'fulfilled' ? 
        (scheduledPostsResult.value.data || []) : [];
      
      console.log("Fetched scheduled posts:", scheduledPosts);

      // Process Facebook pages data
      const facebookPages = facebookPagesResult.status === 'fulfilled' ? 
        (facebookPagesResult.value.data || []) : [];
      
      console.log("Fetched Facebook pages:", facebookPages);

      // Process Instagram accounts data
      const instagramAccounts = instagramAccountsResult.status === 'fulfilled' ? 
        (instagramAccountsResult.value.data || []) : [];
      
      console.log("Fetched Instagram accounts:", instagramAccounts);

      // Calculate statistics
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const scheduledCount = scheduledPosts.filter(post => 
        post.status === 'scheduled' && new Date(post.scheduled_publish_time) > now
      ).length;
      
      const publishedCount = scheduledPosts.filter(post => 
        post.status === 'published' || post.status === 'completed'
      ).length;
      
      const draftsCount = scheduledPosts.filter(post => 
        post.status === 'draft'
      ).length;
      
      const thisWeekPostsCount = scheduledPosts.filter(post => {
        const postDate = new Date(post.created_at);
        return postDate >= oneWeekAgo && postDate <= now;
      }).length;

      // Count connected accounts
      let connectedCount = 0;
      if (fbAccessToken && facebookPages.length > 0) connectedCount++;
      if (instagramAccessToken && instagramAccounts.length > 0) connectedCount++;
      if (youtubeAccessToken) connectedCount++;
      
      const newStats = {
        totalPosts: scheduledPosts.length,
        scheduledPosts: scheduledCount,
        publishedPosts: publishedCount,
        connectedAccounts: connectedCount,
        drafts: draftsCount,
        totalPages: facebookPages.length,
        instagramAccounts: instagramAccounts.length,
        thisWeekPosts: thisWeekPostsCount
      };
      
      console.log("Calculated stats:", newStats);
      setStats(newStats);
      
      // Get recent posts (last 10 posts ordered by creation date)
      const recentPostsData = scheduledPosts
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 10)
        .map(post => ({
          id: post.id,
          platform: post.platform || 'facebook',
          message: post.message.substring(0, 100) + (post.message.length > 100 ? '...' : ''),
          date: new Date(post.created_at).toLocaleDateString(),
          scheduled_date: post.scheduled_publish_time ? 
            new Date(post.scheduled_publish_time).toLocaleDateString() : null,
          status: post.status,
          page_name: post.page_name
        }));
      
      console.log("Recent posts data:", recentPostsData);
      setRecentPosts(recentPostsData);
      setLastUpdated(new Date());
      
      if (isRefresh) {
        toast.success("Dashboard data refreshed");
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to access your dashboard</h1>
          <Link href="/api/auth/login">
            <Button>Log In</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="animate-pulse space-y-6">
          <div className="flex justify-between items-center">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-10 bg-gray-200 rounded w-24"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const quickActions = [
    {
      title: "Post to Facebook",
      description: "Create and schedule Facebook posts",
      icon: Facebook,
      href: "/facebook",
      color: "bg-blue-500",
      connected: !!fbAccessToken && stats.totalPages > 0,
      badge: stats.totalPages > 0 ? `${stats.totalPages} pages` : null
    },
    {
      title: "Post to Instagram",
      description: "Share photos and stories",
      icon: Instagram,
      href: "/instagram",
      color: "bg-pink-500",
      connected: !!instagramAccessToken && stats.instagramAccounts > 0,
      badge: stats.instagramAccounts > 0 ? `${stats.instagramAccounts} accounts` : null
    },
    {
      title: "YouTube Integration",
      description: "Manage YouTube content",
      icon: Youtube,
      href: "/youtube",
      color: "bg-red-500",
      connected: !!youtubeAccessToken,
      badge: youtubeAccessToken ? "Connected" : null
    },
    {
      title: "Manage Hashtags",
      description: "Create hashtag collections",
      icon: Hash,
      href: "/settings?tab=hashtags",
      color: "bg-purple-500",
      connected: true
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'published':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'instagram':
        return Instagram;
      case 'youtube':
        return Youtube;
      case 'facebook':
      default:
        return Facebook;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-muted-foreground">Welcome back, {user?.name || 'User'}!</p>
              {lastUpdated && (
                <span className="text-xs text-muted-foreground">
                  • Last updated {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={refreshing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link href="/settings">
              <Button variant="outline" className="gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Posts</p>
                <p className="text-2xl font-bold">{stats.totalPosts}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.thisWeekPosts} this week
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Scheduled</p>
                <p className="text-2xl font-bold">{stats.scheduledPosts}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.drafts} drafts
                </p>
              </div>
              <Calendar className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Connected</p>
                <p className="text-2xl font-bold">{stats.connectedAccounts}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Social accounts
                </p>
              </div>
              <Settings className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Published</p>
                <p className="text-2xl font-bold">{stats.publishedPosts}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  All time
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Create content and manage your social media presence
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quickActions.map((action, index) => {
                  const IconComponent = action.icon;
                  return (
                    <Link key={index} href={action.href}>
                      <div className="group p-4 border rounded-lg hover:shadow-md transition-all cursor-pointer hover:border-primary/50">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${action.color}`}>
                            <IconComponent className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium group-hover:text-primary transition-colors">
                                {action.title}
                              </h3>
                              {action.connected && (
                                <Badge variant="secondary" className="text-xs">
                                  {action.badge || "Ready"}
                                </Badge>
                              )}
                              {!action.connected && action.href !== "/settings?tab=hashtags" && (
                                <Badge variant="outline" className="text-xs text-orange-600">
                                  Setup Required
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {action.description}
                            </p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Posts</CardTitle>
                  <CardDescription>
                    Your latest social media activity
                  </CardDescription>
                </div>
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentPosts.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground mb-2">No posts yet</p>
                    <p className="text-xs text-muted-foreground">
                      Create your first post to see activity here
                    </p>
                  </div>
                ) : (
                  recentPosts.map((post) => {
                    const PlatformIcon = getPlatformIcon(post.platform);
                    return (
                      <div key={post.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className={`p-1 rounded flex-shrink-0 ${
                          post.platform === 'facebook' ? 'bg-blue-100' : 
                          post.platform === 'instagram' ? 'bg-pink-100' : 
                          'bg-red-100'
                        }`}>
                          <PlatformIcon className={`h-4 w-4 ${
                            post.platform === 'facebook' ? 'text-blue-600' : 
                            post.platform === 'instagram' ? 'text-pink-600' : 
                            'text-red-600'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {post.message}
                          </p>
                          {post.page_name && (
                            <p className="text-xs text-muted-foreground truncate">
                              → {post.page_name}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <p className="text-xs text-muted-foreground">
                              {post.date}
                            </p>
                            {post.scheduled_date && post.status === 'scheduled' && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {post.scheduled_date}
                              </p>
                            )}
                            <Badge 
                              variant="secondary"
                              className={`text-xs ${getStatusColor(post.status)}`}
                            >
                              {post.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                
                <div className="space-y-2 pt-2">
                  <Link href="/scheduled">
                    <Button variant="outline" className="w-full">
                      View All Posts
                    </Button>
                  </Link>
                  <Link href="/facebook">
                    <Button className="w-full gap-2">
                      <Plus className="h-4 w-4" />
                      Create New Post
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}