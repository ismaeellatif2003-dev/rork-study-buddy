import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class GoogleAuthService {
  private static instance: GoogleAuthService;
  private apiBase = 'https://rork-study-buddy-production-eeeb.up.railway.app';

  static getInstance() {
    if (!GoogleAuthService.instance) {
      GoogleAuthService.instance = new GoogleAuthService();
    }
    return GoogleAuthService.instance;
  }

  async initialize() {
    try {
      const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
      const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
      
      console.log('🔧 Environment variables check:');
      console.log('  - EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID:', webClientId ? '✅ Set' : '❌ Missing');
      console.log('  - EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID:', iosClientId ? '✅ Set' : '❌ Missing');
      
      if (!webClientId || !iosClientId) {
        throw new Error('Google OAuth client IDs not configured. Please check your .env file.');
      }
      
      console.log('🔧 Configuring Google Sign-In with:');
      console.log('  - Web Client ID:', webClientId);
      console.log('  - iOS Client ID:', iosClientId);
      
      // For iOS, use the iOS Client ID as the webClientId
      // This ensures the ID token is generated for the iOS client
      GoogleSignin.configure({
        webClientId: iosClientId,  // Use iOS client ID for token generation
        iosClientId,                // Also set iosClientId for native module
        offlineAccess: true,
        forceCodeForRefreshToken: true,
      });
      
      console.log('✅ Google Sign-In configured successfully');
    } catch (error) {
      console.error('❌ Google Sign-In initialization error:', error);
      throw error;
    }
  }

  async signIn() {
    try {
      console.log('🔄 Starting Google Sign-In process...');
      await this.initialize();
      
      console.log('🔄 Checking Google Play Services...');
      await GoogleSignin.hasPlayServices();
      
      // Sign out first to ensure clean state
      try {
        await GoogleSignin.signOut();
        console.log('🔄 Signed out previous session');
      } catch (signOutError) {
        console.log('ℹ️ No previous session to sign out');
      }
      
      console.log('🔄 Initiating Google Sign-In...');
      const userInfo = await GoogleSignin.signIn();
      
      console.log('📋 Google Sign-In response:', {
        hasUserInfo: !!userInfo,
        hasIdToken: !!userInfo?.idToken,
        hasServerAuthCode: !!userInfo?.serverAuthCode,
        userEmail: userInfo?.user?.email,
        userId: userInfo?.user?.id,
      });
      
      // Get ID token from userInfo or fetch tokens
      let idToken = userInfo?.idToken;
      
      // If no ID token, try to get tokens explicitly
      if (!idToken && userInfo) {
        console.log('🔄 No ID token in response, fetching tokens...');
        try {
          const tokens = await GoogleSignin.getTokens();
          idToken = tokens.idToken;
          console.log('📋 Got tokens:', {
            hasIdToken: !!tokens.idToken,
            hasAccessToken: !!tokens.accessToken,
          });
        } catch (tokenError) {
          console.error('❌ Error getting tokens:', tokenError);
        }
      }

      if (!idToken) {
        console.error('❌ No ID token received:', { userInfo });
        throw new Error('No ID token received from Google. Please sign in again.');
      }
      
      console.log('✅ Google Sign-In successful, got ID token');

      // Get device info
      const deviceInfo = {
        deviceId: Device.osInternalBuildId || 'unknown',
        platform: 'mobile',
        deviceName: Device.deviceName || 'Unknown Device',
        osVersion: Device.osVersion || 'Unknown',
        sessionId: 'mobile-session-' + Date.now(),
        userAgent: 'StudyBuddy-Mobile',
        screenResolution: 'mobile',
      };

      // Authenticate with backend
      console.log('🔄 Authenticating with backend...');
      const response = await fetch(`${this.apiBase}/auth/google`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken,
          platform: 'mobile',
          deviceInfo
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('✅ Backend authentication successful');
        // Store auth data
        await AsyncStorage.setItem('authToken', data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        
        // Trigger sync with backend
        console.log('🔄 Syncing data with backend...');
        await this.syncData();
        
        return data;
      } else {
        console.error('❌ Backend authentication failed:', data);
        throw new Error(data.error || `Authentication failed with status ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Google Sign-In error:', error);
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        throw new Error('Sign in cancelled by user');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        throw new Error('Sign in already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Google Play Services not available');
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Sign in failed: ' + (error.toString() || 'Unknown error'));
      }
    }
  }

  async signOut() {
    try {
      await GoogleSignin.signOut();
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('studyBuddySubscription');
      await AsyncStorage.removeItem('studyBuddyUsage');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }

  async syncData() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return null;

      const response = await fetch(`${this.apiBase}/auth/sync`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update local storage with synced data
        if (data.subscription) {
          await AsyncStorage.setItem('studyBuddySubscription', JSON.stringify(data.subscription));
        }
        if (data.usage) {
          await AsyncStorage.setItem('studyBuddyUsage', JSON.stringify(data.usage));
        }
        
        return data;
      }
      return null;
    } catch (error) {
      console.error('Sync error:', error);
      return null;
    }
  }

  async updateUsage(type: string, increment: number = 1) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;

      await fetch(`${this.apiBase}/usage/update`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, increment })
      });
    } catch (error) {
      console.error('Usage update error:', error);
    }
  }

  async isSignedIn() {
    try {
      const isSignedIn = await GoogleSignin.isSignedIn();
      const token = await AsyncStorage.getItem('authToken');
      return isSignedIn && !!token;
    } catch (error) {
      return false;
    }
  }

  async getCurrentUser() {
    try {
      const userData = await AsyncStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      return null;
    }
  }
}

export const googleAuthService = GoogleAuthService.getInstance();
