// API Configuration for FareFlow Backend
export const API_BASE_URL = 'http://localhost:8080/api';

/**
 * Make authenticated API request
 */
export async function apiRequest(endpoint, options = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  // Handle 401 - redirect to signin
  if (response.status === 401 && typeof window !== 'undefined') {
    localStorage.clear();
    window.location.href = '/signin';
    throw new Error('Unauthorized');
  }

  return response;
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
    window.location.href = '/signin';
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
