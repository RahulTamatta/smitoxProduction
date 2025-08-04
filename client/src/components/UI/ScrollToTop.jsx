import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * This component handles scrolling to top when navigating between routes
 * and preserves scroll position when using browser back/forward navigation
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Keep track of how the user got to this page
    const popStateHandler = () => {
      // If navigating via browser back/forward buttons, try to restore scroll position
      const scrollY = sessionStorage.getItem(`scrollPos:${pathname}`);
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY, 10));
      }
    };

    const saveScrollPosition = () => {
      // Save scroll position for current path before leaving
      sessionStorage.setItem(`scrollPos:${pathname}`, window.scrollY);
    };

    // Add event listeners
    window.addEventListener('popstate', popStateHandler);
    window.addEventListener('beforeunload', saveScrollPosition);

    // On regular navigation (not back/forward), scroll to top
    if (window.history.state && window.history.state.type !== 'popstate') {
      window.scrollTo(0, 0);
    }

    // Clean up event listeners
    return () => {
      window.removeEventListener('popstate', popStateHandler);
      window.removeEventListener('beforeunload', saveScrollPosition);
      saveScrollPosition(); // Save position when unmounting as well
    };
  }, [pathname]);

  return null;
};

// Make sure to use default export
export default ScrollToTop;
