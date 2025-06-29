"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSupabase } from "@/context/SupabaseContext";
import { getUserInstagramAccounts, postToInstagram, scheduleInstagramPost } from "@/utils/instagram";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, ImageIcon, AlertCircle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Toaster } from "@/components/ui/sonner";

export default function InstagramPostForm() {
  const { accessToken, isAuthenticated, tokenError, refreshFacebookToken } = useAuth();
  const { addScheduledPost, saveInstagramAccounts } = useSupabase();
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [selectedAccountName, setSelectedAccountName] = useState("");
  const [loading, setLoading] = useState(false);
  const [enableScheduling, setEnableScheduling] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [scheduledDateTime, setScheduledDateTime] = useState(null);
  const [fetchError, setFetchError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  // Fetch user's Instagram accounts when component mounts
  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    const fetchAccounts = async () => {
      try {
        setFetchError("");
        const accountsData = await getUserInstagramAccounts(accessToken);
        console.log("Fetched Instagram accounts:", accountsData);
        setAccounts(accountsData);
        
        // Save accounts to Supabase for future use
        await saveInstagramAccounts(accountsData);
        
        if (accountsData.length > 0) {
          setSelectedAccount(accountsData[0].id);
          setSelectedAccountName(accountsData[0].username);
        }
        setRetryCount(0); // Reset retry count on success
      } catch (err) {
        console.error("Error fetching Instagram accounts:", err);
        
        // Check if it's a token expiration error
        if (err.message.includes("Session has expired") || err.message.includes("access token")) {
          setFetchError("Your access token has expired. Please reconnect your Facebook account.");
        } else {
          setFetchError(`Failed to load Instagram accounts: ${err.message}`);
        }
      }
    };

    fetchAccounts();
  }, [isAuthenticated, accessToken, saveInstagramAccounts, retryCount]);

  // Update scheduledDateTime when date or time changes
  useEffect(() => {
    if (enableScheduling && scheduledDate && scheduledTime) {
      const dateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      setScheduledDateTime(dateTime);
    } else {
      setScheduledDateTime(null);
    }
  }, [enableScheduling, scheduledDate, scheduledTime]);

  const handleRetryFetch = async () => {
    if (tokenError || fetchError.includes("expired")) {
      // Try to refresh the token first
      const refreshed = await refreshFacebookToken();
      if (refreshed) {
        setRetryCount(prev => prev + 1); // This will trigger the useEffect to refetch
      } else {
        setFetchError("Failed to refresh token. Please reconnect your Facebook account.");
      }
    } else {
      setRetryCount(prev => prev + 1); // This will trigger the useEffect to refetch
    }
  };

  const handleReconnectFacebook = () => {
    // Redirect to Facebook OAuth
    const fbAppId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
    const redirectUri = encodeURIComponent(`${window.location.origin}/facebook-callback`);
    const scope = encodeURIComponent("pages_show_list,pages_read_engagement,instagram_basic,instagram_content_publish,pages_manage_posts");
    
    window.location.href = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${fbAppId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!selectedAccount) {
        throw new Error("Please select an Instagram account to post to.");
      }
      if (!imageUrl) {
        throw new Error("Please provide an image URL for your Instagram post.");
      }
      
      // Find the selected account object
      const accountObj = accounts.find((a) => a.id === selectedAccount);
      if (!accountObj) {
        throw new Error("Selected account not found. Please refresh and try again.");
      }

      // Check if we have the page access token
      if (!accountObj.pageAccessToken) {
        throw new Error("Missing access token for the selected account. Please reconnect your Instagram account.");
      }
      
      let result;
      if (enableScheduling && scheduledDateTime) {
        // Schedule the post
        result = await scheduleInstagramPost(
          accountObj.pageAccessToken,
          caption,
          imageUrl,
          scheduledDateTime,
          selectedAccount
        );
        
        // Save scheduled post to Supabase
        await addScheduledPost({
          message: caption,
          scheduledPublishTime: scheduledDateTime.toISOString(),
          pageId: accountObj.pageId,
          pageName: accountObj.pageName,
          platform: "instagram",
          status: "scheduled",
          instagramContainerId: result.containerId
        });
      } else {
        // Post immediately
        result = await postToInstagram(
          accountObj.pageAccessToken,
          caption,
          imageUrl,
          selectedAccount
        );
      }
      
      // Show success alert
      window.alert("Instagram post successful!");
      
      // Reset form fields
      setCaption("");
      setImageUrl("");
      setEnableScheduling(false);
      setScheduledDate("");
      setScheduledTime("");
      setScheduledDateTime(null);
    } catch (err) {
      console.error("Error posting to Instagram:", err);
      
      // Provide more specific error messages
      let errorMessage = err.message || "Unknown error occurred";
      
      if (err.message.includes("Session has expired") || err.message.includes("access token")) {
        errorMessage = "Your access token has expired. Please reconnect your Facebook account.";
      } else if (err.message.includes("Invalid image URL")) {
        errorMessage = "The image URL is invalid or inaccessible. Please check the URL and try again.";
      } else if (err.message.includes("rate limit")) {
        errorMessage = "Rate limit exceeded. Please wait a few minutes before trying again.";
      }
      
      window.alert("Error posting to Instagram: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Post to Instagram</CardTitle>
        <CardDescription>
          Create a new post or schedule it for later
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Token Error Alert */}
        {tokenError && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{tokenError}</span>
              <Button onClick={handleReconnectFacebook} size="sm" variant="outline">
                Reconnect Facebook
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Fetch Error Alert */}
        {fetchError && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{fetchError}</span>
              <Button onClick={handleRetryFetch} size="sm" variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Image URL Field */}
            <div className="space-y-2">
              <label htmlFor="imageUrl" className="flex items-center gap-2 text-sm font-medium">
                <ImageIcon className="h-4 w-4" /> Image URL
              </label>
              <Input
                id="imageUrl"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/your-image.jpg"
                required
              />
              <p className="text-sm text-muted-foreground">
                Enter a publicly accessible URL to your image
              </p>
            </div>
            
            {/* Caption Field */}
            <div className="space-y-2">
              <label htmlFor="caption" className="text-sm font-medium">
                Caption
              </label>
              <Textarea
                id="caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write your caption here..."
                className="min-h-[120px]"
              />
            </div>

            {/* Account Selector */}
            <div className="space-y-2">
              <label htmlFor="account" className="text-sm font-medium">
                Post to
              </label>
              <Select
                value={selectedAccount}
                onValueChange={(value) => {
                  setSelectedAccount(value);
                  const account = accounts.find((a) => a.id === value);
                  if (account) setSelectedAccountName(account.username);
                }}
                disabled={accounts.length === 0 || !!fetchError}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    fetchError ? "Error loading accounts" : 
                    accounts.length === 0 ? "Loading accounts..." : 
                    "Select an account"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {accounts.length === 0 && !fetchError ? (
                    <div className="p-2 text-muted-foreground text-sm">
                      Loading accounts...
                    </div>
                  ) : fetchError ? (
                    <div className="p-2 text-muted-foreground text-sm">
                      Error loading accounts
                    </div>
                  ) : (
                    accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.username}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Note: You must have a Facebook Page with a connected Instagram Professional account.
              </p>
            </div>

            {/* Schedule Checkbox */}
            <div className="flex flex-row items-start space-x-3 rounded-md border p-4">
              <Checkbox
                id="enableScheduling"
                checked={enableScheduling}
                onCheckedChange={setEnableScheduling}
              />
              <div className="space-y-1 leading-none">
                <label
                  htmlFor="enableScheduling"
                  className="text-sm font-medium"
                >
                  Schedule for later
                </label>
                <p className="text-sm text-muted-foreground">
                  Choose a future date and time to publish this post
                </p>
              </div>
            </div>

            {/* Date & Time Inputs */}
            {enableScheduling && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label
                    htmlFor="scheduledDate"
                    className="flex items-center gap-2 text-sm font-medium"
                  >
                    <CalendarIcon className="h-4 w-4" /> Date
                  </label>
                  <Input
                    type="date"
                    id="scheduledDate"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    required={enableScheduling}
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="scheduledTime"
                    className="flex items-center gap-2 text-sm font-medium"
                  >
                    <Clock className="h-4 w-4" /> Time
                  </label>
                  <Input
                    type="time"
                    id="scheduledTime"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    required={enableScheduling}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={
              loading ||
              !imageUrl ||
              !selectedAccount ||
              !!fetchError ||
              !!tokenError ||
              (enableScheduling && (!scheduledDate || !scheduledTime))
            }
          >
            {loading
              ? "Posting..."
              : enableScheduling
              ? "Schedule Post"
              : "Post Now"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}