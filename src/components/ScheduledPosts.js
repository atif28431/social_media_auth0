'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSupabase } from '@/context/SupabaseContext';
import { publishInstagramContainer } from '@/utils/instagram';
import { format } from 'date-fns';
import { Facebook, Instagram, Pencil, Trash2, RefreshCw, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function ScheduledPosts({ activeTab }) {
  const { isAuthenticated, fbAccessToken, instagramAccessToken } = useAuth();
  const { scheduledPosts, loading, error, fetchScheduledPosts, deleteScheduledPost } = useSupabase();
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchScheduledPosts();
    }
  }, [activeTab, isAuthenticated]);

  // Function to handle post deletion
  const handleDeletePost = async (postId) => {
    setIsDeleting(true);
    try {
      await deleteScheduledPost(postId);
      toast.success('Post deleted successfully');
      setIsDeleteDialogOpen(false);
    } catch (err) {
      toast.error('Failed to delete post: ' + (err.message || 'Unknown error'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Function to open delete confirmation dialog
  const openDeleteDialog = (postId) => {
    setSelectedPostId(postId);
    setIsDeleteDialogOpen(true);
  };

  // Function to handle post editing (placeholder for now)
  const handleEditPost = (postId) => {
    // In a real implementation, this would open an edit form or modal
    toast.info(`Edit functionality will be implemented in a future update`);
  };

  // Function to refresh posts
  const handleRefresh = () => {
    fetchScheduledPosts();
    toast.info('Refreshing scheduled posts...');
  };

  // Function to publish Instagram post immediately
  const handlePublishNow = async (post) => {
    if (post.platform !== "instagram" || !post.instagram_container_id) {
      toast.error("This action is only available for Instagram scheduled posts.");
      return;
    }

    if (window.confirm("Are you sure you want to publish this post now?")) {
      try {
        await publishInstagramContainer(
          instagramAccessToken,
          post.instagram_container_id
        );
        
        // Update the post status
        await deleteScheduledPost(post.id); // Remove from scheduled posts
        toast.success("Post published successfully!");
        fetchScheduledPosts(); // Refresh the list
      } catch (error) {
        console.error("Error publishing post:", error);
        toast.error("Error publishing post: " + error.message);
      }
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Scheduled Posts</CardTitle>
          <CardDescription>Manage your upcoming social media posts</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="text-center p-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p>Loading scheduled posts...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-destructive/10 text-destructive rounded-md">
            <p>{error}</p>
          </div>
        ) : scheduledPosts.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            <p>No scheduled posts found.</p>
            <p className="text-sm mt-2">Create a new post using the form above.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {scheduledPosts.map(post => (
              <div key={post.id} className="border rounded-lg p-4">
                <div className="mb-2">
                  <div className="flex items-center gap-2 mb-1">
                    {post.platform === "facebook" ? (
                      <Facebook className="h-5 w-5 text-blue-600" />
                    ) : post.platform === "instagram" ? (
                      <Instagram className="h-5 w-5 text-pink-600" />
                    ) : (
                      <Clock className="h-5 w-5" />
                    )}
                    <span className="font-medium">{post.page_name}</span>
                  </div>
                  <p className="font-medium">{post.message}</p>
                  {post.platform === "instagram" && post.image_url && (
                    <div className="mt-2">
                      <img 
                        src={post.image_url} 
                        alt="Instagram post preview" 
                        className="max-h-40 rounded-md mt-2 object-cover" 
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                      {post.page_name}
                    </span>
                    <span className="text-xs bg-secondary/80 text-secondary-foreground px-2 py-1 rounded-full">
                      {post.platform}
                    </span>
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                      {post.status}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Scheduled for: {format(new Date(post.scheduled_publish_time), 'PPP p')}
                </p>
                <div className="flex space-x-2">
                  {post.platform === "instagram" && post.instagram_container_id && (
                    <Button variant="outline" size="sm" onClick={() => handlePublishNow(post)}>
                      Publish Now
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => handleEditPost(post.id)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(post.id)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this scheduled post? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => handleDeletePost(selectedPostId)}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}