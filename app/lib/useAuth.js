"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isTokenExpired, logout } from './api';

/**
 * Custom hook to manage authentication and handle token expiration
 * This hook will:
 * 1. Check token on mount
 * 2. Periodically check token expiration (every 60 seconds)
 * 3. Automatically logout and redirect if token expires
 * 
 * @param {Object} options - Configuration options
 * @param {boolean} options.requireAuth - Whether authentication is required (default: true)
 * @param {number} options.checkInterval - How often to check token in milliseconds (default: 60000)
 */
export function useAuth(options = {}) {
  const { 
    requireAuth = true,
    checkInterval = 60000 // Check every 60 seconds
  } = options;
  
  const router = useRouter();

  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;

    // Function to check and handle token expiration
    const checkTokenExpiration = () => {
      const token = localStorage.getItem('token');

      // If auth is required but no token exists
      if (requireAuth && !token) {
        console.warn('No token found, redirecting to login...');
        logout();
        return false;
      }

      // If token exists, check if it's expired
      if (token && isTokenExpired(token)) {
        console.warn('Token expired, redirecting to login...');
        logout();
        return false;
      }

      return true;
    };

    // Check immediately on mount
    const isValid = checkTokenExpiration();
    if (!isValid) return;

    // Set up periodic checking
    const intervalId = setInterval(() => {
      checkTokenExpiration();
    }, checkInterval);

    // Cleanup interval on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, [requireAuth, checkInterval, router]);
}

/**
 * Hook to check authentication on component mount only
 * Use this for pages that need a simple auth check without periodic validation
 */
export function useAuthCheck() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('token');
    
    if (!token || isTokenExpired(token)) {
      console.warn('Authentication check failed, redirecting to login...');
      logout();
    }
  }, [router]);
}
