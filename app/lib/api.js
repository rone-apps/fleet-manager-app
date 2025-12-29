// API Configuration for FareFlow Backend


if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
  throw new Error('NEXT_PUBLIC_API_BASE_URL is not set');
}

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;





/**
 * Handle authentication errors by clearing storage and redirecting to signin
 */
function handleAuthError() {
  if (typeof window !== 'undefined') {
    localStorage.clear();
    sessionStorage.clear();
    // Clear the token cookie
    document.cookie = 'token=; path=/; max-age=0; SameSite=Strict';
    // Use replace to prevent back button from returning to authenticated pages
    window.location.replace('/signin');
  }
}

/**
 * Check if token is expired before making requests
 */
function validateToken() {
  if (typeof window === 'undefined') return false;
  
  const token = localStorage.getItem('token');
  if (!token) {
    return false;
  }

  // Check if token is expired
  if (isTokenExpired(token)) {
    console.warn('Token expired, redirecting to login...');
    handleAuthError();
    return false;
  }

  return true;
}

/**
 * Make authenticated API request with automatic token validation and error handling
 */
export async function apiRequest(endpoint, options = {}) {
  // Validate token before making request
  if (!validateToken()) {
    throw new Error('Authentication required');
  }

  const token = localStorage.getItem('token');
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401) {
      console.warn('Received 401 from server, redirecting to login...');
      handleAuthError();
      throw new Error('Session expired. Please login again.');
    }

    // Handle 403 Forbidden - insufficient permissions
    if (response.status === 403) {
      throw new Error('You do not have permission to perform this action');
    }

    return response;
  } catch (error) {
    // Handle network errors
    if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
      throw new Error('Unable to connect to server. Please check your connection.');
    }
    throw error;
  }
}

/**
 * Get current user from localStorage
 */
export function getCurrentUser() {
  if (typeof window === 'undefined') return null;
  
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('token');
}

/**
 * Logout user
 */
export function logout() {
  if (typeof window !== 'undefined') {
    localStorage.clear();
    sessionStorage.clear();
    // Clear the token cookie
    document.cookie = 'token=; path=/; max-age=0; SameSite=Strict';
    window.location.replace('/signin');
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp && payload.exp < now;
  } catch (err) {
    return true;
  }
}
