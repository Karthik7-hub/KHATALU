import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  // CRITICAL: send cookies with every request
  withCredentials: true,
});

/**
 * Response interceptor: handles 401 (token expired) globally.
 * No request interceptor needed — the HTTP-only cookie is sent
 * automatically by the browser on every request.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("user");
      // Redirect to login only if not already there
      if (window.location.pathname !== "/") {
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
