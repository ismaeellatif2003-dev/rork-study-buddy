#!/bin/bash

echo "🔧 Comprehensive Xcode Build Fix..."

# Fix script permissions
echo "📝 Fixing script permissions..."
chmod +x ios/Pods/Target\ Support\ Files/Pods-StudyBuddy/expo-configure-project.sh 2>/dev/null || true

# Fix all script permissions in Pods
echo "🔧 Fixing all Pod script permissions..."
find ios/Pods -name "*.sh" -exec chmod +x {} \; 2>/dev/null || true

# Clean build folder
echo "🧹 Cleaning build cache..."
cd ios
xcodebuild clean -workspace StudyBuddy.xcworkspace -scheme StudyBuddy > /dev/null 2>&1
cd ..

# Fix Xcode project permissions
echo "🔐 Fixing Xcode project permissions..."
chmod -R 755 ios/
chmod -R 644 ios/*.xcodeproj/project.pbxproj 2>/dev/null || true
chmod -R 644 ios/*.xcworkspace/contents.xcworkspacedata 2>/dev/null || true

echo "✅ Comprehensive fix completed!"
echo ""
echo "📱 Next steps:"
echo "1. Close Xcode completely"
echo "2. Reopen: open ios/StudyBuddy.xcworkspace"
echo "3. In Xcode: Product → Clean Build Folder"
echo "4. Build: ⌘+R"
echo ""
echo "If still having issues, try:"
echo "- Restart your Mac"
echo "- Update Xcode to latest version"
echo "- Check Xcode → Preferences → Locations → Command Line Tools"
