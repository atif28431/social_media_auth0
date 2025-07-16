import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import Providers from '@/components/Providers';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Auth0Provider } from '@auth0/nextjs-auth0';
import { ThemeProvider } from '@/components/theme-provider';

// Configure the Geist fonts with variable property for CSS variables

export const metadata = {
  title: 'Social Media Manager',
  description: 'Manage your social media posts in one place',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <body className="font-sans ">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Auth0Provider>
            <Providers>
              <SidebarProvider>
                <div className="min-h-screen flex w-full">
                  <Sidebar />
                  <div className="flex-1 flex flex-col overflow-hidden w-full">
                    <Header />
                    <main className="flex-1 overflow-auto w-full">
                      {children}
                    </main>
                    <Footer />
                  </div>
                </div>
              </SidebarProvider>
            </Providers>
          </Auth0Provider>
        </ThemeProvider>
      </body>
    </html>
  );
}