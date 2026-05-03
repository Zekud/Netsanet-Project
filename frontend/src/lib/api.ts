// Axios API client — pre-configured with base URL and JWT interceptor.
// All API calls go through this instance to automatically attach the auth token.

import axios from 'axios';
import { supabase } from './supabase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach the Supabase access token to every request
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();

  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }

  return config;
});

// Response interceptor — unwrap errors cleanly.
// We do NOT auto-redirect on 401 here because the ProtectedRoute
// and AuthContext handle session expiry naturally.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
