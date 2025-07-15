'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// Loading component
function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <h1 className="text-2xl font-bold mb-2">Connecting YouTube Account</h1>
      <p className="text-muted-foreground text-center">
        Please wait while we connect your YouTube account...
      </p>
    </div>
  );
}

// Component that uses useSearchParams - must be wrapped in Suspense
function YoutubeCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Check if there's an error in the URL parameters
    const error = searchParams.get('error');
    
    if (error) {
      // If there's an error, redirect to the YouTube page with the error
      router.push(`/youtube?error=${encodeURIComponent(error)}`);
      return;
    }
    
    // Get the code and state from the URL parameters
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    
    if (code && state) {
      // Redirect to the API route to handle the token exchange
      // This ensures the server-side code is executed
      window.location.href = `/api/auth/youtube-callback?code=${code}&state=${state}`;
    } else {
      // If there's no code or state, redirect to the YouTube page with an error
      router.push('/youtube?error=Missing+authorization+code');
    }
  }, [router, searchParams]);
  
  return <LoadingSpinner />;
}

/**
 * This page handles the OAuth callback from YouTube
 * It's a simple loading page that redirects to the YouTube page
 * The actual token exchange happens in the API route
 */
export default function YoutubeCallbackPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <YoutubeCallbackContent />
    </Suspense>
  );
}