import { apiClient } from "./client";

export const mediaApi = {
  upload: async (file: any) => {
    const formData = new FormData();

    formData.append("file", {
      uri: file.uri,
      name: file.name || "upload.jpg",
      type: file.type || "image/jpeg",
    } as any);

    return apiClient.post("/media/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  getAll: () =>
    apiClient.get("/media"),
};
