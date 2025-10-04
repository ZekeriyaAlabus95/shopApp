// API utility functions with user authentication

const API_BASE_URL = 'http://localhost:8787'; // Adjust this to your backend URL

// Get user from localStorage
const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// Create headers with user ID
const createHeaders = (additionalHeaders = {}) => {
  const user = getCurrentUser();
  const headers = {
    'Content-Type': 'application/json',
    ...additionalHeaders
  };
  
  if (user && user.user_id) {
    headers['X-User-ID'] = user.user_id.toString();
  }
  
  return headers;
};

// Generic API call function
const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    ...options,
    headers: createHeaders(options.headers)
  };
  
  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }
    
    return data;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

// Authentication API calls
export const authAPI = {
  register: (username, password) => 
    apiCall('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    }),
    
  login: (username, password) => 
    apiCall('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    })
};

// Products API calls
export const productsAPI = {
  listAll: () => apiCall('/api/products/list'),
  
  findByBarcode: (barcode) => 
    apiCall(`/api/products/findByBarcode?barcode=${encodeURIComponent(barcode)}`),
    
  addProduct: (productData) => 
    apiCall('/api/products/addProduct', {
      method: 'POST',
      body: JSON.stringify(productData)
    }),
    
  addOrIncrease: (productData) => 
    apiCall('/api/products/addOrIncrease', {
      method: 'POST',
      body: JSON.stringify(productData)
    }),
    
  updateProduct: (productData) => 
    apiCall('/api/products/update', {
      method: 'PUT',
      body: JSON.stringify(productData)
    }),
    
  updateAllProducts: (updateData) => 
    apiCall('/api/products/updateAllProducts', {
      method: 'PUT',
      body: JSON.stringify(updateData)
    }),
    
  updateByCategory: (updateData) => 
    apiCall('/api/products/updateByCategory', {
      method: 'PUT',
      body: JSON.stringify(updateData)
    }),
    
  updateBySource: (updateData) => 
    apiCall('/api/products/updateBySource', {
      method: 'PUT',
      body: JSON.stringify(updateData)
    }),
    
  updateSelectedProducts: (updateData) => 
    apiCall('/api/products/updateSelected', {
      method: 'PUT',
      body: JSON.stringify(updateData)
    }),
    
  sellProduct: (items) => 
    apiCall('/api/products/sell', {
      method: 'POST',
      body: JSON.stringify({ items })
    }),
    
  getCategories: () => apiCall('/api/products/categories')
};

// Sources API calls
export const sourcesAPI = {
  listAll: () => apiCall('/api/sources/list'),
  
  addSource: (sourceData) => 
    apiCall('/api/sources/addSource', {
      method: 'POST',
      body: JSON.stringify(sourceData)
    }),
    
  updateSource: (sourceData) => 
    apiCall('/api/sources/updateSource', {
      method: 'PUT',
      body: JSON.stringify(sourceData)
    }),
    
  deleteSource: (sourceIds) => 
    apiCall('/api/sources/deleteSource', {
      method: 'DELETE',
      body: JSON.stringify({ source_ids: sourceIds })
    })
};
