"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function InstagramCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [accountInfo, setAccountInfo] = useState(null);
  const [platform, setPlatform] = useState('facebook');
  const { user } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      if (!user?.id) {
        console.warn("User not authenticated, redirecting to login...");
        router.push('/auth/login');
        return;
      }
      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        const platformParam = searchParams.get('platform') || 'facebook';
        
        setPlatform(platformParam);

        if (error) {
          setStatus('error');
          setError(errorDescription || error);
          return;
        }

        if (!code) {
          setStatus('error');
          setError('No authorization code received');
          return;
        }

        console.log(`Received ${platformParam} callback with code:`, code);

        
        
        const response = await fetch('/api/instagram/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            code,
            user_id: user.id,
            redirect_uri: window.location.origin + '/instagram-callback',
            platform: platformParam
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to exchange token');
        }

        // Store tokens
        localStorage.setItem(`${platformParam}_access_token`, data.access_token);
        localStorage.setItem(`${platformParam}_account_id`, data.instagram_account?.id || data.instagram_account?.user_id);
        localStorage.setItem(`${platformParam}_username`, data.instagram_account?.username);
        localStorage.setItem(`${platformParam}_token_expires`, Date.now() + (data.expires_in * 1000));
        localStorage.setItem('connected_platform', platformParam);

        setAccountInfo(data.instagram_account);
        setStatus('success');

        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);

      } catch (error) {
        console.error('Callback error:', error);
        setStatus('error');
        setError(error.message || 'Failed to connect account');
      }
    };

    const shouldRun = searchParams.get('code') && user?.id;
  if (shouldRun) {
    handleCallback();
  }
}, [searchParams, router, user?.id]);

  const handleRetry = () => {
    router.push('/auth/instagram');
  };

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  const getPlatformName = () => {
    return platform === 'instagram' ? 'Instagram' : 'Facebook';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {getPlatformName()} Account Connection
          </CardTitle>
          <CardDescription className="text-center">
            {status === 'loading' && `Processing your ${getPlatformName()} connection...`}
            {status === 'success' && 'Successfully connected!'}
            {status === 'error' && 'Connection Failed'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'loading' && (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-sm text-gray-600 text-center">
                Please wait while we connect your {getPlatformName()} account...
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center space-y-4">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
              <div className="text-center">
                <h3 className="font-semibold text-lg">Connected Successfully!</h3>
                <p className="text-sm text-gray-600 mt-2">
                  Your account <strong>@{accountInfo?.username}</strong> has been connected.
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Redirecting to dashboard...
                </p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center space-y-4">
              <AlertCircle className="h-12 w-12 text-red-600" />
              <div className="text-center">
                <h3 className="font-semibold text-lg text-red-600">Connection Failed</h3>
                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {error || `An unexpected error occurred while connecting your ${getPlatformName()} account.`}
                  </AlertDescription>
                </Alert>
              </div>
              <div className="flex space-x-3 mt-4">
                <Button onClick={handleRetry} variant="outline">
                  Try Again
                </Button>
                <Button onClick={handleGoToDashboard} variant="default">
                  Go to Dashboard
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
