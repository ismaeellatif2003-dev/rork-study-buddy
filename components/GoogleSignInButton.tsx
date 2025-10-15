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
    setIsLoading(true);
    
    try {
      const result = await googleAuthService.signIn();
      
      if (result) {
        // Sync subscription data after successful sign-in
        await syncWithBackend();
        onSuccess?.();
        Alert.alert('Success', 'Signed in successfully! Your data will sync across devices.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
      console.error('Google Sign-In error:', error);
      onError?.(errorMessage);
      Alert.alert('Sign In Failed', errorMessage);
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
    setIsLoading(true);
    
    try {
      await googleAuthService.signOut();
      onSuccess?.();
      Alert.alert('Signed Out', 'You have been signed out successfully.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign out failed';
      console.error('Google Sign-Out error:', error);
      onError?.(errorMessage);
      Alert.alert('Sign Out Failed', errorMessage);
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
