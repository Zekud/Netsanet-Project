// TanStack Query client — central configuration for all data fetching.

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,    // 2 minutes before data is considered stale
      retry: 1,                     // retry failed requests once
      refetchOnWindowFocus: false,  // avoid unexpected refetches
    },
  },
});
