import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import Providers from '@/components/Providers';
import Navbar from '@/components/Navbar';

// Configure the Geist fonts with variable property for CSS variables

export const metadata = {
  title: 'Social Media Manager',
  description: 'Manage your social media posts in one place',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans">
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
