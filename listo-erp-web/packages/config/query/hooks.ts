import { useMutation, useQuery, type UseMutationOptions, type UseQueryOptions } from '@tanstack/react-query';
import { api } from '../api';
import type { RequestConfig } from '../http/types';

type HttpMethod = 'post' | 'put' | 'patch' | 'delete';

interface MutationConfig<TRequest> extends Omit<RequestConfig, 'body'> {
  requiresAuth?: boolean;
  transformRequest?: (data: TRequest) => unknown;
}

export function useApiMutation<TResponse, TRequest = void>(
  endpoint: string,
  method: HttpMethod = 'post',
  config?: MutationConfig<TRequest>,
  options?: Omit<UseMutationOptions<TResponse, Error, TRequest>, 'mutationFn'>
) {
  const { transformRequest, requiresAuth = true, ...requestConfig } = config || {};

  const mutation = useMutation<TResponse, Error, TRequest>({
    mutationFn: async (data: TRequest) => {
      const body = transformRequest ? transformRequest(data) : data;
      return api[method]<TResponse>(endpoint, {
        ...requestConfig,
        body,
        requiresAuth,
      });
    },
    ...options,
  });

  const mutate = (
    request: TRequest,
    onSuccess?: (data: TResponse) => void
  ) => {
    mutation.mutate(request, { onSuccess });
  };

  return [mutate, mutation.isPending, mutation.error, mutation.data] as const;
}

export function useApiQuery<TResponse>(
  queryKey: unknown[],
  endpoint: string,
  config?: RequestConfig & { requiresAuth?: boolean },
  options?: Omit<UseQueryOptions<TResponse, Error>, 'queryKey' | 'queryFn'>
) {
  const query = useQuery<TResponse, Error>({
    queryKey,
    queryFn: () => api.get<TResponse>(endpoint, config),
    ...options,
  });

  return [query.data, query.isLoading, query.error, query] as const;
}
