import { apiClient } from "./client";

export const profileApi = {
  getMe: () =>
    apiClient.get("/profiles/me"),

  update: (data: any) =>
    apiClient.patch("/profiles/me", data),
};
