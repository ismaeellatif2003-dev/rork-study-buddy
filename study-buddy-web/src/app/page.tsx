'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Zap, MessageCircle, FileText, ArrowRight, Sparkles, Users, Star, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { mockNotes, mockFlashcards, mockChatMessages, mockEssays } from '@/data/mockData';
import { GoogleSignIn } from '@/components/auth/GoogleSignIn';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function HomePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [userStats, setUserStats] = useState({
    notes: 0,
    flashcards: 0,
    messages: 0,
    essays: 0,
  });
  const [userName, setUserName] = useState('John Doe');

  // Load user stats from localStorage (simulating cross-platform sync)
  useEffect(() => {
    const loadUserStats = () => {
      const savedStats = localStorage.getItem('studyBuddyUserStats');
      const savedName = localStorage.getItem('studyBuddyUserName');
      
      if (savedStats) {
        setUserStats(JSON.parse(savedStats));
      } else {
        // Initialize with mock data for demo
        const initialStats = {
          notes: mockNotes.length,
          flashcards: mockFlashcards.length,
          messages: mockChatMessages.length,
          essays: mockEssays.length,
        };
        setUserStats(initialStats);
        localStorage.setItem('studyBuddyUserStats', JSON.stringify(initialStats));
      }
      
      if (savedName) {
        setUserName(savedName);
      }
    };

    loadUserStats();

    // Listen for custom events (real-time updates)
    const handleStatsUpdate = (e: CustomEvent) => {
      setUserStats(e.detail);
    };

    const handleNameUpdate = (e: CustomEvent) => {
      setUserName(e.detail);
    };

    window.addEventListener('userStatsUpdated', handleStatsUpdate as EventListener);
    window.addEventListener('userNameUpdated', handleNameUpdate as EventListener);

    return () => {
      window.removeEventListener('userStatsUpdated', handleStatsUpdate as EventListener);
      window.removeEventListener('userNameUpdated', handleNameUpdate as EventListener);
    };
  }, []);

  const features = [
    {
      icon: BookOpen,
      title: 'Smart Notes',
      description: 'Create and organize your study notes with AI-powered summaries',
      color: 'bg-blue-100 text-blue-600',
    },
    {
      icon: Zap,
      title: 'Flashcards',
      description: 'Generate flashcards from your notes and study with spaced repetition',
      color: 'bg-yellow-100 text-yellow-600',
    },
    {
      icon: MessageCircle,
      title: 'AI Chat',
      description: 'Get instant help from our AI study assistant',
      color: 'bg-green-100 text-green-600',
    },
    {
      icon: FileText,
      title: 'Essay Writer',
      description: 'Generate well-structured essays with AI assistance',
      color: 'bg-purple-100 text-purple-600',
    },
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'University Student',
      content: 'Study Buddy has completely transformed how I study. The AI features are incredible!',
      rating: 5,
    },
    {
      name: 'Mike Chen',
      role: 'High School Student',
      content: 'The flashcard generation saves me so much time. I can focus on actually learning.',
      rating: 5,
    },
    {
      name: 'Emily Rodriguez',
      role: 'Graduate Student',
      content: 'The essay writer helped me improve my writing and get better grades.',
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="container mx-auto px-4 py-16">
          {/* Header with Logo and Profile Button */}
          <div className="flex justify-between items-center mb-8 -mr-4">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-lg">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Top part - Notebook with glasses */}
                  <rect x="4" y="2" width="24" height="16" rx="2" fill="#FEF3C7" stroke="#D97706" strokeWidth="0.5"/>
                  
                  {/* Notebook rings */}
                  <rect x="6" y="4" width="1" height="8" fill="#9CA3AF"/>
                  <rect x="7.5" y="4" width="1" height="8" fill="#9CA3AF"/>
                  <rect x="9" y="4" width="1" height="8" fill="#9CA3AF"/>
                  
                  {/* Glasses frames */}
                  <circle cx="12" cy="8" r="3" fill="none" stroke="#374151" strokeWidth="1.5"/>
                  <circle cx="20" cy="8" r="3" fill="none" stroke="#374151" strokeWidth="1.5"/>
                  
                  {/* Glasses bridge */}
                  <line x1="15" y1="8" x2="17" y2="8" stroke="#374151" strokeWidth="1.5"/>
                  
                  {/* Glasses lenses */}
                  <circle cx="12" cy="8" r="2" fill="#E5E7EB"/>
                  <circle cx="20" cy="8" r="2" fill="#E5E7EB"/>
                  
                  {/* Pupils */}
                  <circle cx="12" cy="8" r="0.8" fill="#111827"/>
                  <circle cx="20" cy="8" r="0.8" fill="#111827"/>
                  
                  {/* Bottom part - Open Book */}
                  <path d="M6 18 L6 28 L18 28 L18 18 L12 16 Z" fill="#93C5FD" stroke="#3B82F6" strokeWidth="0.5"/>
                  <path d="M26 18 L26 28 L14 28 L14 18 L20 16 Z" fill="#93C5FD" stroke="#3B82F6" strokeWidth="0.5"/>
                  
                  {/* Book spine */}
                  <rect x="15" y="16" width="2" height="12" fill="#1D4ED8"/>
                  
                  {/* Book pages */}
                  <line x1="8" y1="20" x2="16" y2="20" stroke="#3B82F6" strokeWidth="0.5"/>
                  <line x1="8" y1="22" x2="16" y2="22" stroke="#3B82F6" strokeWidth="0.5"/>
                  <line x1="8" y1="24" x2="16" y2="24" stroke="#3B82F6" strokeWidth="0.5"/>
                  
                  <line x1="24" y1="20" x2="16" y2="20" stroke="#3B82F6" strokeWidth="0.5"/>
                  <line x1="24" y1="22" x2="16" y2="22" stroke="#3B82F6" strokeWidth="0.5"/>
                  <line x1="24" y1="24" x2="16" y2="24" stroke="#3B82F6" strokeWidth="0.5"/>
                </svg>
              </div>
              {/* Logo Text */}
              <div className="text-white">
                <div className="text-xl font-bold">Study Buddy</div>
                <div className="text-xs text-blue-200">AI-Powered Study Assistant</div>
              </div>
            </div>

            {/* Profile Button or Sign In */}
            {isAuthenticated ? (
              <Link href="/settings">
                <Button className="flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 border border-white/20">
                  <img 
                    src={user?.picture || '/default-avatar.png'} 
                    alt="Profile" 
                    className="w-6 h-6 rounded-full"
                  />
                  <span className="text-sm font-medium">{user?.name || userName}</span>
                </Button>
              </Link>
            ) : (
              <GoogleSignIn 
                text="Sign In"
                className="bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 border border-white/20 px-3 py-1.5 text-sm mr-4"
                onSuccess={() => window.location.reload()}
              />
            )}
          </div>
          
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Sparkles size={16} />
              <span className="text-sm font-medium">AI-Powered Study Assistant</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Study Smarter, Not Harder
            </h1>
            
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Create notes, generate flashcards, and get AI help with your studies. 
              All in one powerful platform.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-blue-600 text-white hover:bg-blue-700 font-semibold border-2 border-blue-600">
                Get Started Free
                <ArrowRight size={20} className="ml-2" />
              </Button>
              <Button size="lg" className="bg-blue-600 text-white hover:bg-blue-700 font-semibold border-2 border-blue-600">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{userStats.notes}</div>
              <div className="text-gray-600">Notes Created</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600 mb-2">{userStats.flashcards}</div>
              <div className="text-gray-600">Flashcards</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">{userStats.messages}</div>
              <div className="text-gray-600">AI Conversations</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">{userStats.essays}</div>
              <div className="text-gray-600">Essays Written</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need to Study Better
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Our AI-powered features help you create, organize, and study more effectively
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${feature.color}`}>
                      <Icon size={24} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600 text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Loved by Students Worldwide
            </h2>
            <p className="text-gray-600 text-lg">
              See what students are saying about Study Buddy
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} size={16} className="text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4 italic">&ldquo;{testimonial.content}&rdquo;</p>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Study Habits?
          </h2>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of students who are already studying smarter with Study Buddy
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-blue-600 text-white hover:bg-blue-700 font-semibold border-2 border-blue-600">
              See Free Plan
              <ArrowRight size={20} className="ml-2" />
            </Button>
            <Button size="lg" className="bg-blue-600 text-white hover:bg-blue-700 font-semibold border-2 border-blue-600">
              View Pricing
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}