import useSWR from 'swr';
import { api, endpoints } from '@/lib/api';
import type { Sign, SignCategory } from '@/types';

const fetcher = async (url: string) => {
  const response = await api.get(url);
  return response.data;
};

export function useSigns() {
  const { data, error, isLoading, mutate } = useSWR<Sign[]>(
    endpoints.getSigns,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  return {
    signs: data || [],
    isLoading,
    error,
    mutate,
  };
}

export function useSign(signId: string | null) {
  const { data, error, isLoading } = useSWR<Sign>(
    signId ? endpoints.getSignById(signId) : null,
    fetcher
  );

  return {
    sign: data,
    isLoading,
    error,
  };
}

export function useCategories() {
  const { data, error, isLoading } = useSWR<SignCategory[]>(
    endpoints.getCategories,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    categories: data || [],
    isLoading,
    error,
  };
}

export function useSearchSigns(query: string, category?: string) {
  const searchParams = new URLSearchParams();
  if (query) searchParams.set('q', query);
  if (category) searchParams.set('category', category);

  const { data, error, isLoading } = useSWR<Sign[]>(
    query || category ? `${endpoints.searchSigns}?${searchParams.toString()}` : null,
    fetcher,
    {
      keepPreviousData: true,
    }
  );

  return {
    results: data || [],
    isLoading,
    error,
  };
}
