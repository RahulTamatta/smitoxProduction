import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import useScrollStore from './scrollStore';

const ScrollRestorer = () => {
  const location = useLocation();
  const getScrollPosition = useScrollStore(
    (state) => state.getScrollPosition
  );

  useEffect(() => {
    const savedScrollPosition = getScrollPosition(location.pathname);
    window.scrollTo(0, savedScrollPosition);
  }, [location.pathname, getScrollPosition]);

  return null;
};

export default ScrollRestorer;
