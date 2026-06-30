import { apiClient } from "./client";

export const authApi = {
  register: (email: string, password: string) =>
    apiClient.post("/auth/register", { email, password }),

  login: (email: string, password: string) =>
    apiClient.post("/auth/login", { email, password }),

  me: () =>
    apiClient.get("/auth/me"),
};
