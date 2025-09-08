# Payment Integration Guide

## Overview
This app uses **React Native IAP** for seamless subscription processing on both iOS and Android platforms. The payment system is completely internal and doesn't require external payment processors.

## Features
- ✅ **Native iOS/Android payments** - Uses Apple Pay and Google Play Billing
- ✅ **Seamless subscription management** - Automatic renewal handling
- ✅ **Purchase restoration** - Users can restore previous purchases
- ✅ **PassKit integration** - Apple Wallet passes for subscription status
- ✅ **Cross-platform support** - Works on iOS, Android, and web (with limitations)

## Setup Instructions

### 1. App Store Connect (iOS)
1. Create subscription products in App Store Connect:
   - Product ID: `app.rork.study_buddy_4fpqfs7.subscription.monthly123`
   - Product ID: `app.rork.study_buddy_4fpqfs7.subscription.yearly123`

2. Configure subscription groups and pricing

### 2. Google Play Console (Android)
1. Create subscription products:
   - Product ID: `study_buddy_pro_monthly123`
   - Product ID: `study_buddy_pro_yearly123`

2. Configure subscription details and pricing

### 3. Backend Verification
The app includes a backend verification system that:
- Verifies purchases with Apple/Google servers
- Manages subscription status
- Handles renewal and cancellation

## How It Works

### Payment Flow
1. User selects a subscription plan
2. App calls native payment system (Apple Pay/Google Play)
3. Payment is processed securely
4. Backend verifies the purchase
5. Subscription is activated
6. Apple Wallet pass is created (iOS)

### Subscription Plans
- **Free**: 5 notes/month, 25 flashcards/month, 10 AI questions/day
- **Pro Monthly**: £9.99/month - Unlimited everything
- **Pro Yearly**: £99.99/year - Unlimited everything + 2 months free

## Files Structure
```
utils/
├── payment-service.ts      # Main payment service
├── passkit-service.ts      # Apple Wallet integration
└── performance-optimizer.ts # Performance optimizations

hooks/
└── subscription-store.ts   # Subscription state management

app/(tabs)/
└── subscription.tsx        # Subscription UI
```

## Testing

### iOS Simulator
- Use sandbox Apple ID for testing
- Test with different subscription scenarios

### Android Emulator
- Use test Google Play account
- Test purchase flow and restoration

## Security Features
- ✅ Server-side purchase verification
- ✅ Receipt validation with Apple/Google
- ✅ Secure transaction handling
- ✅ Anti-fraud measures

## Performance Optimizations
- ✅ Debounced payment operations
- ✅ Memory management for large datasets
- ✅ Cached product information
- ✅ Optimized UI updates

## Troubleshooting

### Common Issues
1. **Payment not processing**: Check internet connection and payment method
2. **Subscription not activating**: Verify backend verification is working
3. **Restore not working**: Ensure user is signed in with correct account

### Debug Mode
Enable debug logging by setting `__DEV__` to true in development builds.

## Next Steps
1. Set up real App Store Connect products
2. Configure Google Play Console subscriptions
3. Deploy backend verification system
4. Test with real payment methods
5. Submit for App Store/Play Store review

## Support
For payment-related issues, check:
- React Native IAP documentation
- Apple Developer documentation
- Google Play Developer documentation
