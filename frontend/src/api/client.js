const RAW_BASE_URL = (import.meta.env.VITE_API_URL || "").trim();
const isVercelHost =
  typeof window !== "undefined" && window.location.hostname.endsWith("vercel.app");
const defaultBase = isVercelHost ? "" : "https://www.pingfix.xyz";
const effectiveBase = isVercelHost ? "" : (RAW_BASE_URL || defaultBase);

export const API_BASE_URL = effectiveBase.replace(/\/+$/, "");

export function apiUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}
