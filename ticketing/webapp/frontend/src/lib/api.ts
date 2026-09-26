import axios from "axios";

// credentials: "include" so the httpOnly session cookie is sent with every request.
export const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// Echo the double-submit CSRF cookie back as a header on every request so the
// backend's csrfProtection middleware can verify same-origin state changes.
api.interceptors.request.use((config) => {
  const token = readCookie("csrfToken");
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>)["X-CSRF-Token"] = token;
  }
  return config;
});
