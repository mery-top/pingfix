const RAW_BASE_URL = (import.meta.env.VITE_API_URL || "https://www.pingfix.xyz").trim();

export const API_BASE_URL = RAW_BASE_URL.replace(/\/+$/, "");

export function apiUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}
