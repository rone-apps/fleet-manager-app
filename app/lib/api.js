// API Configuration for FareFlow Backend with Multi-Backend Support
// Each company has its own backend instance

/**
 * Resolve the backend URL for a given company ID
 * In production, each company gets their own subdomain
 * In development, each company gets a different port
 */
function resolveBackendUrl(companyId) {
  if (!companyId) {
    throw new Error('Company ID is required');
  }

  const normalizedId = companyId.toLowerCase().trim();
  
  // Production: use subdomain pattern
  if (process.env.NODE_ENV === 'production') {
    const apiPattern = process.env.NEXT_PUBLIC_API_URL_PATTERN || 
                      'https://api-{company}.fareflow.com';
    return apiPattern.replace('{company}', normalizedId);
  }
  
  // Development: use port mapping
  // You can configure specific URLs via environment variables
  const envKey = `NEXT_PUBLIC_API_${normalizedId.toUpperCase()}`;
  const specificUrl = process.env[envKey];
  
  if (specificUrl) {
    return specificUrl;
  }
  
  // Default port pattern for development (you can adjust these)
  const devPorts = {
    'bonnys': 8081,
    'bonny': 8081,
    'maclures': 8082,
    'mac-cabs': 8082,
  };
  
  const port = devPorts[normalizedId] || 8080;
  return `http://localhost:${port}/api`;
}

/**
 * Get the API base URL for the current company
 */
export function getApiBaseUrl() {
  if (typeof window === 'undefined') return null;
  
  const companyId = localStorage.getItem('companyId');
  if (!companyId) return null;
  
  return resolveBackendUrl(companyId);
}

/**
 * Get current company ID from localStorage
 */
export function getCompanyId() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('companyId');
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
    document.cookie = 'companyId=; path=/; max-age=0; SameSite=Strict';
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
 * Routes to the correct backend based on the stored company ID
 */
export async function apiRequest(endpoint, options = {}) {
  // Validate token before making request
  if (!validateToken()) {
    throw new Error('Authentication required');
  }

  const token = localStorage.getItem('token');
  const apiBaseUrl = getApiBaseUrl();
  
  if (!apiBaseUrl) {
    throw new Error('Company information not found. Please login again.');
  }
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${apiBaseUrl}${endpoint}`, config);

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
 * Make a login request to a specific company's backend
 * This is used during login before we have a stored company ID
 */
export async function loginRequest(companyId, username, password) {
  const apiBaseUrl = resolveBackendUrl(companyId);
  
  try {
    const response = await fetch(`${apiBaseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    return response;
  } catch (error) {
    if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
      throw new Error('Unable to connect to server. Invalid company ID or service unavailable.');
    }
    throw error;
  }
}

/**
 * Health check for a specific company's backend
 * Returns true if the backend is reachable
 */
export async function healthCheck(companyId) {
  try {
    const apiBaseUrl = resolveBackendUrl(companyId);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(`${apiBaseUrl}/actuator/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
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
  return !!localStorage.getItem('token') && !!localStorage.getItem('companyId');
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
    document.cookie = 'companyId=; path=/; max-age=0; SameSite=Strict';
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
 * Get standard headers for authenticated requests
 * Use this when you need to make direct fetch calls instead of using apiRequest
 */
export function getAuthHeaders(contentType = 'application/json') {
  const token = localStorage.getItem('token');
  
  const headers = {
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
  
  if (contentType) {
    headers['Content-Type'] = contentType;
  }
  
  return headers;
}

/**
 * Company-aware fetch wrapper
 * Use this as a drop-in replacement for fetch() when making authenticated API calls
 * Automatically includes Authorization header and routes to correct backend
 */
export async function companyFetch(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const apiBaseUrl = getApiBaseUrl();
  
  if (!apiBaseUrl) {
    throw new Error('Company information not found. Please login again.');
  }
  
  // Don't set Content-Type for FormData (let browser set it with boundary)
  const isFormData = options.body instanceof FormData;
  
  const config = {
    ...options,
    headers: {
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...(!isFormData && { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
  };
  
  return fetch(`${apiBaseUrl}${endpoint}`, config);
}

// Backwards compatibility - keep old function names
export const tenantFetch = companyFetch;
export const getTenantId = getCompanyId;
export const getTenantSchema = getCompanyId;
export const API_BASE_URL = '/api'; // Kept for backwards compatibility, but not used with new system
