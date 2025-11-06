import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Navigation } from '@/components/layout/Navigation';
import { HomeButton } from '@/components/layout/HomeButton';
import Footer from '@/components/layout/Footer';
import { Providers } from '@/components/providers/Providers';

const inter = Inter({ subsets: ['latin'] });

// Update this with your actual website URL
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com';

export const metadata: Metadata = {
  title: 'Study Buddy - AI-Powered Study Assistant',
  description: 'Create notes, generate flashcards, and get AI help with your studies. Study Buddy helps you learn faster with AI-powered summaries, personalized chat, and smart flashcards.',
  keywords: [
    'study assistant',
    'AI learning',
    'flashcards',
    'study notes',
    'education',
    'learning tool',
    'AI tutor',
    'study app',
    'note taking',
    'study help',
    'AI study companion',
    'flashcard generator',
    'study organizer',
    'academic assistant',
    'learning platform',
    'study planner',
    'AI-powered learning',
    'study aid',
    'educational technology',
    'student tools'
  ],
  authors: [{ name: 'Study Buddy' }],
  creator: 'Study Buddy',
  publisher: 'Study Buddy',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'Study Buddy',
    title: 'Study Buddy - AI-Powered Study Assistant',
    description: 'Create notes, generate flashcards, and get AI help with your studies. Study Buddy helps you learn faster with AI-powered summaries, personalized chat, and smart flashcards.',
    images: [
      {
        url: `${siteUrl}/icon.png`,
        width: 1024,
        height: 1024,
        alt: 'Study Buddy Logo',
      },
    ],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png', sizes: '32x32' },
    ],
    apple: '/icon.png',
  },
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: siteUrl,
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#111827' },
  ],
  category: 'education',
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