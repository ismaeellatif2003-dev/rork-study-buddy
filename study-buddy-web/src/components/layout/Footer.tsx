'use client';

import { Apple, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function Footer() {
  const handleDownloadApp = () => {
    window.open('https://apps.apple.com/gb/app/study-buddy-ai-powered-study/id6751440799', '_blank');
  };

  return (
    <footer className="bg-gray-900 dark:bg-gray-950 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8">
          {/* App Download Section */}
          <div className="md:col-span-1">
            <h3 className="text-lg font-semibold mb-4">Download Study Buddy</h3>
            <p className="text-gray-300 mb-4">
              Get the full Study Buddy experience on your iPhone and iPad. 
              Study anywhere, anytime with our mobile app.
            </p>
            <Button
              onClick={handleDownloadApp}
              className="bg-black text-white hover:bg-gray-800 border border-gray-700 flex items-center gap-2"
            >
              <Apple size={20} />
              <div className="flex flex-col items-start">
                <span className="text-xs">Download on the</span>
                <span className="text-sm font-semibold">App Store</span>
              </div>
            </Button>
          </div>

          {/* Features Section */}
          <div className="md:col-span-1">
            <h3 className="text-lg font-semibold mb-4">Features</h3>
            <ul className="space-y-2 text-gray-300">
              <li>AI-Powered Flashcards</li>
              <li>Smart Note Summaries</li>
              <li>Essay Writer with Citations</li>
              <li>AI Study Assistant</li>
              <li>Cross-Platform Sync</li>
            </ul>
          </div>

          {/* Support Section */}
          <div className="md:col-span-1">
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-gray-300">
              <li>
                <a 
                  href="https://docs.google.com/document/d/1o64VHYtmX93NPF9Ty4VqAvFNxPvzaE17b9L2AgKaMVc/edit?usp=sharing" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a 
                  href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Terms of Service
                </a>
              </li>
              <li>App Support</li>
              <li>Contact Us</li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2025 Study Buddy. All rights reserved.
            </div>
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <span>Made with</span>
              <span className="text-red-500">♥</span>
              <span>for students worldwide</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
