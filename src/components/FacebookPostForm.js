"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSupabase } from "@/context/SupabaseContext";
import { getUserPages, postToFacebook, schedulePost } from "@/utils/facebook";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";

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
import { Toaster } from "@/components/ui/sonner";

export default function FacebookPostForm() {
  const { accessToken, isAuthenticated } = useAuth();
  const { addScheduledPost } = useSupabase();
  const [message, setMessage] = useState("");
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState("");
  const [selectedPageName, setSelectedPageName] = useState("");
  const [loading, setLoading] = useState(false);
  const [enableScheduling, setEnableScheduling] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [scheduledDateTime, setScheduledDateTime] = useState(null);

  // Fetch user's Facebook pages when component mounts
  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    const fetchPages = async () => {
      try {
        const pagesData = await getUserPages(accessToken);
        console.log("Fetched Facebook pages:", pagesData); // Debug log
        setPages(pagesData);
        if (pagesData.length > 0) {
          setSelectedPage(pagesData[0].id);
          setSelectedPageName(pagesData[0].name);
        }
      } catch (err) {
        console.error("Error fetching pages:", err);
      }
    };

    fetchPages();
  }, [isAuthenticated, accessToken]);

  // Update scheduledDateTime when date or time changes
  useEffect(() => {
    if (enableScheduling && scheduledDate && scheduledTime) {
      const dateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      setScheduledDateTime(dateTime);
    } else {
      setScheduledDateTime(null);
    }
  }, [enableScheduling, scheduledDate, scheduledTime]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!selectedPage) {
        throw new Error("Please select a Facebook Page to post to.");
      }
      // Find the selected page object
      const pageObj = pages.find((p) => p.id === selectedPage);
      if (pageObj && pageObj.access_token) {
        console.log("Selected Page Access Token:", pageObj.access_token);
      } else {
        console.warn("No access token found for selected page.");
      }
      let result;
      if (enableScheduling && scheduledDateTime) {
        // Schedule the post
        result = await schedulePost(
          pageObj.access_token,
          message,
          scheduledDateTime,
          selectedPage
        );
        // Save scheduled post to Supabase
        await addScheduledPost({
          message,
          scheduledPublishTime: scheduledDateTime.toISOString(),
          pageId: selectedPage,
          pageName: selectedPageName,
          platform: "facebook",
          status: "scheduled",
          facebook_post_id: result?.id || null,
        });
      } else {
        // Post immediately
        result = await postToFacebook(
          pageObj.access_token,
          message,
          selectedPage
        );
      }
      // Show success alert
      window.alert("Post successful!");
      // Reset form fields
      setMessage("");
      setEnableScheduling(false);
      setScheduledDate("");
      setScheduledTime("");
      setScheduledDateTime(null);
    } catch (err) {
      console.error("Error posting to Facebook:", err);
      window.alert("Error posting to Facebook: " + (err.message || err));
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
        <CardTitle>Post to Facebook</CardTitle>
        <CardDescription>
          Create a new post or schedule it for later
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Message Field */}
            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-medium">
                Message
              </label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What's on your mind?"
                className="min-h-[120px]"
                required
              />
            </div>

            {/* Page Selector */}
            <div className="space-y-2">
              <label htmlFor="page" className="text-sm font-medium">
                Post to
              </label>
              <Select
                value={selectedPage}
                onValueChange={(value) => {
                  setSelectedPage(value);
                  const page = pages.find((p) => p.id === value);
                  if (page) setSelectedPageName(page.name);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a page" />
                </SelectTrigger>
                <SelectContent>
                  {pages.length === 0 ? (
                    <div className="p-2 text-muted-foreground text-sm">
                      Loading pages...
                    </div>
                  ) : (
                    pages.map((page) => (
                      <SelectItem key={page.id} value={page.id}>
                        {page.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Note: Due to Facebook API limitations, posting directly to
                personal timelines is not supported.
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
              !message ||
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
