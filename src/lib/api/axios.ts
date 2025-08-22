import axios from 'axios';

export const apiClient = axios.create({
  baseURL: 'https://api-rs.dexcelerate.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  config => {
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    if (error.response?.status === 401) {
      console.error('Unauthorized request');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
