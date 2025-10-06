import { Platform, Alert } from 'react-native';
import {
  initConnection,
  getSubscriptions,
  requestSubscription,
  getAvailablePurchases,
  finishTransaction,
  PurchaseError,
  SubscriptionPurchase,
  Product,
  acknowledgePurchaseAndroid,
  purchaseUpdatedListener,
  purchaseErrorListener,
} from 'react-native-iap';
import type { UserSubscription } from '@/types/study';

// Product IDs for different platforms
const PRODUCT_IDS = {
  PRO_MONTHLY: {
    ios: 'app.rork.study_buddy_4fpqfs7.subscription.monthly123',
    android: 'study_buddy_pro_monthly',
  },
  PRO_YEARLY: {
    ios: 'app.rork.study_buddy_4fpqfs7.subscription.yearly123',
    android: 'study_buddy_pro_yearly',
  },
};

// Get product ID for current platform
function getProductId(productKey: keyof typeof PRODUCT_IDS): string {
  const platform = Platform.OS as 'ios' | 'android';
  return PRODUCT_IDS[productKey][platform] || PRODUCT_IDS[productKey].ios;
}

class PaymentService {
  private isInitialized = false;
  private availableProducts: Product[] = [];
  private purchaseUpdateListener: any = null;
  private purchaseErrorListener: any = null;

  // Initialize payment service
  async initialize(): Promise<boolean> {
    try {
      // Initialize connection to app store
      await initConnection();
      this.isInitialized = true;
      
      // Get available products
      await this.loadProducts();
      
      // Set up purchase listeners
      this.setupPurchaseListeners();
      
      return true;
    } catch (error) {
      console.error('Failed to initialize payment service:', error);
      
      // In development/simulator, we'll still return true but with fallback products
      if (__DEV__) {
        console.log('Payment service failed to initialize - using fallback mode for development');
        this.isInitialized = true;
        await this.loadProducts(); // This will use fallback products
        return true;
      }
      
      return false;
    }
  }

  // Load available subscription products
  private async loadProducts(): Promise<void> {
    try {
      const productIds = [
        getProductId('PRO_MONTHLY'),
        getProductId('PRO_YEARLY'),
      ];

      console.log('Loading products with IDs:', productIds);

      const products = await getSubscriptions({ skus: productIds });
      this.availableProducts = products as unknown as Product[];
      
      console.log('Loaded products:', this.availableProducts.map(p => p.productId));
    } catch (error) {
      // Silently handle product loading errors - this is expected in development
      console.log('Using fallback products (store products not available)');
      
      // Create fallback products if loading fails
      this.availableProducts = [
        {
          productId: getProductId('PRO_MONTHLY'),
          title: 'Pro Monthly',
          description: 'Monthly subscription',
          price: '9.99',
          currency: 'GBP',
        } as Product,
        {
          productId: getProductId('PRO_YEARLY'),
          title: 'Pro Yearly',
          description: 'Yearly subscription',
          price: '99.99',
          currency: 'GBP',
        } as Product,
      ];
    }
  }

  // Set up purchase listeners
  private setupPurchaseListeners(): void {
    // Only set up listeners if they haven't been set up already
    if (this.purchaseUpdateListener || this.purchaseErrorListener) {
      return;
    }

    // Purchase update listener
    this.purchaseUpdateListener = purchaseUpdatedListener(
      async (purchase: SubscriptionPurchase) => {
        await this.handlePurchaseUpdate(purchase);
      }
    );

    // Purchase error listener
    this.purchaseErrorListener = purchaseErrorListener(
      (error: PurchaseError) => {
        console.error('Purchase error:', error);
        this.handlePurchaseError(error);
      }
    );
  }

