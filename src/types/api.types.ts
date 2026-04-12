export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  errors?: Record<string, string[]>;
}

// ✅ FIXED: Response format to match backend
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  token?: string; // For auth responses
}

// ✅ FIXED: Backend pagination format
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    current: number;
    pages: number;
    total: number;
  };
}

export interface ApiPaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ApiSearchParams extends ApiPaginationParams {
  search?: string;
  filters?: Record<string, any>;
  startDate?: string;
  endDate?: string;
}

export interface ApiResponseError {
  response: {
    data: ApiError;
    status: number;
  };
  message: string;
}
