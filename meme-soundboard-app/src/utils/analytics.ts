import { analytics } from "../config/firebase";

export const trackEvent = (eventName: string, params?: { [key: string]: any }) => {
  try {
    analytics.logEvent(eventName, params);
  } catch (error) {
    console.warn('Analytics tracking failed:', error);
    // Don't throw - analytics failures shouldn't break app functionality
  }
};