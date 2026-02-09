export interface LoggerLike {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
}

export interface SupabaseError {
  message: string;
}

export interface SupabaseQueryResult<T> {
  data: T | null;
  error: SupabaseError | null;
}

export interface SupabaseCountResult {
  data: unknown[] | null;
  error: SupabaseError | null;
  count: number | null;
}

export interface SupabaseMutationResult {
  error: SupabaseError | null;
}

export interface SupabaseTableClient {
  select(column: string): SupabaseTableClient;
  select(
    column: string,
    options: { count: "exact"; head: true },
  ): Promise<SupabaseCountResult>;
  eq(column: string, value: string): SupabaseTableClient;
  like(column: string, pattern: string): SupabaseTableClient;
  maybeSingle(): Promise<SupabaseQueryResult<{ value: unknown }>>;
  upsert(
    payload: { key: string; value: unknown },
  ): Promise<SupabaseMutationResult>;
  delete(): SupabaseTableClient;
}

export interface SupabaseStorageBucket {
  name: string;
}

export interface SupabaseStorageBucketClient {
  upload(
    path: string,
    data: ArrayBuffer,
    options: { contentType: string; upsert?: boolean },
  ): Promise<SupabaseMutationResult>;
  createSignedUrl(
    path: string,
    expiresIn: number,
  ): Promise<
    { data: { signedUrl: string } | null; error: SupabaseError | null }
  >;
}

export interface SupabaseStorageClient {
  listBuckets(): Promise<
    { data: SupabaseStorageBucket[] | null; error: SupabaseError | null }
  >;
  createBucket(
    name: string,
    options?: { public?: boolean },
  ): Promise<SupabaseMutationResult>;
  from(bucket: string): SupabaseStorageBucketClient;
}

export interface SupabaseClientLike {
  from(table: string): SupabaseTableClient;
  rpc<T = unknown>(
    fn: string,
    params: Record<string, unknown>,
  ): Promise<SupabaseQueryResult<T>>;
  storage: SupabaseStorageClient;
}

export interface AnalyzerScreenshotConfig {
  apiBaseUrl: string;
  apiKey?: string;
  bucketName: string;
  viewportWidth: number;
  viewportHeight: number;
  deviceScaleFactor: number;
  imageQuality: number;
  format: string;
  blockAds: boolean;
  blockCookieBanners: boolean;
  blockTrackers: boolean;
  cacheTtlSeconds: number;
  delayMs: number;
  signedUrlTtlSeconds: number;
}

export interface AnalyzerAnthropicConfig {
  apiKey?: string;
  apiBaseUrl: string;
  model: string;
  maxTokens: number;
  version: string;
}

export interface AnalyzerModuleSettings {
  kvTableName: string;
  githubApiBaseUrl: string;
  analysisFileLimit: number;
  analysisProgressLogEvery: number;
  fallbackRoutes: Array<{ path: string; name: string }>;
  screenshot: AnalyzerScreenshotConfig;
  anthropic: AnalyzerAnthropicConfig;
}

export interface AnalyzerModuleConfig {
  supabase: SupabaseClientLike;
  logger: LoggerLike;
  config: AnalyzerModuleSettings;
}
