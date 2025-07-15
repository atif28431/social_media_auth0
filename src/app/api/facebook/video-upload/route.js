import { NextResponse } from "next/server";

/**
 * This is a proxy API route to handle Facebook video uploads
 * It works around CORS issues by proxying requests from the client to Facebook's upload servers
 */
export async function POST(request) {
  try {
    console.log("📤 Starting Facebook video upload proxy...");
    console.log("🕐 Request received at:", new Date().toISOString());

    // Extract the upload URL and video blob from the request
    const { uploadUrl, videoBlob } = await request.json();
    
    console.log("📋 Request details:", {
      hasUploadUrl: !!uploadUrl,
      hasVideoBlob: !!videoBlob,
      uploadUrlDomain: uploadUrl ? new URL(uploadUrl).hostname : 'N/A'
    });

    // Validate the upload URL
    if (!uploadUrl) {
      console.error("❌ No upload URL provided");
      return NextResponse.json(
        { error: "Upload URL is required" },
        { status: 400 }
      );
    }

    if (!videoBlob) {
      console.error("❌ No video data provided");
      return NextResponse.json(
        { error: "Video data is required" },
        { status: 400 }
      );
    }

    // Check if the URL is a valid Facebook upload URL
    if (
      !uploadUrl.includes("facebook.com") &&
      !uploadUrl.includes("rupload.facebook.com")
    ) {
      console.error("❌ Invalid Facebook upload URL");
      return NextResponse.json(
        {
          success: false,
          error: "Invalid Facebook upload URL",
          error_type: "validation_error",
          error_message: "The provided URL is not a valid Facebook upload URL",
        },
        { status: 400 }
      );
    }

    console.log("🔗 Proxying to Facebook upload URL:", uploadUrl);

    // Convert the base64 string back to a blob
    let videoData;
    try {
      if (typeof videoBlob === "string") {
        // If it's a base64 string, remove the data URL prefix if present
        const base64Data = videoBlob.split(",")[1] || videoBlob;
        const binaryData = atob(base64Data);
        const byteArray = new Uint8Array(binaryData.length);
        for (let i = 0; i < binaryData.length; i++) {
          byteArray[i] = binaryData.charCodeAt(i);
        }
        videoData = new Blob([byteArray], { type: "video/mp4" });
      } else {
        videoData = new Blob([JSON.stringify(videoBlob)], {
          type: "video/mp4",
        });
      }

      console.log("📊 Video data prepared, size:", videoData.size, "bytes");
    } catch (error) {
      console.error("❌ Error processing video data:", error);
      return NextResponse.json(
        {
          success: false,
          error: `Failed to process video data: ${error.message}`,
          error_type: "data_processing_error",
          error_message: "Could not convert the provided video data",
        },
        { status: 400 }
      );
    }

    // Forward the request to Facebook with required headers
    let response;
    try {
      response = await fetch(uploadUrl, {
        method: "POST",
        body: videoData,
        headers: {
          "Content-Type": "application/octet-stream",
          offset: "0", // Required by Facebook API for initial upload
          file_size: videoData.size.toString(), // Required by Facebook API
        },
      });
    } catch (fetchError) {
      console.error("❌ Network error during Facebook upload:", fetchError);
      return NextResponse.json(
        {
          success: false,
          error: `Network error during upload: ${fetchError.message}`,
          error_type: "network_error",
          error_message: "Failed to connect to Facebook API",
        },
        { status: 502 }
      );
    }

    // Get the response status and data
    const status = response.status;
    let responseData;

    try {
      // Try to parse as JSON first
      responseData = await response.json();
    } catch (e) {
      // If not JSON, get as text
      try {
        responseData = await response.text();
      } catch (textError) {
        // If we can't get text either, just use status
        responseData = `Response could not be parsed (Status: ${status})`;
      }
    }

    console.log("📥 Facebook upload response status:", status);

    // Check for specific Facebook API errors
    if (!response.ok && typeof responseData === "object") {
      console.error("❌ Facebook API returned error:", {
        status,
        responseData,
        uploadUrl: uploadUrl ? new URL(uploadUrl).hostname + new URL(uploadUrl).pathname : 'N/A'
      });
      
      // Handle debug_info errors (common in Facebook API)
      if (responseData.debug_info) {
        const errorType = responseData.debug_info.type;
        const errorMessage = responseData.debug_info.message;
        console.error("📝 Debug info error:", { errorType, errorMessage });
        return NextResponse.json(
          {
            success: false,
            error: errorMessage,
            error_type: errorType,
            error_message: errorMessage,
          },
          { status }
        );
      }

      // Handle standard error format
      if (responseData.error) {
        console.error("📝 Standard error format:", responseData.error);
        return NextResponse.json(
          {
            success: false,
            error: responseData.error.message || "Unknown Facebook API error",
            error_type: "facebook_api_error",
            error_message: responseData.error.message,
            error_code: responseData.error.code,
            error_subcode: responseData.error.error_subcode
          },
          { status }
        );
      }
    }
    
    // Handle non-200 status without error object
    if (!response.ok) {
      console.error("❌ Facebook upload failed with status:", status, "Response:", responseData);
      return NextResponse.json(
        {
          success: false,
          error: `Facebook upload failed with status ${status}`,
          error_type: "http_error",
          error_message: typeof responseData === 'string' ? responseData : JSON.stringify(responseData),
          status_code: status
        },
        { status }
      );
    }

    // Success case - return the response from Facebook
    return NextResponse.json(
      typeof responseData === "object" ? responseData : { success: true },
      { status }
    );
  } catch (error) {
    console.error("❌ Unhandled error in video upload proxy:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        error_type: "server_error",
        error_message: "Internal server error during video upload",
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
