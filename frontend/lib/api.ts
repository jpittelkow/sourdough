import axios from "axios";
import { setCorrelationId } from "@/lib/error-logger";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/api`
    : "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Flag to prevent multiple redirects
let isRedirecting = false;

// Response interceptor: capture correlation ID and handle errors
api.interceptors.response.use(
  (response) => {
    const correlationId = response.headers["x-correlation-id"];
    if (correlationId) {
      setCorrelationId(correlationId);
    }
    return response;
  },
  (error) => {
    if (error.response?.headers?.["x-correlation-id"]) {
      setCorrelationId(error.response.headers["x-correlation-id"]);
    }
    if (error.response) {
      // Server responded with error
      const message =
        error.response.data?.message ||
        error.response.data?.error ||
        "An error occurred";

      // Handle 401 (Unauthorized) - redirect to login
      if (error.response.status === 401) {
        if (
          typeof window !== "undefined" &&
          !isRedirecting &&
          !window.location.pathname.includes("/login") &&
          !window.location.pathname.includes("/register") &&
          !window.location.pathname.includes("/forgot-password")
        ) {
          isRedirecting = true;
          // Use replace to avoid adding to history, reset flag after navigation
          window.location.replace("/login");
        }
      }

      throw new Error(message);
    } else if (error.request) {
      // Request made but no response
      throw new Error("Network error - please check your connection");
    } else {
      // Error in setting up request
      throw new Error(error.message || "An error occurred");
    }
  }
);
