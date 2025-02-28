# Popup Management System

This document explains how to control and suppress unwanted popups in the application.

## How to Use

To remove unwanted popups, you'll need to:

1. Import the popup manager in your component files:
   ```javascript
   import { shouldShowPopup } from '../utils/popupManager';
   ```

2. Wrap your popup rendering logic with a condition:
   ```javascript
   // Before showing any popup, check if it should be displayed
   if (shouldShowPopup('newsletterSubscription')) {
     // Show newsletter popup
   }
   ```

3. To disable popups globally, use the configuration in `utils/popupManager.js`

## Example: Removing a Marketing Popup

