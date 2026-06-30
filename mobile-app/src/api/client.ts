import axios from 'axios';
import { ENV } from '../config/env';

export const apiClient = axios.create({
    baseURL: ENV.API_BASE_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

import { storage } from '../utils/storage';

// Attach token automatically
apiClient.interceptors.request.use(async (config) => {
    const token = await storage.getToken();

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});