/**
 * Pop-up Manager Utility
 * 
 * This utility helps manage and control pop-ups throughout the application.
 * It allows for centralized configuration of which pop-ups should be displayed.
 */

// Default configuration - set unwanted popups to false
const popupConfig = {
  // System notifications
  errorAlerts: true,
  successMessages: true,
  
  // Marketing/UX popups - disable unwanted ones
  newsletterSubscription: false,
  ratingRequest: false,
  newFeatureAnnouncement: false,
  
  // Cookie notices - required in some regions
  cookieConsent: true,
  
  // Define any other popup types here
};

/**
 * Check if a specific popup should be shown
 * @param {string} popupType - The type of popup
 * @return {boolean} - Whether the popup should be shown
 */
export function shouldShowPopup(popupType) {
  // If popup type doesn't exist in config or is explicitly false, don't show it
  return popupConfig[popupType] === true;
}

/**
 * Disable a specific popup
 * @param {string} popupType - The type of popup to disable
 */
export function disablePopup(popupType) {
  if (popupType in popupConfig) {
    popupConfig[popupType] = false;
  }
}

/**
 * Enable a specific popup
 * @param {string} popupType - The type of popup to enable
 */
export function enablePopup(popupType) {
  if (popupType in popupConfig) {
    popupConfig[popupType] = true;
  }
}

/**
 * Disable all marketing popups at once
 */
export function disableAllMarketingPopups() {
  popupConfig.newsletterSubscription = false;
  popupConfig.ratingRequest = false;
  popupConfig.newFeatureAnnouncement = false;
  // Add any other marketing popups here
}
