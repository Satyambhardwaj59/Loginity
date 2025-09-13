import axios from "axios";

const createAxiosInstance = (backendUrl) => {
  const instance = axios.create({
    baseURL: backendUrl,
  });

  // Attach token automatically
  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  });

  return instance;
};

export default createAxiosInstance;
