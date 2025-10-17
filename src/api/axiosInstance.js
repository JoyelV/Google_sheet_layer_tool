import axios from "axios";
import secureLocalStorage from "react-secure-storage";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = secureLocalStorage.getItem("token");
  if (token) config.headers["Authorization"] = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      originalRequest.url.includes("/api/auth/refresh") ||
      originalRequest.url.includes("/api/auth/login")
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        console.log("Attempting token refresh");
        const { data, headers } = await axios.post(
          `${process.env.REACT_APP_API_BASE_URL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );
        console.log("Refresh Response:", data);
        console.log(
          "Set-Cookie Header:",
          headers["set-cookie"] || "No new cookies"
        );

        const newAccessToken = data.accessToken || data.data?.accessToken;
        if (!newAccessToken)
          throw new Error("No new access token in refresh response");

        secureLocalStorage.setItem("token", newAccessToken);
        if (data.data?.user) {
          secureLocalStorage.setItem("user", data.data.user);
        }

        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error(
          "Refresh Error:",
          refreshError.response?.data || refreshError.message
        );
        secureLocalStorage.removeItem("token");
        secureLocalStorage.removeItem("user");
        window.location.href = "/";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
