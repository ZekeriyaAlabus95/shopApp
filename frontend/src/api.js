const API_BASE_URL = "https://shop.zakariyaalabous.vip"; // your backend base URL

// 🧩 Helper: get current user
const getCurrentUser = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

// 🧩 Helper: create headers
const createHeaders = (extra = {}) => {
  const user = getCurrentUser();
  const headers = {
    "Content-Type": "application/json",
    ...extra,
  };
  if (user && user.user_id) {
    headers["X-User-ID"] = user.user_id.toString();
  }
  return headers;
};

// 🧩 Helper: unified API call
const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    ...options,
    headers: createHeaders(options.headers),
  };

  try {
    const res = await fetch(url, config);
    // Handle no-content
    if (res.status === 204) return {};

    const contentType = res.headers.get("content-type") || "";
    let data;
    if (contentType.includes("application/json")) {
      data = await res.json();
    } else {
      const text = await res.text();
      if (!res.ok) throw new Error(text || "Request failed");
      try {
        data = JSON.parse(text);
      } catch (_) {
        data = { message: text };
      }
    }

    if (!res.ok) throw new Error(data.error || data.message || "Request failed");
    return data;
  } catch (err) {
    console.error("API error:", err);
    throw err;
  }
};

// ======================
// 🔐 AUTH API
// ======================
export const authAPI = {
  register: async (username, password) => {
    const res = await apiCall("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    if (res && res.user_id && res.username) {
      return { user: { user_id: res.user_id, username: res.username } };
    }
    return res;
  },

  login: async (username, password) => {
    const res = await apiCall("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    if (res && res.user) {
      localStorage.setItem("user", JSON.stringify(res.user));
    }
    return res;
  },
};

// ======================
// 📦 PRODUCTS API
// ======================
export const productsAPI = {
  listAll: () => apiCall("/api/products/list"),

  findByBarcode: (barcode) =>
    apiCall(`/api/products/findByBarcode?barcode=${encodeURIComponent(barcode)}`),

  addProduct: (data) =>
    apiCall("/api/products/addProduct", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  addOrIncrease: (data) =>
    apiCall("/api/products/addOrIncrease", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateProduct: (data) =>
    apiCall("/api/products/update", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  updateAllProducts: (data) =>
    apiCall("/api/products/updateAllProducts", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  sellProduct: (items) =>
    apiCall("/api/products/sell", {
      method: "POST",
      body: JSON.stringify({ items }),
    }),
};

// ======================
// 🏷️ SOURCES API
// ======================
export const sourcesAPI = {
  listAll: () => apiCall("/api/sources/list"),

  addSource: (data) =>
    apiCall("/api/sources/addSource", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateSource: (data) =>
    apiCall("/api/sources/updateSource", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteSource: (ids) =>
    apiCall("/api/sources/deleteSource", {
      method: "DELETE",
      body: JSON.stringify({ source_ids: ids }),
    }),
};

// ======================
// 💰 TRANSACTIONS API
// ======================
export const transactionsAPI = {
  listAll: () => apiCall("/api/transactions/list"),

  addTransaction: (data) =>
    apiCall("/api/transactions/add", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    

getItems: (transaction_id) =>
    apiCall(`/api/transactions/items?transaction_id=${transaction_id}`, {
      method: "GET",
    }),

  getTransactionItems: (id) =>
    apiCall(`/api/transactions/items?transaction_id=${id}`),

  deleteTransactions: (ids) =>
    apiCall("/api/transactions/delete", {
      method: "DELETE",
      body: JSON.stringify({ transaction_ids: ids }),
    }),
};
