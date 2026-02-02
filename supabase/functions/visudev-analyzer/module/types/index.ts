import type { ErrorDetailsEntry } from "../internal/exceptions/index.ts";

export interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ErrorDetailsEntry[];
  };
}
