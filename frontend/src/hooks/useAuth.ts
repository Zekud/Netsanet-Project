// useAuth hook — convenient access to the auth context.
// Throws if used outside of AuthProvider (fail fast on misuse).

import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
export type { UserRole, AuthUser } from '../context/AuthContext';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
