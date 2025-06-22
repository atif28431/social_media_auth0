'use client';


import { AuthProvider } from '@/context/AuthContext';
import { SupabaseProvider } from '@/context/SupabaseContext';
import { Toaster } from '@/components/ui/sonner';

export default function Providers({ children }) {
  return (
      <AuthProvider>
        <SupabaseProvider>
          {children}
          <Toaster position="top-right" />
        </SupabaseProvider>
      </AuthProvider>
  );
}