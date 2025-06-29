export const CDN_BASE_URL =
  process.env.EXPO_PUBLIC_CDN_BASE_URL || 'https://your-cdn-domain.com/sounds/';
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';
export const SENTRY_DSN_FRONTEND = process.env.EXPO_PUBLIC_SENTRY_DSN_FRONTEND;
export const SENTRY_DSN_BACKEND = process.env.EXPO_PUBLIC_SENTRY_DSN_BACKEND;

export const CLOUDINARY_CLOUD_NAME =
  process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
export const CLOUDINARY_UPLOAD_PRESET =
  process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;