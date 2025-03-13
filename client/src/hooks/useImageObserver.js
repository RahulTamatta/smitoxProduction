import { useEffect, useRef, useState } from 'react';

/**
 * A hook that observes when an element enters the viewport
 * @param {Object} options - IntersectionObserver options
 * @param {number} options.threshold - Between 0 and 1, percentage of element visible
 * @param {string} options.rootMargin - CSS margin string (e.g. "100px 0px")
 * @returns {Object} - Reference to observe, and boolean indicating if element is visible
 */
const useImageObserver = (options = {}) => {
  const elementRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const defaultOptions = {
    threshold: 0.1,
    rootMargin: '200px 0px' // Load images 200px before they enter viewport
  };

  const observerOptions = { ...defaultOptions, ...options };

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && !isLoaded) {
        setIsVisible(true);
        setIsLoaded(true);
        // Once the image is loaded, we no longer need to observe it
        if (elementRef.current) {
          observer.unobserve(elementRef.current);
        }
      }
    }, observerOptions);

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [observerOptions, isLoaded]);

  return { elementRef, isVisible, isLoaded };
};

export default useImageObserver;
