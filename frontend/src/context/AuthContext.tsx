// Global auth context — provides current user state and auth methods
// to the entire app via React Context + Supabase Auth listener.

import { createContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import api from '../lib/api';

// ─── Types ────────────────────────────────────────────────────

export type UserRole = 'survivor' | 'case_worker' | 'institution_admin' | 'system_admin';

export interface AuthUser {
  id: string;
  role: UserRole;
  display_name: string | null;
  institution_id: string | null;
  email?: string;
  phone?: string;
  anonymous_mode: boolean;
  preferred_language: string;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  requestOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

// ─── Context Creation ─────────────────────────────────────────

export const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider Component ───────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Fetch the user profile from our backend
  const fetchUserProfile = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      if (data.success && data.data) {
        setState({
          user: data.data as AuthUser,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        setState({ user: null, isLoading: false, isAuthenticated: false });
      }
    } catch {
      setState({ user: null, isLoading: false, isAuthenticated: false });
    }
  }, []);

  // Listen for Supabase auth state changes (logout, token refresh)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'TOKEN_REFRESHED' && session) {
          // Token silently refreshed — re-fetch to keep profile current
          await fetchUserProfile();
        } else if (event === 'SIGNED_OUT' || !session) {
          setState({ user: null, isLoading: false, isAuthenticated: false });
        }
        // SIGNED_IN is handled directly in verifyOtp() to avoid race conditions
      }
    );

    // Check for an existing session on mount (e.g. page refresh)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchUserProfile();
      } else {
        setState({ user: null, isLoading: false, isAuthenticated: false });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);


  // ─── Auth Methods ───────────────────────────────────────────

  const requestOtp = useCallback(async (email: string) => {
    try {
      const { data } = await api.post('/auth/request-otp', { email });
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to send OTP');
      }
    } catch (err: any) {
      if (err.response?.data?.error?.message) {
        throw new Error(err.response.data.error.message);
      }
      throw err;
    }
  }, []);

  const verifyOtp = useCallback(async (email: string, token: string): Promise<AuthUser> => {
    // Verify OTP directly with the browser Supabase client.
    // This automatically stores the session in localStorage — no setSession() needed.
    const { data: authData, error: authError } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });

    if (authError || !authData.session) {
      throw new Error(authError?.message || 'Invalid or expired OTP');
    }

    // Ensure the session is fully persisted before making authenticated requests.
    // Without this, the api interceptor's getSession() can return null briefly.
    let retries = 0;
    while (retries < 5) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) break;
      await new Promise((r) => setTimeout(r, 200));
      retries++;
    }

    // Session is now in localStorage. Fetch or auto-create our users row from the backend.
    const { data } = await api.get('/auth/me');
    if (!data.success) {
      throw new Error('Failed to load user profile');
    }

    const authUser = data.data as AuthUser;
    setState({ user: authUser, isLoading: false, isAuthenticated: true });
    return authUser;
  }, []);


  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Even if backend logout fails, clear local state
    }
    await supabase.auth.signOut();
    sessionStorage.clear();
    setState({ user: null, isLoading: false, isAuthenticated: false });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        requestOtp,
        verifyOtp,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
