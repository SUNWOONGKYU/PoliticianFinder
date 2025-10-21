// React Query Client Configuration for Caching and Performance
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Cache keys for consistent caching
export const queryKeys = {
  politicians: {
    all: ['politicians'] as const,
    lists: () => [...queryKeys.politicians.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.politicians.lists(), filters] as const,
    details: () => [...queryKeys.politicians.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.politicians.details(), id] as const,
  },
  user: {
    current: ['user', 'current'] as const,
    profile: (id: string) => ['user', 'profile', id] as const,
    bookmarks: ['user', 'bookmarks'] as const,
    comments: ['user', 'comments'] as const,
    notifications: ['user', 'notifications'] as const,
  },
  comments: {
    all: ['comments'] as const,
    byPolitician: (politicianId: string) => ['comments', 'politician', politicianId] as const,
    byUser: (userId: string) => ['comments', 'user', userId] as const,
  },
  bookmarks: {
    all: ['bookmarks'] as const,
    byUser: (userId: string) => ['bookmarks', 'user', userId] as const,
  },
};