"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSupabase } from "@/context/SupabaseContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Facebook, Instagram, Calendar, Clock, Edit, Trash2, Play, Pause } from "lucide-react";
import Link from "next/link";

export default function ScheduledPostsPage() {
  const { isAuthenticated, user } = useAuth();
  const { supabase } = useSupabase();
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (isAuthenticated && supabase) {
      fetchScheduledPosts();
    }
  }, [isAuthenticated, supabase]);

  const fetchScheduledPosts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("scheduled_posts")
        .select("*")
        .eq("user_id", user?.sub)
        .order("scheduled_time", { ascending: true });

      if (error) {
        console.error("Error fetching scheduled posts:", error);
        // Mock data for demonstration
        setScheduledPosts([
          {
            id: 1,
            platform: "facebook",
            message: "Check out our latest product launch! 🚀",
            scheduled_time: "2024-01-15T10:00:00Z",
            status: "scheduled",
            page_name: "My Business Page",
            created_at: "2024-01-10T08:00:00Z"
          },
          {
            id: 2,
            platform: "instagram",
            message: "Beautiful sunset from our office! #sunset #office #beautiful",
            scheduled_time: "2024-01-15T18:00:00Z",
            status: "scheduled",
            image_url: "/placeholder-image.jpg",
            created_at: "2024-01-10T09:00:00Z"
          },
          {
            id: 3,
            platform: "facebook",
            message: "Weekly team meeting highlights",
            scheduled_time: "2024-01-12T14:00:00Z",
            status: "published",
            page_name: "Company Updates",
            created_at: "2024-01-08T10:00:00Z"
          }
        ]);
      } else {
        setScheduledPosts(data || []);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async (postId) => {
    try {
      const { error } = await supabase
        .from("scheduled_posts")
        .delete()
        .eq("id", postId);

      if (error) {
        console.error("Error deleting post:", error);
      } else {
        setScheduledPosts(prev => prev.filter(post => post.id !== postId));
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "published":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredPosts = scheduledPosts.filter(post => {
    if (activeTab === "all") return true;
    if (activeTab === "facebook") return post.platform === "facebook";
    if (activeTab === "instagram") return post.platform === "instagram";
    if (activeTab === "scheduled") return post.status === "scheduled";
    if (activeTab === "published") return post.status === "published";
    return true;
  });

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
            <p className="text-muted-foreground mb-6">
              Please log in to view your scheduled posts.
            </p>
            <Link href="/login">
              <Button>Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Scheduled Posts</h1>
            <p className="text-muted-foreground">
              Manage your scheduled and published content
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/facebook">
              <Button className="gap-2">
                <Facebook className="h-4 w-4" />
                Schedule Facebook Post
              </Button>
            </Link>
            <Link href="/instagram">
              <Button variant="outline" className="gap-2">
                <Instagram className="h-4 w-4" />
                Schedule Instagram Post
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Posts</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="published">Published</TabsTrigger>
          <TabsTrigger value="facebook">Facebook</TabsTrigger>
          <TabsTrigger value="instagram">Instagram</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No posts found</h3>
                <p className="text-muted-foreground mb-6">
                  {activeTab === "all" 
                    ? "You haven't scheduled any posts yet."
                    : `No ${activeTab} posts found.`
                  }
                </p>
                <div className="flex gap-2 justify-center">
                  <Link href="/facebook">
                    <Button className="gap-2">
                      <Facebook className="h-4 w-4" />
                      Create Facebook Post
                    </Button>
                  </Link>
                  <Link href="/instagram">
                    <Button variant="outline" className="gap-2">
                      <Instagram className="h-4 w-4" />
                      Create Instagram Post
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post) => {
                const PlatformIcon = post.platform === "facebook" ? Facebook : Instagram;
                const isScheduled = post.status === "scheduled";
                const isPast = new Date(post.scheduled_time) < new Date();
                
                return (
                  <Card key={post.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className={`p-2 rounded-lg ${
                            post.platform === "facebook" ? "bg-blue-100" : "bg-pink-100"
                          }`}>
                            <PlatformIcon className={`h-5 w-5 ${
                              post.platform === "facebook" ? "text-blue-600" : "text-pink-600"
                            }`} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={getStatusColor(post.status)}>
                                {post.status}
                              </Badge>
                              {post.page_name && (
                                <span className="text-sm text-muted-foreground">
                                  → {post.page_name}
                                </span>
                              )}
                            </div>
                            
                            <p className="font-medium mb-2 line-clamp-2">
                              {post.message}
                            </p>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>
                                  {isScheduled ? "Scheduled for" : "Published on"} {formatDate(post.scheduled_time)}
                                </span>
                              </div>
                              {isPast && isScheduled && (
                                <Badge variant="destructive" className="text-xs">
                                  Overdue
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {isScheduled && (
                            <>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Pause className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => deletePost(post.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}