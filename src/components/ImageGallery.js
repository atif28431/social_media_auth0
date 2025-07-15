'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Trash2, Image as ImageIcon, Upload } from 'lucide-react';
import { toast } from 'sonner';

export default function ImageGallery({ platform = 'facebook', onImageSelect, selectedImageUrl }) {
  const { user, isAuthenticated } = useAuth();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user?.id && isOpen) {
      fetchImages();
    }
  }, [isAuthenticated, user?.id, isOpen, platform]);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/upload/image?userId=${user.id}&platform=${platform}`);
      const result = await response.json();
      
      if (response.ok) {
        setImages(result.images || []);
      } else {
        console.error('Failed to fetch images:', result.error);
        toast.error('Failed to load images');
      }
    } catch (error) {
      console.error('Error fetching images:', error);
      toast.error('Failed to load images');
    } finally {
      setLoading(false);
    }
  };

  const deleteImage = async (imageId) => {
    try {
      const response = await fetch(`/api/upload/image?imageId=${imageId}&userId=${user.id}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (result.success) {
        setImages(images.filter(img => img.id !== imageId));
        toast.success('Image deleted successfully');
      } else {
        toast.error('Failed to delete image');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Failed to delete image');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" type="button">
          <ImageIcon className="h-4 w-4 mr-2" />
          Choose from Gallery
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Image Gallery - {platform.charAt(0).toUpperCase() + platform.slice(1)}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading images...</span>
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-8">
              <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No images uploaded yet</p>
              <p className="text-sm text-gray-400">Upload images to see them here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((image) => (
                <Card key={image.id} className="overflow-hidden">
                  <div className="relative">
                    <img
                      src={image.public_url}
                      alt={image.original_name}
                      className="w-full h-48 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => {
                        onImageSelect(image.public_url, image);
                        setIsOpen(false);
                      }}
                    />
                    {selectedImageUrl === image.public_url && (
                      <div className="absolute top-2 right-2">
                        <Badge variant="default">Selected</Badge>
                      </div>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 left-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteImage(image.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardContent className="p-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium truncate" title={image.original_name}>
                        {image.original_name}
                      </p>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{formatFileSize(image.file_size)}</span>
                        <span>{image.file_type}</span>
                      </div>
                      <p className="text-xs text-gray-400">
                        {formatDate(image.created_at)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}