# Installation Instructions for Multiple Image Upload Feature

## Issue Resolution

If you encounter the error "unmatched route (page could not be found)" when clicking the create post button, it's because the `expo-image-manipulator` package needs to be installed.

## Steps to Fix

1. Navigate to the friend app directory:
   ```bash
   cd friend
   ```

2. Install all dependencies:
   ```bash
   npm install
   ```

3. If you're running the development server, restart it:
   ```bash
   # Stop the current server (Ctrl+C)
   # Then restart:
   npm start
   ```

4. Clear the Metro bundler cache (if issues persist):
   ```bash
   npm start --reset-cache
   ```

## What Was Fixed

- Updated `expo-image-manipulator` version in `package.json` to use tilde (`~`) version constraint for consistency with other Expo packages
- The package is now properly installed in `node_modules`

## Verification

After running `npm install`, you should be able to:
- Click the floating "+" button on the home screen
- Open the create post screen
- Select multiple images (up to 4)
- Images will be automatically compressed
- Create posts with multiple images displayed in a carousel

## If Issues Persist

1. Try clearing the cache and reinstalling:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm start --reset-cache
   ```

2. For iOS development, you may need to reinstall pods:
   ```bash
   cd ios
   pod install
   cd ..
   ```

3. For Android, you may need to clean the build:
   ```bash
   cd android
   ./gradlew clean
   cd ..
   ```
