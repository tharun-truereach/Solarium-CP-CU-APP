import type { BaseQueryFn } from '@reduxjs/toolkit/query/react';
import { AxiosRequestConfig, AxiosError } from 'axios';
import { requestWithBreaker } from '../services/http/circuitBreaker';
import { createStandardError, StandardError } from '../utils/errorMap';

export interface AxiosBaseQueryArgs {
  url: string;
  method?: AxiosRequestConfig['method'];
  data?: AxiosRequestConfig['data'];
  params?: AxiosRequestConfig['params'];
  headers?: AxiosRequestConfig['headers'];
}

export const axiosBaseQuery = (
  { baseUrl }: { baseUrl: string } = { baseUrl: '' }
): BaseQueryFn<AxiosBaseQueryArgs, unknown, StandardError> => {
  return async ({ url, method = 'GET', data, params, headers }) => {
    try {
      const config: AxiosRequestConfig = {
        url: baseUrl + url,
        method,
        data,
        params,
        ...(headers && { headers }),
      };

      const result = await requestWithBreaker(config);

      return {
        data: result.data,
        meta: {
          request: config,
          response: {
            status: result.status,
            statusText: result.statusText,
            headers: result.headers,
          },
        },
      };
    } catch (axiosError) {
      if (
        axiosError instanceof Error &&
        (axiosError as any).isCircuitBreakerError
      ) {
        return {
          error: createStandardError(
            503,
            'Circuit breaker is open - service temporarily unavailable'
          ),
        };
      }

      if (axiosError instanceof Error && 'status' in axiosError) {
        return {
          error: createStandardError(
            (axiosError as any).status || 500,
            axiosError.message || 'Unknown error'
          ),
        };
      }

      const err = axiosError as AxiosError;
      return {
        error: createStandardError(err.response?.status || 0, {
          message: err.message,
          data: err.response?.data,
          config: err.config,
        }),
      };
    }
  };
};

export const defaultBaseQuery = axiosBaseQuery({
  baseUrl: '',
});
