import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, Component, ReactNode } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { StudyProvider } from "@/hooks/study-store";
import { SubscriptionProvider } from "@/hooks/subscription-store";
import { UserProfileProvider } from "@/hooks/user-profile-store";
import { googleAuthService } from "@/utils/google-auth";
import colors from "@/constants/colors";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Error Boundary Component
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    // Log additional context for debugging
    console.error('Error stack:', error.stack);
    console.error('Component stack:', errorInfo.componentStack);
    
    // In production, you might want to send this to a crash reporting service
    // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <Text style={errorStyles.title}>Something went wrong</Text>
          <Text style={errorStyles.message}>
            The app encountered an unexpected error. Please restart the app.
          </Text>
          <TouchableOpacity
            style={errorStyles.button}
            onPress={() => this.setState({ hasError: false, error: undefined })}
          >
            <Text style={errorStyles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: colors.cardBackground,
    fontSize: 16,
    fontWeight: '600',
  },
});

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="scan-notes" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="modal" options={{ presentation: "modal" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [isAppReady, setIsAppReady] = React.useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const initializeApp = async () => {
      try {
        // Initialize Google Sign-In
        await googleAuthService.initialize();
        console.log('✅ Google Sign-In initialized');
        
        // Simple initialization
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (isMounted) {
          setIsAppReady(true);
          
          // Hide splash after app is ready
          setTimeout(async () => {
            try {
              await SplashScreen.hideAsync();
            } catch (error) {
              console.error('Error hiding splash screen:', error);
            }
          }, 100);
        }
      } catch (error) {
        console.error('❌ Error initializing app:', error);
        
        // Set ready anyway to prevent infinite loading
        if (isMounted) {
          setIsAppReady(true);
        }
      }
    };
    
    initializeApp();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Force app ready after 3 seconds to prevent infinite loading
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!isAppReady) {
        console.warn('App initialization timeout, forcing ready state');
        setIsAppReady(true);
      }
    }, 3000);
    
    return () => clearTimeout(timeoutId);
  }, [isAppReady]);

  if (!isAppReady) {
    return null; // Keep splash screen visible
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <UserProfileProvider>
          <SubscriptionProvider>
            <StudyProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <RootLayoutNav />
              </GestureHandlerRootView>
            </StudyProvider>
          </SubscriptionProvider>
        </UserProfileProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}