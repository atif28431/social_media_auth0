'use client';

import Link from 'next/link';
import { Facebook, Twitter, Instagram, Linkedin, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-4 bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-5xl mx-auto text-center space-y-10">
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
            Manage Your Social Media <span className="text-primary">Effortlessly</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Connect your accounts and schedule posts across multiple platforms from one dashboard.
          </p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-4 py-4">
          <Button asChild size="lg" className="gap-2">
            <Link href="/dashboard">
              Go to Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
          <Card className="bg-background/60 backdrop-blur-sm border-primary/20">
            <CardContent className="flex flex-col items-center justify-center p-6 h-full">
              <Facebook className="h-10 w-10 text-[#1877F2] mb-4" />
              <h3 className="text-lg font-medium">Facebook</h3>
              <p className="text-sm text-muted-foreground text-center mt-2">
                Schedule posts to your pages and groups
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-background/60 backdrop-blur-sm border-primary/20">
            <CardContent className="flex flex-col items-center justify-center p-6 h-full">
              <Twitter className="h-10 w-10 text-[#1DA1F2] mb-4" />
              <h3 className="text-lg font-medium">Twitter</h3>
              <p className="text-sm text-muted-foreground text-center mt-2">
                Coming soon
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-background/60 backdrop-blur-sm border-primary/20">
            <CardContent className="flex flex-col items-center justify-center p-6 h-full">
              <Instagram className="h-10 w-10 text-[#E4405F] mb-4" />
              <h3 className="text-lg font-medium">Instagram</h3>
              <p className="text-sm text-muted-foreground text-center mt-2">
                Coming soon
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-background/60 backdrop-blur-sm border-primary/20">
            <CardContent className="flex flex-col items-center justify-center p-6 h-full">
              <Linkedin className="h-10 w-10 text-[#0A66C2] mb-4" />
              <h3 className="text-lg font-medium">LinkedIn</h3>
              <p className="text-sm text-muted-foreground text-center mt-2">
                Coming soon
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
