import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Navigation } from '@/components/layout/Navigation';
import { HomeButton } from '@/components/layout/HomeButton';
import Footer from '@/components/layout/Footer';
import { Providers } from '@/components/providers/Providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Study Buddy - AI-Powered Study Assistant',
  description: 'Create notes, generate flashcards, and get AI help with your studies',
  icons: {
    icon: '/icon.png',
    shortcut: '/favicon.ico',
    apple: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
            <main className="flex-1 pb-20">
              {children}
            </main>
            <Footer />
            <Navigation />
            <HomeButton />
          </div>
        </Providers>
      </body>
    </html>
  );
}