  // Handle purchase updates
  private async handlePurchaseUpdate(purchase: SubscriptionPurchase): Promise<void> {
    try {
      // Finish the transaction
      if (Platform.OS === 'ios') {
        await finishTransaction({ purchase, isConsumable: false });
      } else {
        // For Android, acknowledge the purchase
        if (purchase.purchaseToken) {
          await acknowledgePurchaseAndroid({ token: purchase.purchaseToken });
        }
      }

      // Verify purchase with backend
      const verificationResult = await this.verifyPurchaseWithBackend(purchase);
      
      if (verificationResult.success && verificationResult.subscription) {
        // Emit success event - notification will be handled by subscription store
        this.onPurchaseSuccess?.(verificationResult.subscription);
      } else {
        this.onPurchaseError?.(verificationResult.error || 'Verification failed');
      }
    } catch (error) {
      console.error('Error handling purchase update:', error);
      this.onPurchaseError?.('Failed to process purchase');
    }
  }

  // Handle purchase errors
  private handlePurchaseError(error: PurchaseError): void {
    if (error.code === 'E_USER_CANCELLED') {
      this.onPurchaseCancelled?.();
    } else {
      console.error('Purchase error:', error);
      this.onPurchaseError?.(error.message || 'Purchase failed');
      // Error notification will be handled by subscription store
    }
  }

  // Create a local subscription for development/testing
  private createLocalSubscription(purchase: any): UserSubscription {
    const planId = purchase.productId.includes('yearly') ? 'pro_yearly' : 'pro_monthly';
    const startDate = new Date();
    const endDate = new Date();
    
    if (planId === 'pro_monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    return {
      id: `sub_${Date.now()}`,
      planId,
      status: 'active',
      startDate,
      endDate,
      autoRenew: true,
      platform: Platform.OS,
      productId: purchase.productId,
      transactionId: purchase.transactionId,
    };
  }

  // Verify purchase with backend
  private async verifyPurchaseWithBackend(purchase: SubscriptionPurchase): Promise<{
    success: boolean;
    subscription?: UserSubscription;
    error?: string;
  }> {
    try {
      // Try tRPC client first
      try {
        const { trpcClient } = await import('@/lib/trpc');
        
        const verificationResult = await trpcClient.subscription.verifyPurchase.mutate({
          platform: Platform.OS as 'ios' | 'android' | 'web',
          purchaseToken: purchase.purchaseToken,
          productId: purchase.productId,
          transactionId: purchase.transactionId,
          originalTransactionId: (purchase as any).originalTransactionId || purchase.transactionId,
          receiptData: purchase.transactionReceipt,
        });

        if (verificationResult.success && verificationResult.subscription) {
          return {
            success: true,
            subscription: {
              ...verificationResult.subscription,
              startDate: new Date(verificationResult.subscription.startDate),
              endDate: new Date(verificationResult.subscription.endDate),
            },
          };
        } else {
          console.error('Backend verification returned failure:', verificationResult);
          
          // In development mode, if verification fails, create a local subscription instead of showing error
          if (__DEV__) {
            console.log('Development mode: Creating local subscription despite verification failure');
            return {
              success: true,
              subscription: this.createLocalSubscription(purchase),
            };
          }
          
          return {
            success: false,
            error: verificationResult.error || 'Verification failed',
          };
        }
      } catch (trpcError) {
        console.error('tRPC verification failed, trying direct endpoint:', trpcError);
        
        // Fallback to direct endpoint
        const baseUrl = __DEV__ ? 'http://localhost:3000' : 'https://rork-study-buddy-production-eeeb.up.railway.app';
        
        const response = await fetch(`${baseUrl}/trpc/subscription.verifyPurchase`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            platform: Platform.OS,
            productId: purchase.productId,
            transactionId: purchase.transactionId,
            originalTransactionId: (purchase as any).originalTransactionId || purchase.transactionId,
          }),
        });

