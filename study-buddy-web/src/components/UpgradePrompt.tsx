'use client';

import React from 'react';
import { Crown, Star, Zap, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useRouter } from 'next/navigation';

interface UpgradePromptProps {
  feature?: string;
  isProFeature?: boolean;
  remainingUsage?: number;
  onUpgrade?: () => void;
  onClose?: () => void;
}

export default function UpgradePrompt({ 
  feature = 'this feature', 
  isProFeature = false,
  remainingUsage = 0,
  onUpgrade,
  onClose 
}: UpgradePromptProps) {
  const router = useRouter();

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      router.push('/subscription');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full w-fit">
            {isProFeature ? (
              <Lock className="w-6 h-6 text-white" />
            ) : (
              <Crown className="w-6 h-6 text-white" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            {isProFeature ? 'Pro Feature' : 'Upgrade Required'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {isProFeature ? (
                <>
                  <strong>Video AI Analysis</strong> is a Pro-only feature. 
                  Upgrade to Pro to unlock advanced video analysis capabilities.
                </>
              ) : (
                <>
                  You&apos;ve reached your limit for <strong>{feature}</strong>. 
                  {remainingUsage > 0 && ` You have ${remainingUsage} remaining.`}
                </>
              )}
            </p>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              Pro Plan Benefits
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Unlimited notes and flashcards</li>
              <li>• Unlimited AI questions and essays</li>
              <li>• Advanced Video AI Analysis</li>
              <li>• Priority support</li>
              <li>• All premium features</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleUpgrade}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade to Pro
            </Button>
            {onClose && (
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1"
              >
                Maybe Later
              </Button>
            )}
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Starting at £0.99/month • Cancel anytime
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
