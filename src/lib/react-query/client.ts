import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Time in milliseconds that data remains fresh
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Time in milliseconds that data is cached
      gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
      // Retry failed requests 3 times
      retry: 3,
      // Retry delay that increases exponentially
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus
      refetchOnWindowFocus: false,
      // Refetch on reconnect
      refetchOnReconnect: true,
      // Refetch on mount if data is stale
      refetchOnMount: true,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
      // Retry delay for mutations
      retryDelay: 1000,
    },
  },
});
