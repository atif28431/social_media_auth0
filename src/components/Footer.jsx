'use client';

import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Heart, Shield, FileText, Mail, ExternalLink } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 text-white flex items-center justify-center rounded-lg">
                <span className="font-bold text-sm">C</span>
              </div>
              <h3 className="font-bold text-lg">Corpnix</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Manage your social media presence effortlessly with our powerful scheduling and analytics platform.
            </p>
            <Badge variant="secondary" className="w-fit">
              Made with <Heart className="h-3 w-3 mx-1 text-red-500" /> in Mumbai
            </Badge>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/scheduled" className="text-muted-foreground hover:text-foreground transition-colors">
                  Scheduled Posts
                </Link>
              </li>
              <li>
                <Link href="/hashtags" className="text-muted-foreground hover:text-foreground transition-colors">
                  Hashtag Generator
                </Link>
              </li>
              <li>
                <Link href="/settings" className="text-muted-foreground hover:text-foreground transition-colors">
                  Settings
                </Link>
              </li>
            </ul>
          </div>

          {/* Platforms */}
          <div className="space-y-4">
            <h4 className="font-semibold">Supported Platforms</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/facebook" className="text-muted-foreground hover:text-foreground transition-colors">
                  Facebook
                </Link>
              </li>
              <li>
                <Link href="/instagram" className="text-muted-foreground hover:text-foreground transition-colors">
                  Instagram
                </Link>
              </li>
              <li>
                <Link href="/youtube" className="text-muted-foreground hover:text-foreground transition-colors">
                  YouTube
                </Link>
              </li>
              <li>
                <span className="text-muted-foreground">Twitter (Coming Soon)</span>
              </li>
            </ul>
          </div>

          {/* Contact & Legal */}
          <div className="space-y-4">
            <h4 className="font-semibold">Contact & Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a 
                  href="mailto:contact.ansari@gmail.com" 
                  className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <Mail className="h-3 w-3" />
                  Support
                </a>
              </li>
              <li>
                <Link 
                  href="/privacy" 
                  className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <Shield className="h-3 w-3" />
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link 
                  href="/terms" 
                  className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <FileText className="h-3 w-3" />
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="mb-6" />

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <p>&copy; {currentYear} Corpnix. All rights reserved.</p>
            <Badge variant="outline" className="text-xs">
              Version 1.0
            </Badge>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            <Link 
              href="/privacy" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <Link 
              href="/terms" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms
            </Link>
            <a 
              href="mailto:contact.ansari@gmail.com" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Contact
            </a>
          </div>
        </div>

        {/* Legal Notice */}
        <div className="mt-6 pt-4 border-t border-dashed">
          <p className="text-xs text-muted-foreground text-center">
            This service integrates with third-party platforms including Facebook, Instagram, YouTube, and Auth0. 
            Use of these platforms is subject to their respective terms of service and privacy policies.
          </p>
        </div>
      </div>
    </footer>
  );
}
