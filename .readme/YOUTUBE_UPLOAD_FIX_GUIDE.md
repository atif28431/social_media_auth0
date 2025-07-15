# YouTube Upload Fix Guide

## Issues Fixed

### 1. **Core Architecture Problem**
- ❌ **Before**: Direct YouTube API calls from frontend (CORS issues)
- ✅ **After**: Server-side API route handles YouTube uploads

### 2. **Invalid Parameters**
- ❌ **Before**: `"tags": 0` (number instead of array)
- ✅ **After**: `tags: []` (proper array format)

### 3. **Missing Components**
- ✅ Added `/api/youtube/upload` route
- ✅ Added YouTube uploads database table
- ✅ Updated utility functions to use API routes

## Files Changed

### 1. **New API Route**: `/src/app/api/youtube/upload/route.js`
- Handles video upload to YouTube server-side
- Manages token refresh automatically
- Proper error handling and logging
- Stores upload records in database

### 2. **Updated**: `/src/utils/youtube.js`
- `uploadVideoToYoutube()` now calls API route instead of direct YouTube API
- `scheduleVideoForYoutube()` now calls API route
- Added `userId` parameter for authentication

### 3. **Updated**: `/src/components/YoutubePostForm.js`
- Passes `user.id` to upload functions
- Ensures tags are properly formatted as array

### 4. **New Database Table**: `youtube_uploads`
- Tracks uploaded videos
- Row Level Security enabled
- Proper indexing for performance

### 5. **Updated**: `.env.local.example`
- Added Google API credentials
- Added Supabase service role key

## Setup Instructions

### 1. **Environment Variables**
Add these to your `.env.local`:
```env
GOOGLE_CLIENT_ID='your-google-oauth-client-id'
GOOGLE_CLIENT_SECRET='your-google-oauth-client-secret'
SUPABASE_SERVICE_ROLE_KEY='your-supabase-service-role-key'
```

### 2. **Database Migration**
Run the SQL migration file:
```bash
# Apply the YouTube uploads table migration
psql -h your-supabase-host -U postgres -d postgres < youtube_uploads_migration.sql
```

### 3. **Google API Console Setup**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable YouTube Data API v3
3. Create OAuth 2.0 credentials
4. Add your domain to authorized origins
5. Add callback URL: `your-domain.com/api/auth/youtube-callback`

### 4. **Test the Fix**
1. Restart your Next.js server
2. Connect YouTube account in the app
3. Try uploading a test video
4. Check server logs for detailed debugging info

## Common Issues & Solutions

### Issue 1: "Failed to fetch video from URL"
**Cause**: Supabase storage URL is not accessible
**Solution**: 
- Check if the video was uploaded successfully to Supabase
- Verify storage bucket permissions
- Test the media URL directly in browser

### Issue 2: "YouTube access token is invalid"
**Cause**: Token expired or invalid
**Solution**: 
- Token refresh is now automatic
- If persist, disconnect and reconnect YouTube account
- Check Google API console for quota limits

### Issue 3: "CORS error"
**Cause**: Direct API calls from frontend (this is now fixed)
**Solution**: 
- Ensure you're using the updated code
- All YouTube API calls now go through `/api/youtube/upload`

### Issue 4: "User ID is required"
**Cause**: User context not properly passed
**Solution**: 
- Ensure user is logged in
- Check AuthContext provides `user.id`
- Verify session management

## Debugging

### Server Logs
The API route provides detailed logging:
```
🎬 Starting YouTube upload process...
📋 Upload parameters: { title, mediaUrl, etc. }
🔍 Fetching user YouTube tokens...
📥 Downloading video from URL...
☁️ Uploading to YouTube...
✅ YouTube upload successful
```

### Frontend Debugging
Check browser console for:
- Upload progress logs
- API response details
- Error messages with specific causes

### Database Debugging
Check these tables:
- `user_sessions` - YouTube tokens
- `uploaded_media` - Video file records
- `youtube_uploads` - Upload tracking
- `scheduled_posts` - Scheduled videos

## Testing Checklist

- [ ] Environment variables configured
- [ ] Database migration applied
- [ ] Google API credentials valid
- [ ] YouTube account connected
- [ ] Video file uploads to Supabase
- [ ] Video uploads to YouTube
- [ ] Scheduled uploads work
- [ ] Error handling works
- [ ] Token refresh works

## Next Steps

1. **Apply all the changes** from this guide
2. **Run the database migration**
3. **Update environment variables**
4. **Test with a small video file** first
5. **Monitor server logs** during testing
6. **Verify in YouTube Studio** that videos appear

The YouTube upload should now work without CORS issues and with proper error handling!