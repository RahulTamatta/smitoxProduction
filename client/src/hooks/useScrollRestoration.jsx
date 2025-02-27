import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Keep it as a named export to match how it's being used in App.jsx
export const useScrollRestoration = () => {
  const location = useLocation();
  const scrollKey = `scrollPosition_${location.pathname}`;

  useEffect(() => {
    // Restore scroll position when component mounts
    const storedScroll = sessionStorage.getItem(scrollKey);
    if (storedScroll) {
      setTimeout(() => {
        window.scrollTo({
          top: parseInt(storedScroll, 10),
          behavior: 'instant'
        });
        sessionStorage.removeItem(scrollKey);
      }, 0);
    }

    // Save scroll position when component unmounts
    return () => {
      sessionStorage.setItem(scrollKey, window.scrollY.toString());
    };
  }, [scrollKey, location.pathname]);

  return {
    saveScrollPosition: () => {
      sessionStorage.setItem(scrollKey, window.scrollY.toString());
    },
    restoreScrollPosition: () => {
      const savedPosition = sessionStorage.getItem(scrollKey);
      if (savedPosition) {
        window.scrollTo({
          top: parseInt(savedPosition, 10),
          behavior: 'instant'
        });
      }
    }
  };
};
