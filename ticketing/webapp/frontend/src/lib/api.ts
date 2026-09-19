import axios from "axios";

// credentials: "include" so the httpOnly session cookie is sent with every request.
export const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});
