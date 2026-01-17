// API Configuration for FareFlow Backend
// Uses relative path '/api' which is proxied to the backend via next.config.js rewrites
// The proxy destination is configured via NEXT_PUBLIC_API_BASE_URL environment variable
// This works for both local development and production without hardcoded URLs
export const API_BASE_URL = '/api';

/**
 * Get current tenant ID (display ID) from localStorage
 */
export function getTenantId() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('tenantId');
}

/**
 * Get current tenant schema (database name) from localStorage
 */
export function getTenantSchema() {
  if (typeof window === 'undefined') return null;
  // Fall back to tenantId for backwards compatibility
  return localStorage.getItem('tenantSchema') || localStorage.getItem('tenantId');
}

/**
 * Get current tenant name from localStorage
 */
export function getTenantName() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('tenantName');
}

/**
 * Handle authentication errors by clearing storage and redirecting to signin
 */
function handleAuthError() {
  if (typeof window !== 'undefined') {
    localStorage.clear();
    sessionStorage.clear();
    // Clear cookies
    document.cookie = 'token=; path=/; max-age=0; SameSite=Strict';
    document.cookie = 'tenantId=; path=/; max-age=0; SameSite=Strict';
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
 * Includes tenant schema header for multi-tenancy support (database switching)
 */
export async function apiRequest(endpoint, options = {}) {
  // Validate token before making request
  if (!validateToken()) {
    throw new Error('Authentication required');
  }

  const token = localStorage.getItem('token');
  const tenantSchema = getTenantSchema(); // Use schema name for DB switching
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...(tenantSchema && { 'X-Tenant-ID': tenantSchema }), // Schema name goes to backend
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
 * Logout user - redirects to homepage (landing page)
 */
export function logout() {
  if (typeof window !== 'undefined') {
    localStorage.clear();
    sessionStorage.clear();
    // Clear cookies
    document.cookie = 'token=; path=/; max-age=0; SameSite=Strict';
    document.cookie = 'tenantId=; path=/; max-age=0; SameSite=Strict';
    // Redirect to homepage instead of signin - user will see the landing page
    window.location.replace('/');
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

/**
 * Get standard headers for authenticated requests with tenant support
 * Use this when you need to make direct fetch calls instead of using apiRequest
 */
export function getAuthHeaders(contentType = 'application/json') {
  const token = localStorage.getItem('token');
  const tenantSchema = getTenantSchema();
  
  const headers = {
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...(tenantSchema && { 'X-Tenant-ID': tenantSchema }),
  };
  
  if (contentType) {
    headers['Content-Type'] = contentType;
  }
  
  return headers;
}

/**
 * Tenant-aware fetch wrapper
 * Use this as a drop-in replacement for fetch() when making authenticated API calls
 * Automatically includes Authorization and X-Tenant-ID headers
 */
export async function tenantFetch(url, options = {}) {
  const token = localStorage.getItem('token');
  const tenantSchema = getTenantSchema();
  
  // Don't set Content-Type for FormData (let browser set it with boundary)
  const isFormData = options.body instanceof FormData;
  
  const config = {
    ...options,
    headers: {
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...(tenantSchema && { 'X-Tenant-ID': tenantSchema }),
      ...(!isFormData && { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
  };
  
  return fetch(url, config);
}
