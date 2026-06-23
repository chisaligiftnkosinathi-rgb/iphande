import axios from 'axios';

export const API_BASE_URL = 'https://iphande-production.up.railway.app';

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});