import type { Context } from "hono";

export type AsyncHandler = (c: Context) => Promise<Response>;

export function asyncHandler(handler: AsyncHandler): (c: Context) => Promise<Response> {
  return async (c: Context): Promise<Response> => {
    try {
      return await handler(c);
    } catch (error) {
      throw error;
    }
  };
}
