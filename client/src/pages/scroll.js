import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import useScrollStore from './scrollStore';

const ScrollSaver = () => {
  const location = useLocation();
  const setScrollPosition = useScrollStore((state) => state.setScrollPosition);

  useEffect(() => {
    return () => {
      // Save the current scroll position before unmounting
      setScrollPosition(location.pathname, window.scrollY);
    };
  }, [location.pathname, setScrollPosition]);

  return null;
};

export default ScrollSaver;
