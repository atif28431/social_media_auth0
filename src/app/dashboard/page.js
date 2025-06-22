"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSupabase } from "@/context/SupabaseContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import FacebookPostForm from "@/components/FacebookPostForm";
import InstagramPostForm from "@/components/InstagramPostForm";
import ScheduledPosts from "@/components/ScheduledPosts";
import { RefreshCw, Facebook, Instagram } from "lucide-react";
import { toast } from "sonner";

export default function Dashboard() {
  const { user, isAuthenticated, fbAccessToken } = useAuth();
  const { getUserPages } = useSupabase();
  const [fbPages, setFbPages] = useState([]);
  const [fbLoading, setFbLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("facebook");

  // Check for Facebook access token in localStorage on mount
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchFacebookPages = async () => {
      setFbLoading(true);
      try {
        // Try to get pages from Supabase first
        const savedPages = await getUserPages();
        if (savedPages && savedPages.length > 0) {
          console.log("Using saved Facebook pages from Supabase");
          setFbPages(savedPages);
          return;
        }

        // If no saved pages and we have a token, fetch from Facebook API
        if (fbAccessToken) {
          console.log("No saved pages, fetching from Facebook API");
          // This would be handled by the FacebookPostForm component
        } else {
          console.log("No Facebook access token available");
        }
      } catch (error) {
        console.error("Error fetching Facebook pages:", error);
      } finally {
        setFbLoading(false);
      }
    };

    fetchFacebookPages();
  }, [isAuthenticated, fbAccessToken, getUserPages]);

  const fetchScheduledPosts = async () => {
    // This would be handled by the ScheduledPosts component
  };

  if (!isAuthenticated) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Social Media Dashboard
      </h1>
      
      <Tabs
        defaultValue="facebook"
        className="w-full"
        onValueChange={(value) => {
          setActiveTab(value);
          if (value === "scheduled") {
            fetchScheduledPosts();
          }
        }}
      >
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="facebook" className="flex items-center gap-2">
            <Facebook className="h-4 w-4" /> Facebook
          </TabsTrigger>
          <TabsTrigger value="instagram" className="flex items-center gap-2">
            <Instagram className="h-4 w-4" /> Instagram
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> Scheduled Posts
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="facebook" className="space-y-4">
          <FacebookPostForm />
        </TabsContent>
        
        <TabsContent value="instagram" className="space-y-4">
          <InstagramPostForm />
        </TabsContent>
        
        <TabsContent value="scheduled" className="space-y-4">
          <ScheduledPosts activeTab={activeTab} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
