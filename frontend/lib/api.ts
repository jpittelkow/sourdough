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

      // Handle 403 with requires_2fa_setup - redirect to security page to set up 2FA
      if (
        error.response.status === 403 &&
        error.response.data?.requires_2fa_setup === true
      ) {
        if (
          typeof window !== "undefined" &&
          !isRedirecting &&
          !window.location.pathname.includes("/configuration/security")
        ) {
          isRedirecting = true;
          window.location.replace("/configuration/security");
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

// File Manager API (admin only)
export const fileManagerApi = {
  listFiles: (path?: string, page = 1, perPage = 50) =>
    api.get<{ items: FileManagerItem[]; total: number }>("/storage/files", {
      params: { path: path || "", page, per_page: perPage },
    }),

  getFile: (path: string) =>
    api.get<FileManagerItem & { previewUrl?: string | null }>(
      `/storage/files/${encodeURIComponent(path)}`
    ),

  uploadFiles: (path: string, files: File[]) => {
    const formData = new FormData();
    formData.append("path", path);
    files.forEach((f) => formData.append("files[]", f));
    return api.post<{
      message: string;
      uploaded: { path: string; name: string; size: number }[];
      errors?: string[];
    }>("/storage/files", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  downloadFile: (path: string) =>
    api.get(`/storage/files/${encodeURIComponent(path)}/download`, {
      responseType: "blob",
    }),

  deleteFile: (path: string) =>
    api.delete(`/storage/files/${encodeURIComponent(path)}`),

  renameFile: (path: string, name: string) =>
    api.put<{ message: string; path: string }>(
      `/storage/files/${encodeURIComponent(path)}/rename`,
      { name }
    ),

  moveFile: (path: string, destination: string) =>
    api.put<{ message: string; path: string }>(
      `/storage/files/${encodeURIComponent(path)}/move`,
      { destination }
    ),
};

export type FileManagerItem = {
  name: string;
  path: string;
  size: number | null;
  mimeType: string | null;
  lastModified: number | null;
  isDirectory: boolean;
};
