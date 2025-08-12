'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Instagram, Facebook, AlertCircle, ExternalLink, HelpCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function InstagramAuth() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState(null);

  const handleInstagramAuth = async (platform = 'facebook') => {
    try {
      setIsLoading(true);
      setError(null);
      setSelectedPlatform(platform);

      const response = await fetch('/api/instagram/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform }),
      });

      const data = await response.json();

      if (data.authUrl) {
        // Redirect to appropriate OAuth
        window.location.href = data.authUrl;
      } else {
        throw new Error(data.error || `Failed to initialize ${platform} authentication`);
      }
    } catch (error) {
      console.error(`${platform} auth error:`, error);
      setError(error.message || `Failed to connect ${platform} account`);
      setIsLoading(false);
      setSelectedPlatform(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-2xl">
              <Instagram className="h-8 w-8 mx-auto mb-2" />
              Connect Your Instagram Account
            </CardTitle>
            <CardDescription className="text-center text-base">
              Choose the authentication method that best fits your Instagram account type
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              {/* Instagram Login API */}
              <div className="border rounded-lg p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Instagram Login API</h3>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                    New
                  </Badge>
                </div>
                
                <p className="text-sm text-gray-600">
                  Direct Instagram authentication for personal and business accounts
                </p>

                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium mb-2">✅ Best for:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Personal Instagram accounts</li>
                      <li>• Basic media access</li>
                      <li>• Simpler setup process</li>
                      <li>• No Facebook required</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">⚠️ Requirements:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Valid Instagram account</li>
                      <li>• Instagram app registration</li>
                    </ul>
                  </div>
                </div>

                <Button
                  onClick={() => handleInstagramAuth('instagram')}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  size="lg"
                >
                  {isLoading && selectedPlatform === 'instagram' ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Instagram className="h-4 w-4 mr-2" />
                      Connect via Instagram
                    </>
                  )}
                </Button>
              </div>

              {/* Facebook Graph API */}
              <div className="border rounded-lg p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Facebook Graph API</h3>
                  <Badge variant="default" className="bg-blue-600">
                    Recommended
                  </Badge>
                </div>
                
                <p className="text-sm text-gray-600">
                  Facebook Business integration for Instagram Business accounts
                </p>

                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium mb-2">✅ Best for:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Instagram Business/Creator accounts</li>
                      <li>• Full media and insights access</li>
                      <li>• Advanced analytics</li>
                      <li>• Business features</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">⚠️ Requirements:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Instagram Business/Creator account</li>
                      <li>• Connected Facebook Page</li>
                      <li>• Business verification</li>
                    </ul>
                  </div>
                </div>

                <Button
                  onClick={() => handleInstagramAuth('facebook')}
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  {isLoading && selectedPlatform === 'facebook' ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Facebook className="h-4 w-4 mr-2" />
                      Connect via Facebook
                    </>
                  )}
                </Button>
              </div>
            </div>

            <Separator className="my-8" />

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <HelpCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium mb-2">Need help choosing?</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Not sure which option to choose? Here's a quick guide:
                  </p>
                  <div className="text-sm space-y-1">
                    <p><strong>Instagram Login API:</strong> Choose this if you have a personal Instagram account and want a simpler setup.</p>
                    <p><strong>Facebook Graph API:</strong> Choose this if you have an Instagram Business/Creator account and need full business features.</p>
                  </div>
                  <div className="mt-3">
                    <a
                      href="https://help.instagram.com/502981923235522"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline inline-flex items-center"
                    >
                      Learn more about Instagram account types
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}