import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import type { ApiResponse } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.get<ApiResponse<T>>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.put<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.delete<ApiResponse<T>>(url, config);
    return response.data;
  }

  async uploadFile<T>(url: string, file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post<ApiResponse<T>>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    return response.data;
  }
}

export const api = new ApiClient();

// Specific API endpoints
export const endpoints = {
  // Recognition
  startRecognition: '/api/recognition/start',
  stopRecognition: '/api/recognition/stop',
  getRecognitionHistory: '/api/recognition/history',

  // Dictionary
  getSigns: '/api/dictionary/signs',
  getSignById: (id: string) => `/api/dictionary/signs/${id}`,
  getCategories: '/api/dictionary/categories',
  searchSigns: '/api/dictionary/search',

  // Practice
  getExercises: '/api/practice/exercises',
  getExerciseById: (id: string) => `/api/practice/exercises/${id}`,
  submitExercise: '/api/practice/submit',
  getUserProgress: '/api/practice/progress',

  // User
  getUser: '/api/user/profile',
  updateUser: '/api/user/profile',
  getAchievements: '/api/user/achievements',

  // Videos
  getVideoUrl: (signId: string) => `/api/videos/${signId}`,
  uploadVideo: '/api/videos/upload',
};
