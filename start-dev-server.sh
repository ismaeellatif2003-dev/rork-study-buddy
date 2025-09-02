#!/bin/bash

echo "🚀 Starting Study Buddy Development Server..."

# Check if Metro is already running
if curl -s http://localhost:8081/status > /dev/null 2>&1; then
    echo "✅ Metro bundler is already running on port 8081"
    echo "📱 You can now build and run the app in Xcode"
    echo ""
    echo "To open in Xcode:"
    echo "  open ios/StudyBuddy.xcworkspace"
    echo ""
    echo "To stop the server later:"
    echo "  pkill -f 'expo start'"
else
    echo "🔄 Starting Metro bundler..."
    npx expo start --clear &
    
    # Wait for server to start
    echo "⏳ Waiting for server to start..."
    for i in {1..30}; do
        if curl -s http://localhost:8081/status > /dev/null 2>&1; then
            echo "✅ Metro bundler is now running on port 8081"
            echo "📱 You can now build and run the app in Xcode"
            echo ""
            echo "To open in Xcode:"
            echo "  open ios/StudyBuddy.xcworkspace"
            echo ""
            echo "To stop the server later:"
            echo "  pkill -f 'expo start'"
            break
        fi
        sleep 1
    done
fi
