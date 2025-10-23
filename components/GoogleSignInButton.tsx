import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { googleAuthService } from '@/utils/google-auth';
import { useSubscription } from '@/hooks/subscription-store';

interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  style?: any;
  text?: string;
}

export function GoogleSignInButton({ 
  onSuccess, 
  onError, 
  style,
  text = 'Continue with Google'
}: GoogleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { syncWithBackend } = useSubscription();

  const handleGoogleSignIn = async () => {
    if (isLoading) return; // Prevent multiple simultaneous sign-ins
    
    setIsLoading(true);
    
    try {
      console.log('🔄 Starting Google Sign-In...');
      const result = await googleAuthService.signIn();
      
      if (result) {
        console.log('✅ Google Sign-In successful, syncing data...');
        // Sync subscription data after successful sign-in
        try {
          await syncWithBackend();
          console.log('✅ Data sync completed');
        } catch (syncError) {
          console.error('❌ Data sync failed:', syncError);
          // Don't fail the sign-in if sync fails
        }
        
        onSuccess?.();
        Alert.alert('Success', 'Signed in successfully! Your data will sync across devices.');
      }
    } catch (error) {
      console.error('❌ Google Sign-In error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
      onError?.(errorMessage);
      
      // Show user-friendly error message
      let userMessage = 'Sign in failed. Please try again.';
      if (errorMessage.includes('cancelled')) {
        userMessage = 'Sign in was cancelled.';
      } else if (errorMessage.includes('Play Services')) {
        userMessage = 'Google Play Services is not available. Please update and try again.';
      } else if (errorMessage.includes('internet')) {
        userMessage = 'Please check your internet connection and try again.';
      }
      
      Alert.alert('Sign In Failed', userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[
        {
          backgroundColor: '#4285F4',
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderRadius: 8,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 48,
        },
        style,
      ]}
      onPress={handleGoogleSignIn}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator color="white" size="small" />
      ) : (
        <>
          <Text style={{ color: 'white', fontSize: 16, fontWeight: '500', marginLeft: 8 }}>
            {text}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

export function GoogleSignOutButton({ 
  onSuccess, 
  onError, 
  style,
  text = 'Sign Out'
}: GoogleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignOut = async () => {
    if (isLoading) return; // Prevent multiple simultaneous sign-outs
    
    setIsLoading(true);
    
    try {
      console.log('🔄 Starting Google Sign-Out...');
      await googleAuthService.signOut();
      console.log('✅ Google Sign-Out successful');
      onSuccess?.();
      Alert.alert('Signed Out', 'You have been signed out successfully.');
    } catch (error) {
      console.error('❌ Google Sign-Out error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Sign out failed';
      onError?.(errorMessage);
      
      // Show user-friendly error message
      let userMessage = 'Sign out failed. Please try again.';
      if (errorMessage.includes('storage')) {
        userMessage = 'Sign out completed, but some data may not have been cleared.';
      }
      
      Alert.alert('Sign Out Issue', userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[
        {
          backgroundColor: '#dc3545',
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderRadius: 8,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 48,
        },
        style,
      ]}
      onPress={handleGoogleSignOut}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator color="white" size="small" />
      ) : (
        <Text style={{ color: 'white', fontSize: 16, fontWeight: '500' }}>
          {text}
        </Text>
      )}
    </TouchableOpacity>
  );
}
