import type { ExpoConfig } from 'expo/config';
const config: ExpoConfig = {
  name: process.env.APP_NAME ?? 'Lewis Family', slug: 'lewis-family', scheme: 'lewisfamily',
  extra: { appName: process.env.APP_NAME ?? 'Lewis Family', paywallEnabled: process.env.PAYWALL_ENABLED === 'true' }, version: '1.0.0', orientation: 'portrait', userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: 'com.lewisfamily.app', supportsTablet: false,
    infoPlist: {
      NSCalendarsFullAccessUsageDescription: 'Shows and adds family events and reminders to your Apple Calendar.',
      NSRemindersFullAccessUsageDescription: 'Keeps family reminders in sync with Apple Reminders so Siri can use them.',
      NSSiriUsageDescription: 'Lets you add reminders and hear today’s plan with Siri.',
    },
    entitlements: { 'com.apple.developer.siri': true, 'com.apple.security.application-groups': ['group.com.lewisfamily.app'] },
  },
  plugins: ['expo-router', 'expo-web-browser', 'expo-secure-store', 'expo-notifications', ['expo-calendar', { calendarPermission: 'Family calendar', remindersPermission: 'Family reminders' }], './ios-intents/with-app-intents.js'],
  experiments: { typedRoutes: true },
};
export default config;
