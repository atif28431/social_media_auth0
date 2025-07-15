import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request) {
  try {
    console.log('🎬 Starting YouTube upload process...');
    
    const body = await request.json();
    const { 
      title, 
      description, 
      mediaUrl, 
      tags = [], 
      categoryId = "22", 
      privacyStatus = "public",
      scheduledPublishTime = null,
      userId 
    } = body;

    console.log('📋 Upload parameters:', {
      title,
      description: description ? description.substring(0, 50) + "..." : "(empty)",
      mediaUrl: mediaUrl ? "provided" : "missing",
      tags: Array.isArray(tags) ? tags.length : "invalid",
      categoryId,
      privacyStatus,
      scheduledPublishTime,
      userId
    });

    // Validate required fields
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (!mediaUrl) {
      return NextResponse.json({ error: 'Media URL is required' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Ensure tags is an array
    const videoTags = Array.isArray(tags) ? tags : [];

    // Get user's YouTube access token from database
    console.log('🔍 Fetching user YouTube tokens...');
    const supabase = createAdminClient();
    
    const { data: sessionData, error: sessionError } = await supabase
      .from('user_sessions')
      .select('youtube_access_token, youtube_refresh_token, youtube_token_expires_at')
      .eq('user_id', userId)
      .single();

    if (sessionError || !sessionData?.youtube_access_token) {
      console.error('❌ No YouTube tokens found:', sessionError);
      return NextResponse.json({ 
        error: 'YouTube account not connected. Please connect your YouTube account first.' 
      }, { status: 401 });
    }

    let accessToken = sessionData.youtube_access_token;
    const refreshToken = sessionData.youtube_refresh_token;
    const expiresAt = new Date(sessionData.youtube_token_expires_at);

    // Check if token is expired and refresh if needed
    if (expiresAt <= new Date()) {
      console.log('🔄 Access token expired, refreshing...');
      
      if (!refreshToken) {
        return NextResponse.json({ 
          error: 'YouTube access token expired and no refresh token available. Please reconnect your account.' 
        }, { status: 401 });
      }

      try {
        const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        });

        if (!refreshResponse.ok) {
          const errorData = await refreshResponse.json();
          console.error('❌ Token refresh failed:', errorData);
          return NextResponse.json({ 
            error: 'Failed to refresh YouTube access token. Please reconnect your account.' 
          }, { status: 401 });
        }

        const refreshData = await refreshResponse.json();
        accessToken = refreshData.access_token;
        
        // Update the token in database
        const newExpiresAt = new Date(Date.now() + refreshData.expires_in * 1000).toISOString();
        
        await supabase
          .from('user_sessions')
          .update({
            youtube_access_token: accessToken,
            youtube_token_expires_at: newExpiresAt,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        console.log('✅ Token refreshed successfully');
      } catch (refreshError) {
        console.error('❌ Error refreshing token:', refreshError);
        return NextResponse.json({ 
          error: 'Failed to refresh access token. Please reconnect your account.' 
        }, { status: 401 });
      }
    }

    // Download the video from mediaUrl
    console.log('📥 Downloading video from URL:', mediaUrl);
    const videoResponse = await fetch(mediaUrl);
    
    if (!videoResponse.ok) {
      console.error('❌ Failed to fetch video:', videoResponse.status, videoResponse.statusText);
      return NextResponse.json({ 
        error: `Failed to fetch video from URL: ${videoResponse.status} ${videoResponse.statusText}` 
      }, { status: 400 });
    }

    const videoBlob = await videoResponse.blob();
    console.log('✅ Video downloaded, size:', videoBlob.size, 'bytes');

    // Create FormData for YouTube upload
    const formData = new FormData();
    
    // Prepare metadata
    const metadata = {
      snippet: {
        title,
        description: description || '',
        tags: videoTags,
        categoryId,
      },
      status: {
        privacyStatus: scheduledPublishTime ? 'private' : privacyStatus,
        selfDeclaredMadeForKids: false,
      },
    };

    // Add scheduled publish time if provided
    if (scheduledPublishTime) {
      metadata.status.publishAt = new Date(scheduledPublishTime).toISOString();
    }

    console.log('📝 Video metadata:', metadata);

    // Add metadata and video to form data
    const metadataBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
    formData.append('metadata', metadataBlob, 'metadata.json');
    formData.append('video', videoBlob, 'video.mp4');

    // Upload to YouTube
    console.log('☁️ Uploading to YouTube...');
    const uploadResponse = await fetch(
      'https://www.googleapis.com/upload/youtube/v3/videos?part=snippet,status&uploadType=multipart',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      }
    );

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      console.error('❌ YouTube upload failed:', errorData);
      
      // Handle specific YouTube API errors
      if (errorData.error?.code === 401) {
        return NextResponse.json({ 
          error: 'YouTube access token is invalid. Please reconnect your account.' 
        }, { status: 401 });
      }
      
      if (errorData.error?.code === 403) {
        return NextResponse.json({ 
          error: 'YouTube API quota exceeded or access denied. Please try again later.' 
        }, { status: 403 });
      }

      return NextResponse.json({ 
        error: `YouTube upload failed: ${errorData.error?.message || 'Unknown error'}` 
      }, { status: 400 });
    }

    const uploadData = await uploadResponse.json();
    console.log('✅ YouTube upload successful:', {
      videoId: uploadData.id,
      title: uploadData.snippet?.title,
      status: uploadData.status?.uploadStatus
    });

    // Optionally store the upload record in your database
    try {
      await supabase
        .from('youtube_uploads')
        .insert({
          user_id: userId,
          video_id: uploadData.id,
          title: uploadData.snippet?.title,
          description: uploadData.snippet?.description,
          tags: uploadData.snippet?.tags?.join(',') || '',
          category_id: uploadData.snippet?.categoryId,
          privacy_status: uploadData.status?.privacyStatus,
          upload_status: uploadData.status?.uploadStatus,
          scheduled_publish_time: scheduledPublishTime,
          created_at: new Date().toISOString(),
        });
      console.log('✅ Upload record saved to database');
    } catch (dbError) {
      console.error('⚠️ Failed to save upload record (continuing anyway):', dbError);
    }

    return NextResponse.json({
      success: true,
      video: {
        id: uploadData.id,
        title: uploadData.snippet?.title,
        description: uploadData.snippet?.description,
        tags: uploadData.snippet?.tags || [],
        categoryId: uploadData.snippet?.categoryId,
        privacyStatus: uploadData.status?.privacyStatus,
        uploadStatus: uploadData.status?.uploadStatus,
        publishAt: uploadData.status?.publishAt,
        thumbnails: uploadData.snippet?.thumbnails,
      }
    });

  } catch (error) {
    console.error('❌ YouTube upload error:', error);
    console.error('Stack trace:', error.stack);
    return NextResponse.json({ 
      error: `Internal server error: ${error.message}` 
    }, { status: 500 });
  }
}