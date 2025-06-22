'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If user is already authenticated, redirect to dashboard
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleLogin = () => {
    login();
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to access your social media dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Button 
              onClick={handleLogin} 
              className="w-full"
            >
              Sign in with Auth0
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-muted-foreground">
          <p>Secure authentication powered by Auth0</p>
        </CardFooter>
      </Card>
    </div>
  );
}