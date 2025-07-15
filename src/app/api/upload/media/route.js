import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Supported file types
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/mpeg', 'video/webm'];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB limit for videos

export async function POST(request) {
  try {
    console.log('📤 Starting media upload process...');
    
    // Check environment variables
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing environment variables:', {
        supabaseUrl: !!supabaseUrl,
        supabaseServiceKey: !!supabaseServiceKey
      });
      return NextResponse.json({ 
        error: 'Server configuration error: Missing Supabase credentials' 
      }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const userId = formData.get('userId');
    const platform = formData.get('platform') || 'facebook';
    const mediaType = formData.get('mediaType') || 'image';

    console.log('📋 Upload parameters:', {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      userId,
      platform,
      mediaType
    });

    if (!file) {
      console.error('❌ No file provided');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!userId) {
      console.error('❌ No user ID provided');
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Validate file type
    const isImage = SUPPORTED_IMAGE_TYPES.includes(file.type);
    const isVideo = SUPPORTED_VIDEO_TYPES.includes(file.type);
    
    if (!isImage && !isVideo) {
      console.error('❌ Unsupported file type:', file.type);
      return NextResponse.json({ 
        error: 'Unsupported file type. Please upload an image (JPEG, PNG, GIF, WebP) or video (MP4, MOV, MPEG, WebM)' 
      }, { status: 400 });
    }

    // Validate file size (100MB limit for videos, 10MB for images)
    const maxSize = isVideo ? MAX_FILE_SIZE : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      console.error('❌ File too large:', file.size, 'bytes, max:', maxSize);
      return NextResponse.json({ 
        error: `File size must be less than ${isVideo ? '100MB' : '10MB'}` 
      }, { status: 400 });
    }

    // Create Supabase client
    console.log('🔧 Creating Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Sanitize user ID for file path (remove invalid characters)
    const sanitizedUserId = userId.replace(/[^a-zA-Z0-9-_]/g, '_');
    
    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const detectedMediaType = isVideo ? 'video' : 'image';
    const fileName = `${sanitizedUserId}/${platform}/${detectedMediaType}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    console.log('📁 Generated filename:', fileName);

    // Convert file to buffer
    console.log('🔄 Converting file to buffer...');
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Determine the correct storage bucket based on media type
    const storageBucket = isVideo ? 'facebook-videos' : 'social-media-images';
    console.log('🗄️ Using storage bucket:', storageBucket);

    // Upload to Supabase Storage
    console.log('☁️ Uploading to Supabase Storage...');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(storageBucket)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Upload error:', uploadError);
      return NextResponse.json({ 
        error: `Failed to upload file: ${uploadError.message}` 
      }, { status: 500 });
    }

    console.log('✅ Upload successful:', uploadData);

    // Get public URL
    console.log('🔗 Getting public URL...');
    const { data: urlData } = supabase.storage
      .from(storageBucket)
      .getPublicUrl(fileName);

    console.log('🌐 Public URL:', urlData.publicUrl);

    // Save media record to database
    console.log('💾 Saving record to database...');
    const { data: dbData, error: dbError } = await supabase
      .from('uploaded_media')
      .insert({
        user_id: userId,
        platform: platform,
        file_name: fileName,
        original_name: file.name,
        file_size: file.size,
        file_type: file.type,
        media_type: mediaType,
        storage_path: uploadData.path,
        storage_bucket: storageBucket,
        public_url: urlData.publicUrl,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) {
      console.error('❌ Database error:', dbError);
      // Try to clean up uploaded file
      console.log('🧹 Cleaning up uploaded file...');
      await supabase.storage.from(storageBucket).remove([fileName]);
      return NextResponse.json({ 
        error: `Failed to save media record: ${dbError.message}` 
      }, { status: 500 });
    }

    console.log('✅ Database record saved:', dbData);

    const response = {
      success: true,
      media: {
        id: dbData.id,
        fileName: fileName,
        originalName: file.name,
        publicUrl: urlData.publicUrl,
        public_url: urlData.publicUrl, // Add this for backward compatibility
        fileSize: file.size,
        fileType: file.type,
        mediaType: mediaType
      }
    };

    console.log('🎉 Upload complete, returning response:', response);
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Media upload error:', error);
    console.error('Stack trace:', error.stack);
    return NextResponse.json({ 
      error: `Internal server error: ${error.message}` 
    }, { status: 500 });
  }
}

// GET endpoint to retrieve user's uploaded media
export async function GET(request) {
  try {
    console.log('📥 Starting media fetch process...');
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const platform = searchParams.get('platform');
    const mediaType = searchParams.get('mediaType');

    console.log('📋 Fetch parameters:', { userId, platform, mediaType });

    if (!userId) {
      console.error('❌ No user ID provided');
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Check environment variables
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing environment variables');
      return NextResponse.json({ 
        error: 'Server configuration error: Missing Supabase credentials' 
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    let query = supabase
      .from('uploaded_media')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (platform) {
      query = query.eq('platform', platform);
    }

    if (mediaType) {
      query = query.eq('media_type', mediaType);
    }

    console.log('🔍 Executing database query...');
    const { data, error } = await query;

    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json({ 
        error: `Failed to fetch media: ${error.message}` 
      }, { status: 500 });
    }

    console.log('✅ Found', data?.length || 0, 'media items');
    return NextResponse.json({ media: data || [] });

  } catch (error) {
    console.error('❌ Get media error:', error);
    console.error('Stack trace:', error.stack);
    return NextResponse.json({ 
      error: `Internal server error: ${error.message}` 
    }, { status: 500 });
  }
}

// DELETE endpoint to remove uploaded media
export async function DELETE(request) {
  try {
    console.log('🗑️ Starting media deletion process...');
    
    const { searchParams } = new URL(request.url);
    const mediaId = searchParams.get('mediaId');
    const userId = searchParams.get('userId');

    console.log('📋 Delete parameters:', { mediaId, userId });

    if (!mediaId || !userId) {
      console.error('❌ Missing required parameters');
      return NextResponse.json({ error: 'Media ID and User ID required' }, { status: 400 });
    }

    // Check environment variables
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing environment variables');
      return NextResponse.json({ 
        error: 'Server configuration error: Missing Supabase credentials' 
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get media record
    console.log('🔍 Fetching media record...');
    const { data: mediaData, error: fetchError } = await supabase
      .from('uploaded_media')
      .select('*')
      .eq('id', mediaId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !mediaData) {
      console.error('❌ Media not found:', fetchError);
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    console.log('✅ Media record found:', mediaData.file_name);

    // Determine the correct storage bucket
    const storageBucket = mediaData.storage_bucket || 
                         (mediaData.file_type.startsWith('video/') ? 'facebook-videos' : 'social-media-images');

    // Delete from storage
    console.log('🗑️ Deleting from storage bucket:', storageBucket);
    const { error: storageError } = await supabase.storage
      .from(storageBucket)
      .remove([mediaData.file_name]);

    if (storageError) {
      console.error('⚠️ Storage deletion error:', storageError);
    }

    // Delete from database
    console.log('🗑️ Deleting from database...');
    const { error: dbError } = await supabase
      .from('uploaded_media')
      .delete()
      .eq('id', mediaId)
      .eq('user_id', userId);

    if (dbError) {
      console.error('❌ Database deletion error:', dbError);
      return NextResponse.json({ 
        error: `Failed to delete media record: ${dbError.message}` 
      }, { status: 500 });
    }

    console.log('✅ Media deleted successfully');
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Delete media error:', error);
    console.error('Stack trace:', error.stack);
    return NextResponse.json({ 
      error: `Internal server error: ${error.message}` 
    }, { status: 500 });
  }
}