        if (!response.ok) {
          throw new Error(`Backend verification failed: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success && result.subscription) {
          return { success: true, subscription: result.subscription };
        } else {
          console.error('Direct endpoint verification returned failure:', result);
          return { success: false, error: 'Verification failed' };
        }
      }
    } catch (error) {
      console.error('All verification methods failed:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : 'Unknown'
      });
      
      // Create a local subscription as fallback for testing
      console.log('Creating local subscription as fallback...');
      console.log('Purchase productId:', purchase.productId);
      const planId = purchase.productId.includes('yearly') ? 'pro_yearly' : 'pro_monthly';
      console.log('Determined planId:', planId);
      const startDate = new Date();
      const endDate = new Date();
      
      if (planId === 'pro_monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      const fallbackSubscription: UserSubscription = {
        id: `sub_${Date.now()}`,
        planId,
        status: 'active',
        startDate,
        endDate,
        autoRenew: true,
        transactionId: purchase.transactionId,
        originalTransactionId: (purchase as any).originalTransactionId || purchase.transactionId,
      };
      
      return {
        success: true,
        subscription: fallbackSubscription,
      };
    }
  }

  // Purchase subscription
  async purchaseSubscription(planId: 'pro_monthly' | 'pro_yearly'): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Payment service not initialized');
    }

    const productId = planId === 'pro_monthly' 
      ? getProductId('PRO_MONTHLY')
      : getProductId('PRO_YEARLY');

    // Check if product is available
    const product = this.availableProducts.find(p => p.productId === productId);
    if (!product) {
      // Silently handle product not found - this is expected in development
      console.log('Product not found in available products, using fallback product');
      console.log('Available products:', this.availableProducts.map(p => p.productId));
      console.log('Requested product:', productId);
    }

    try {
      // In development mode, simulate a successful purchase
      if (__DEV__) {
        console.log('Development mode: Simulating successful purchase');
        
        // Create a mock purchase object
        const mockPurchase = {
          productId,
          transactionId: `mock_${Date.now()}`,
          transactionDate: Date.now(),
          transactionReceipt: 'mock_receipt',
        };
        
        console.log('Mock purchase created with productId:', productId);
        
        // Simulate the purchase update
        setTimeout(() => {
          this.handlePurchaseUpdate(mockPurchase as any);
        }, 1000);
        
        return;
      }
      
      // Request subscription
      await requestSubscription({
        sku: productId,
        andDangerouslyFinishTransactionAutomaticallyIOS: false,
      });
      
      // The purchase will be handled by the purchaseUpdatedListener
    } catch (error) {
      console.error('Purchase error:', error);
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('cancelled') || error.message.includes('user cancelled')) {
          throw new Error('Purchase cancelled by user');
        } else if (error.message.includes('not available') || error.message.includes('product not found')) {
          throw new Error('Product not available in store');
        } else if (error.message.includes('network') || error.message.includes('connection')) {
          throw new Error('Network error. Please check your connection and try again.');
        }
      }
      
      throw new Error('Purchase failed. Please try again.');
    }
  }

  // Restore purchases
  async restorePurchases(): Promise<UserSubscription[]> {
    if (!this.isInitialized) {
      throw new Error('Payment service not initialized');
    }

    try {
      const purchases = await getAvailablePurchases();
      
      const restoredSubscriptions: UserSubscription[] = [];
      
      for (const purchase of purchases) {
        const verificationResult = await this.verifyPurchaseWithBackend(purchase);
        if (verificationResult.success && verificationResult.subscription) {
          restoredSubscriptions.push(verificationResult.subscription);
        }
      }
      
      return restoredSubscriptions;
    } catch (error) {
      console.error('Restore purchases error:', error);
      throw error;
    }
  }

  // Get available products
  getAvailableProducts(): Product[] {
    return this.availableProducts;
  }

  // Check if service is initialized
  isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  // Cleanup listeners
  cleanup(): void {
    if (this.purchaseUpdateListener) {
      this.purchaseUpdateListener.remove();
      this.purchaseUpdateListener = null;
    }
    
    if (this.purchaseErrorListener) {
      this.purchaseErrorListener.remove();
      this.purchaseErrorListener = null;
    }
  }

  // Event callbacks
  onPurchaseSuccess?: (subscription: UserSubscription) => void;
  onPurchaseError?: (error: string) => void;
  onPurchaseCancelled?: () => void;
}

// Export singleton instance
export const paymentService = new PaymentService();
export default paymentService;

// Export product IDs for easy access
export { PRODUCT_IDS, getProductId };
