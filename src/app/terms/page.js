'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Mail, Phone, MapPin, AlertTriangle, CheckCircle } from 'lucide-react';

export default function TermsAndConditions() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <FileText className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight">Terms and Conditions</h1>
          </div>
          <Badge variant="secondary" className="text-sm">
            Last Updated: July 16, 2025
          </Badge>
          
          <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              <strong>Acceptance of Terms:</strong> By accessing and using Corpnix services, you accept and agree to be bound by the terms and provision of this agreement.
            </AlertDescription>
          </Alert>
        </div>

        {/* Definitions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">1. Definitions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground mb-4">In these Terms and Conditions:</p>
            <div className="grid gap-4">
              <div className="flex gap-3">
                <Badge variant="outline" className="whitespace-nowrap">Company</Badge>
                <span className="text-muted-foreground">refers to Corpnix</span>
              </div>
              <div className="flex gap-3">
                <Badge variant="outline" className="whitespace-nowrap">Service</Badge>
                <span className="text-muted-foreground">refers to the services provided by Corpnix</span>
              </div>
              <div className="flex gap-3">
                <Badge variant="outline" className="whitespace-nowrap">User</Badge>
                <span className="text-muted-foreground">refers to anyone who accesses or uses our services</span>
              </div>
              <div className="flex gap-3">
                <Badge variant="outline" className="whitespace-nowrap">Content</Badge>
                <span className="text-muted-foreground">refers to all information, data, text, software, graphics, or other materials</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Use of Services */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">2. Use of Services</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Permitted Use</h3>
              <p className="text-muted-foreground">
                You may use our services for lawful purposes only. You agree to use the services in compliance with all applicable laws and regulations.
              </p>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-lg font-semibold mb-3">Prohibited Activities</h3>
              <p className="text-muted-foreground mb-3">You agree not to:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Use the services for any illegal or unauthorized purpose</li>
                <li>Violate any laws in your jurisdiction</li>
                <li>Transmit worms, viruses, or any code of a destructive nature</li>
                <li>Interfere with or disrupt the services or servers</li>
                <li>Collect or store personal data about other users</li>
                <li>Impersonate any person or entity</li>
                <li>Engage in any form of automated data collection</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* User Accounts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">3. User Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              To access certain features of our services, you may be required to create an account. You agree to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Provide accurate and complete information</li>
              <li>Keep your account information updated</li>
              <li>Maintain the security of your account credentials</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Notify us immediately of any unauthorized use</li>
            </ul>
          </CardContent>
        </Card>

        {/* Third-Party Services */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">4. Third-Party Services</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground mb-4">
              Our services may integrate with third-party services including:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Badge variant="outline">Google Services</Badge>
              <Badge variant="outline">Facebook</Badge>
              <Badge variant="outline">Instagram</Badge>
              <Badge variant="outline">YouTube</Badge>
              <Badge variant="outline">Auth0</Badge>
            </div>
            
            <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                <strong>Important:</strong> Your use of third-party services is subject to their respective terms of service and privacy policies. We are not responsible for the content, policies, or practices of third-party services.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Intellectual Property */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">5. Intellectual Property</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Our Content</h3>
              <p className="text-muted-foreground">
                All content, features, and functionality of our services are owned by Corpnix and are protected by copyright, trademark, and other intellectual property laws.
              </p>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-lg font-semibold mb-3">User Content</h3>
              <p className="text-muted-foreground">
                You retain ownership of content you submit to our services. However, by submitting content, you grant us a non-exclusive, worldwide, royalty-free license to use, modify, and distribute such content in connection with our services.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Disclaimers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">6. Disclaimers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Our services are provided &quot;as is&quot; and &quot;as available&quot; without any warranties of any kind, either express or implied. We do not warrant that:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>The services will be uninterrupted or error-free</li>
              <li>The services will meet your specific requirements</li>
              <li>Any information obtained will be accurate or reliable</li>
              <li>Defects will be corrected</li>
            </ul>
          </CardContent>
        </Card>

        {/* Limitation of Liability */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">7. Limitation of Liability</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              To the maximum extent permitted by law, Corpnix shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly.
            </p>
          </CardContent>
        </Card>

        {/* Termination */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">8. Termination</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              We may terminate or suspend your account and access to our services immediately, without prior notice, for any reason, including breach of these terms.
            </p>
            <div>
              <h3 className="text-lg font-semibold mb-3">Upon termination:</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Your right to use the services will cease immediately</li>
                <li>We may delete your account and data</li>
                <li>You remain liable for all obligations incurred prior to termination</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Modifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">9. Modifications to Terms</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. Your continued use of our services constitutes acceptance of the modified terms.
            </p>
          </CardContent>
        </Card>

        {/* Governing Law */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">10. Governing Law and Jurisdiction</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              These terms are governed by the laws of India. Any disputes arising from these terms will be subject to the exclusive jurisdiction of the courts in Mumbai, India.
            </p>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Mail className="h-6 w-6 text-primary" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              If you have any questions about these Terms and Conditions, please contact us:
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">contact.ansari@gmail.com</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Phone className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">+91 9820313746</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Location</p>
                  <p className="text-sm text-muted-foreground">Mumbai, India</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Final Agreement */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
              <p className="text-lg font-semibold text-primary">
                By using our services, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
