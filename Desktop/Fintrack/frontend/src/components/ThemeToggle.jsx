import React, { useEffect } from 'react';

/**
 * ThemeToggle Component - DISABLED
 * 
 * Dark mode has been disabled.
 * Light mode only with black text throughout the application.
 */

function ThemeToggle() {
  // Force light mode and disable dark mode
  useEffect(() => {
    localStorage.setItem('theme', 'light');
    document.documentElement.removeAttribute('data-theme');
  }, []);

  // Component disabled - returns null
  return null;
}

export default ThemeToggle;
