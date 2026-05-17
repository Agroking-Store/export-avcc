import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { apiConfig } from "../config/apiConfig";
import { authStorage } from "../utils/authStorage";
import { toast } from "react-toastify";

const api = axios.create({
  baseURL: apiConfig.baseURL,
  timeout: apiConfig.timeout,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = authStorage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = authStorage.getRefreshToken();
        if (refreshToken) {
          const response = await axios.post(
            `${apiConfig.baseURL}/auth/refresh-token`,
            {
              refreshToken,
            },
          );

          const { accessToken } = response.data.data;
          authStorage.setToken(accessToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }

          return api(originalRequest);
        }
      } catch (refreshError) {
        authStorage.clearTokens();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    if (!(originalRequest as any)?.skipGlobalErrorToast) {
      const errorMessage =
        (error.response?.data as any)?.message || "An error occurred";
      toast.error(errorMessage);
    }

    return Promise.reject(error);
  },
);

export default api;
