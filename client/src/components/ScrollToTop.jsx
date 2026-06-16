import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop - fires on every route/pathname change and scrolls to the top.
 * Works like Amazon/Flipkart: browser scroll restoration is set to 'manual'
 * in index.jsx, so this has full, uncontested control.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Use 'instant' (no animation) so it feels like a real page load.
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    
    // Fallback for browsers/CSS configurations where body or documentElement 
    // acts as the scroll container instead of the window.
    if (document.body) {
      document.body.scrollTop = 0;
    }
    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
    }
  }, [pathname]);

  return null;
};

export default ScrollToTop;
