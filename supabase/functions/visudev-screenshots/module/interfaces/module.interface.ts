export interface LoggerLike {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
}

export interface SupabaseError {
  message: string;
}

export interface SupabaseStorageBucket {
  name: string;
}

export interface SupabaseStorageBucketClient {
  upload(
    path: string,
    data: Uint8Array,
    options: { contentType: string; upsert?: boolean },
  ): Promise<{ error: SupabaseError | null }>;
  getPublicUrl(path: string): {
    data: { publicUrl: string } | null;
    error: SupabaseError | null;
  };
}

export interface SupabaseStorageClient {
  listBuckets(): Promise<{ data: SupabaseStorageBucket[] | null; error: SupabaseError | null }>;
  createBucket(
    name: string,
    options?: { public?: boolean },
  ): Promise<{ error: SupabaseError | null }>;
  from(bucket: string): SupabaseStorageBucketClient;
}

export interface SupabaseClientLike {
  storage: SupabaseStorageClient;
}

export interface ScreenshotsModuleSettings {
  apiKey?: string;
  apiBaseUrl: string;
  bucketName: string;
  bucketPublic: boolean;
  format: string;
  viewportWidth: number;
  viewportHeight: number;
  deviceScaleFactor: number;
  fullPage: boolean;
  delaySeconds: number;
}

export interface ScreenshotsModuleConfig {
  supabase: SupabaseClientLike;
  logger: LoggerLike;
  config: ScreenshotsModuleSettings;
}
