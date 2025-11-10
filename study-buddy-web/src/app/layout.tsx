import type { Metadata } from 'next';
import Script from 'next/script';
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
  title: 'Study Buddy | Your AI-Powered Study Assistant for Better Learning',
  description: 'Study Buddy is the ultimate AI-powered study assistant that helps students learn faster. Create smart notes, generate flashcards, get AI tutoring, and write better essays with Study Buddy. Join thousands of students using Study Buddy to ace their exams.',
  keywords: [
    'Study Buddy',
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
    'student tools',
    'Study Buddy app',
    'Study Buddy AI',
    'online study tool'
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
    title: 'Study Buddy | Your AI-Powered Study Assistant for Better Learning',
    description: 'Study Buddy is the ultimate AI-powered study assistant that helps students learn faster. Create smart notes, generate flashcards, get AI tutoring, and write better essays with Study Buddy. Join thousands of students using Study Buddy to ace their exams.',
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
        {/* Rewardful referral tracking */}
        <Script src="https://r.wdfl.co/rw.js" data-rewardful="a46615" strategy="afterInteractive" />
        <Script id="rewardful-queue" strategy="beforeInteractive">
          {`(function(w,r){w._rwq=r;w[r]=w[r]||function(){(w[r].q=w[r].q||[]).push(arguments)}})(window,'rewardful');`}
        </Script>
      </body>
    </html>
  );
}