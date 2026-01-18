// API Configuration for FareFlow Backend with Multi-Backend Support
// Each company has its own backend instance

/**
 * Resolve the backend URL for a given company ID
 */
function resolveBackendUrl(companyId) {
  if (!companyId) {
    throw new Error('Company ID is required');
  }

  const normalizedId = companyId.toLowerCase().trim();
  
  // Check for specific environment variables FIRST
  const envKey = `NEXT_PUBLIC_API_${normalizedId.toUpperCase().replace(/-/g, '_')}`;
  const specificUrl = process.env[envKey];
  
  if (specificUrl) {
    console.log(`[API] Using ${envKey}:`, specificUrl);
    return specificUrl;
  }
  
  // Fallback: Development port mapping
  const devPorts = {
    'bonnys': 8081,
    'bonny': 8081,
    'maclures': 8082,
    'mac-cabs': 8082,
    'maccabs': 8082,
  };
  
  const port = devPorts[normalizedId];
  if (port) {
    const url = `http://localhost:${port}/api`;
    console.log(`[API] Using dev port for ${normalizedId}:`, url);
    return url;
  }
  
  // Last resort: Production subdomain pattern
  const apiPattern = process.env.NEXT_PUBLIC_API_URL_PATTERN;
  if (apiPattern) {
    const url = apiPattern.replace('{company}', normalizedId);
    console.log(`[API] Using pattern for ${normalizedId}:`, url);
    return url;
  }
  
  throw new Error(`No backend URL configured for company: ${normalizedId}`);
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
    document.cookie = 'token=; path=/; max-age=0; SameSite=Strict';
    document.cookie = 'companyId=; path=/; max-age=0; SameSite=Strict';
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
    const fullUrl = `${apiBaseUrl}${endpoint}`;
    console.log(`[API Request] ${options.method || 'GET'} ${fullUrl}`);
    
    const response = await fetch(fullUrl, config);

    if (response.status === 401) {
      console.warn('Received 401 from server, redirecting to login...');
      handleAuthError();
      throw new Error('Session expired. Please login again.');
    }

    if (response.status === 403) {
      throw new Error('You do not have permission to perform this action');
    }

    return response;
  } catch (error) {
    if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
      throw new Error('Unable to connect to server. Please check your connection.');
    }
    throw error;
  }
}

/**
 * Make a login request to a specific company's backend
 */
export async function loginRequest(companyId, username, password) {
  const apiBaseUrl = resolveBackendUrl(companyId);
  
  try {
    const fullUrl = `${apiBaseUrl}/auth/login`;
    console.log(`[Login Request] POST ${fullUrl}`);
    
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    return response;
  } catch (error) {
    console.error('[Login Error]', error);
    if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
      throw new Error('Unable to connect to server. Invalid company ID or service unavailable.');
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
  return !!localStorage.getItem('token') && !!localStorage.getItem('companyId');
}

/**
 * Logout user
 */
export function logout() {
  if (typeof window !== 'undefined') {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie = 'token=; path=/; max-age=0; SameSite=Strict';
    document.cookie = 'companyId=; path=/; max-age=0; SameSite=Strict';
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
 */
export async function companyFetch(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const apiBaseUrl = getApiBaseUrl();
  
  if (!apiBaseUrl) {
    throw new Error('Company information not found. Please login again.');
  }
  
  const isFormData = options.body instanceof FormData;
  
  const config = {
    ...options,
    headers: {
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...(!isFormData && { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
  };
  
  const fullUrl = `${apiBaseUrl}${endpoint}`;
  console.log(`[Company Fetch] ${options.method || 'GET'} ${fullUrl}`);
  
  return fetch(fullUrl, config);
}

// Backwards compatibility
export const tenantFetch = companyFetch;
export const getTenantId = getCompanyId;
export const getTenantSchema = getCompanyId;
export const API_BASE_URL = '/api';
