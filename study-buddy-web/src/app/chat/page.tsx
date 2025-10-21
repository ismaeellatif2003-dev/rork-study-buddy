'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { mockChatMessages } from '@/data/mockData';
import { updateUserStats } from '@/utils/userStats';
import { canUseFeature, updateUsage, getCurrentSubscription } from '@/utils/subscription';
import { aiService } from '@/services/aiService';
import { useAuthGuard, useFeatureGuard } from '@/utils/auth-guards';
import UpgradePrompt from '@/components/UpgradePrompt';
import type { ChatMessage } from '@/types/study';

const mockResponses = [
  "That's a great question! Let me help you understand this concept better.",
  "I can explain that in detail. Here's what you need to know:",
  "Excellent question! This is an important topic to understand.",
  "I'd be happy to help you with that. Let me break it down:",
  "That's a common question students have. Here's the explanation:",
];

const mockDetailedResponses = [
  "The key concept here involves understanding the fundamental principles. When we look at this topic, we need to consider several factors that influence the outcome. First, there's the basic mechanism that drives the process. Then, we have the various conditions that can affect the results. Finally, we need to understand how these elements interact with each other to produce the final outcome. This understanding is crucial for applying the concept in real-world scenarios.",
  "This topic is fascinating because it connects several different areas of study. The main idea revolves around the interaction between different systems and how they influence each other. To fully grasp this concept, you should focus on three main aspects: the underlying theory, the practical applications, and the common misconceptions that students often have. Each of these areas provides important insights that will help you master the material.",
  "Understanding this concept requires looking at it from multiple perspectives. The theoretical foundation is important, but so is seeing how it applies in practice. Many students struggle with this topic because they focus too much on memorization rather than understanding the underlying principles. The key is to see how the different pieces fit together and how they relate to other concepts you've learned.",
];

export default function ChatPage() {
  // Authentication guard
  const { isAuthenticated: authCheck, isLoading: authLoading } = useAuthGuard({
    requireAuth: true,
    redirectTo: '/auth/signin'
  });
  
  const { canUseFeature: canAskQuestions, getRemainingUsage: getRemainingQuestions } = useFeatureGuard('messages');
  
  const [messages, setMessages] = useState<ChatMessage[]>(mockChatMessages);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [subscription, setSubscription] = useState(getCurrentSubscription());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Listen for subscription updates
  useEffect(() => {
    const handleSubscriptionUpdate = () => {
      setSubscription(getCurrentSubscription());
    };

    window.addEventListener('subscriptionUpdated', handleSubscriptionUpdate);
    return () => window.removeEventListener('subscriptionUpdated', handleSubscriptionUpdate);
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    // Check if user can send messages
    if (!canAskQuestions) {
      setShowUpgradePrompt(true);
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    
    // Update user stats for AI conversation
    updateUserStats('messages', 1);
    updateUsage('messages', 1);

    try {
      // Prepare conversation history for context
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Add the current user message to the conversation
      conversationHistory.push({
        role: 'user',
        content: inputMessage.trim()
      });

      // Call AI service
      const aiResponse = await aiService.generateText({
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI tutor and study assistant. Provide clear, educational responses to help students learn and understand concepts. Be encouraging and supportive in your explanations.'
          },
          ...conversationHistory
        ],
        type: 'text',
        model: 'openai/gpt-4o'
      });

      if (!aiResponse.success || !aiResponse.response) {
        throw new Error(aiResponse.error || 'Failed to get AI response');
      }

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse.response,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      
      // Fallback to a simple error message
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I'm having trouble responding right now. Please try again in a moment.",
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const suggestedQuestions = [
    "Explain the difference between supervised and unsupervised learning",
    "How does photosynthesis work?",
    "What are the key principles of React?",
    "Help me understand machine learning algorithms",
    "Can you summarize the main points of my notes?",
  ];

  const handleSuggestedQuestion = (question: string) => {
    setInputMessage(question);
  };

  return (
    <div className="container mx-auto px-4 py-8 pb-24">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Bot className="text-blue-600" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Study Assistant</h1>
            <p className="text-gray-600">Ask me anything about your studies</p>
          </div>
        </div>

        {/* Suggested Questions */}
        {messages.length <= 4 && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Suggested questions:</h3>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((question, index) => (
                  <Button
                    key={index}
                    size="sm"
                    onClick={() => handleSuggestedQuestion(question)}
                    className="text-xs bg-blue-600 text-white hover:bg-blue-700"
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Messages */}
        <div className="space-y-4 mb-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="p-2 bg-blue-100 rounded-full self-start">
                  <Bot className="text-blue-600" size={20} />
                </div>
              )}
              
              <div
                className={`max-w-3xl rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                <p
                  className={`text-xs mt-2 ${
                    message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  {formatTime(message.timestamp)}
                </p>
              </div>
              
              {message.role === 'user' && (
                <div className="p-2 bg-gray-100 rounded-full self-start">
                  <User className="text-gray-600" size={20} />
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="p-2 bg-blue-100 rounded-full self-start">
                <Bot className="text-blue-600" size={20} />
              </div>
              <div className="bg-gray-100 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-blue-600 animate-pulse" size={16} />
                  <span className="text-gray-600">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-3">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about your studies..."
                className="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="self-end bg-blue-600 text-white hover:bg-blue-700"
              >
                <Send size={20} />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Upgrade Prompt */}
      {showUpgradePrompt && (
        <UpgradePrompt
          feature="AI questions"
          remainingUsage={getRemainingQuestions()}
          onUpgrade={() => {
            setShowUpgradePrompt(false);
            // Redirect to subscription page
            window.location.href = '/subscription';
          }}
          onClose={() => setShowUpgradePrompt(false)}
        />
      )}
    </div>
  );
}
