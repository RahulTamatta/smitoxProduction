// ===================================
// COMMON UTILITIES HOOKS
// ===================================

import { useState, useEffect } from 'react';

// Hook for window resize
export function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}

// Hook for request status
export function useRequest() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const startRequest = () => setLoading(true);
  const endRequest = () => setLoading(false);
  const setRequestError = (msg: string) => setError(msg);
  const setRequestSuccess = (msg: string) => setSuccess(msg);

  return {
    loading,
    error,
    success,
    startRequest,
    endRequest,
    setRequestError,
    setRequestSuccess
  };
}

// Hook for managing input fields
export function useInput(initialValue: string) {
  const [value, setValue] = useState(initialValue);
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value);
  return {
    value,
    onChange,
    setValue
  };
}

