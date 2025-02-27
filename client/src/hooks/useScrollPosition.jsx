import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Custom hook to manage scroll position for specific routes
 * @param {Object} options - Configuration options
 * @param {boolean} options.enabled - Whether to enable scroll restoration
 * @param {string} options.key - Storage key for this route
 * @param {Array} options.deps - Dependencies to trigger scroll restoration
 */
const useScrollPosition = ({ enabled = true, key = 'scrollPosition', deps = [] }) => {
  const location = useLocation();
  
  // Save scroll position on unmount
  useEffect(() => {
    return () => {
      if (enabled) {
        sessionStorage.setItem(key, window.pageYOffset.toString());
      }
    };
  }, [enabled, key]);
  
  // Restore scroll position when deps change
  useEffect(() => {
    if (enabled) {
      const savedPosition = sessionStorage.getItem(key);
      if (savedPosition) {
        setTimeout(() => {
          window.scrollTo(0, parseInt(savedPosition, 10));
          // Only clear if we're not on the same path (for refresh cases)
          if (location.pathname !== key) {
            sessionStorage.removeItem(key);
          }
        }, 100);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, key, ...deps]);
  
  // Return functions to manually save and restore
  return {
    saveScrollPosition: () => {
      sessionStorage.setItem(key, window.pageYOffset.toString());
    },
    restoreScrollPosition: () => {
      const savedPosition = sessionStorage.getItem(key);
      if (savedPosition) {
        window.scrollTo(0, parseInt(savedPosition, 10));
      }
    },
    clearScrollPosition: () => {
      sessionStorage.removeItem(key);
    }
  };
};

export default useScrollPosition;
