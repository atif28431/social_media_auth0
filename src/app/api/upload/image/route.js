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

    // Upload to Supabase Storage
    console.log('☁️ Uploading to Supabase Storage...');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('social-media-images')
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
      .from('social-media-images')
      .getPublicUrl(fileName);

    console.log('🌐 Public URL:', urlData.publicUrl);

    // Save media record to database
    console.log('💾 Saving record to database...');
    const { data: dbData, error: dbError } = await supabase
      .from('uploaded_images')
      .insert({
        user_id: userId,
        platform: platform,
        file_name: fileName,
        original_name: file.name,
        file_size: file.size,
        file_type: file.type,
        storage_path: uploadData.path,
        public_url: urlData.publicUrl,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) {
      console.error('❌ Database error:', dbError);
      // Try to clean up uploaded file
      console.log('🧹 Cleaning up uploaded file...');
      await supabase.storage.from('social-media-images').remove([fileName]);
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
        mediaType: detectedMediaType
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

// GET endpoint to retrieve user's uploaded images
export async function GET(request) {
  try {
    console.log('📥 Starting media fetch process...');
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const platform = searchParams.get('platform');

    console.log('📋 Fetch parameters:', { userId, platform });

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
      .from('uploaded_images')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (platform) {
      query = query.eq('platform', platform);
    }

    console.log('🔍 Executing database query...');
    const { data, error } = await query;

    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json({ 
        error: `Failed to fetch images: ${error.message}` 
      }, { status: 500 });
    }

    console.log('✅ Found', data?.length || 0, 'images');
    return NextResponse.json({ images: data || [] });

  } catch (error) {
    console.error('❌ Get images error:', error);
    console.error('Stack trace:', error.stack);
    return NextResponse.json({ 
      error: `Internal server error: ${error.message}` 
    }, { status: 500 });
  }
}

// DELETE endpoint to remove uploaded images
export async function DELETE(request) {
  try {
    console.log('🗑️ Starting media deletion process...');
    
    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('imageId');
    const userId = searchParams.get('userId');

    console.log('📋 Delete parameters:', { imageId, userId });

    if (!imageId || !userId) {
      console.error('❌ Missing required parameters');
      return NextResponse.json({ error: 'Image ID and User ID required' }, { status: 400 });
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

    // Get image record
    console.log('🔍 Fetching image record...');
    const { data: imageData, error: fetchError } = await supabase
      .from('uploaded_images')
      .select('*')
      .eq('id', imageId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !imageData) {
      console.error('❌ Image not found:', fetchError);
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    console.log('✅ Image record found:', imageData.file_name);

    // Delete from storage
    console.log('🗑️ Deleting from storage...');
    const { error: storageError } = await supabase.storage
      .from('social-media-images')
      .remove([imageData.file_name]);

    if (storageError) {
      console.error('⚠️ Storage deletion error:', storageError);
    }

    // Delete from database
    console.log('🗑️ Deleting from database...');
    const { error: dbError } = await supabase
      .from('uploaded_images')
      .delete()
      .eq('id', imageId)
      .eq('user_id', userId);

    if (dbError) {
      console.error('❌ Database deletion error:', dbError);
      return NextResponse.json({ 
        error: `Failed to delete image record: ${dbError.message}` 
      }, { status: 500 });
    }

    console.log('✅ Image deleted successfully');
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Delete image error:', error);
    console.error('Stack trace:', error.stack);
    return NextResponse.json({ 
      error: `Internal server error: ${error.message}` 
    }, { status: 500 });
  }
}