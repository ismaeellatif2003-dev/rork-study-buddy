import React, { memo, useCallback } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, Alert } from 'react-native';

type AppleWalletPassStubProps = {
  onAdded?: () => void;
  label?: string;
  testID?: string;
};

const AppleWalletPassStub = memo(function AppleWalletPassStub({ onAdded, label, testID }: AppleWalletPassStubProps) {
  const handlePress = useCallback(() => {
    if (Platform.OS !== 'ios') {
      Alert.alert('Apple Wallet Unavailable', 'Apple Wallet is only available on iOS devices.');
      return;
    }

    Alert.alert(
      'Add to Apple Wallet',
      'PassKit requires a custom build with native modules. In this demo, we cannot add real passes in Expo Go. Tap "Simulate Add" to continue.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Simulate Add',
          onPress: () => {
            if (onAdded) onAdded();
          },
        },
      ]
    );
  }, [onAdded]);

  return (
    <View style={styles.container}>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        accessibilityRole="button"
        testID={testID ?? 'apple-wallet-pass-stub'}
      >
        <Text style={styles.appleText}>Add to Apple Wallet</Text>
        {!!label && <Text style={styles.subText}>{label}</Text>}
      </Pressable>
      <Text style={styles.helperText} testID="apple-wallet-helper">
        This is a placeholder. Real PassKit support needs a custom dev client with native PassKit integration.
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    width: '100%',
    backgroundColor: '#000',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  appleText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  subText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
    opacity: 0.8,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default AppleWalletPassStub;
