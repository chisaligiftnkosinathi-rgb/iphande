@echo off
cd /d C:\Projects\iphande\mobile

echo Clearing Expo and Metro caches...
rmdir /s /q .expo 2>nul
rmdir /s /q node_modules\.cache 2>nul

echo Starting Expo with verbose Metro logs...
set EXPO_DEBUG=true
set DEBUG=expo:*,metro:*
npx expo start --clear --verbose
