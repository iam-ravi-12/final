// App configuration constants

// API URL is already configured in services/api.ts
// using EXPO_PUBLIC_API_URL environment variable

// App URL for sharing - can be overridden with environment variable
export const APP_URL = process.env.EXPO_PUBLIC_APP_URL || 'https://final-okus.onrender.com';

// Other app-wide constants can be added here
export const APP_NAME = 'Friends';
export const MAX_POST_LENGTH = 5000;
export const MAX_COMMUNITY_NAME_LENGTH = 100;
export const MAX_COMMUNITY_DESCRIPTION_LENGTH = 500;
