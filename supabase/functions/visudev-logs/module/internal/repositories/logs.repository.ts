import { BaseService } from "../../services/base.service.ts";
import type { CreateLogDto, LogResponseDto } from "../../dto/index.ts";
import { RepositoryException } from "../exceptions/index.ts";

export class LogsRepository extends BaseService {
  public async listLogs(projectId: string): Promise<LogResponseDto[]> {
    const records = await this.listByPrefix<LogResponseDto>(
      `logs:${projectId}:`,
    );
    return records;
  }

  public getLog(
    projectId: string,
    logId: string,
  ): Promise<LogResponseDto | null> {
    return this.getValue<LogResponseDto>(this.getKey(projectId, logId));
  }

  public async createLog(
    projectId: string,
    payload: CreateLogDto,
  ): Promise<LogResponseDto> {
    const timestamp = new Date().toISOString();
    const id = `${timestamp}:${crypto.randomUUID()}`;
    const log: LogResponseDto = {
      ...payload,
      projectId,
      timestamp,
      id,
    };
    await this.setValue(this.getKey(projectId, id), log);
    return log;
  }

  public async deleteLog(projectId: string, logId: string): Promise<void> {
    await this.deleteValue(this.getKey(projectId, logId));
  }

  public async deleteAllLogs(projectId: string): Promise<number> {
    const records = await this.listLogs(projectId);
    const keys = records.map((log) => this.getKey(projectId, log.id));
    if (keys.length === 0) {
      return 0;
    }
    await this.deleteMany(keys);
    return keys.length;
  }

  private getKey(projectId: string, logId: string): string {
    return `logs:${projectId}:${logId}`;
  }

  private async getValue<T>(key: string): Promise<T | null> {
    const { data, error } = await this.supabase
      .from(this.config.kvTableName)
      .select("value")
      .eq("key", key)
      .maybeSingle();

    if (error) {
      this.logger.error("KV fetch failed", { key, error: error.message });
      throw new RepositoryException(error.message);
    }

    return (data?.value as T | null) ?? null;
  }

  private async setValue<T>(key: string, value: T): Promise<void> {
    const { error } = await this.supabase.from(this.config.kvTableName).upsert({
      key,
      value,
    });

    if (error) {
      this.logger.error("KV upsert failed", { key, error: error.message });
      throw new RepositoryException(error.message);
    }
  }

  private async deleteValue(key: string): Promise<void> {
    const { error } = await this.supabase.from(this.config.kvTableName).delete()
      .eq("key", key);

    if (error) {
      this.logger.error("KV delete failed", { key, error: error.message });
      throw new RepositoryException(error.message);
    }
  }

  private async deleteMany(keys: string[]): Promise<void> {
    const { error } = await this.supabase.from(this.config.kvTableName).delete()
      .in("key", keys);

    if (error) {
      this.logger.error("KV bulk delete failed", {
        keysCount: keys.length,
        error: error.message,
      });
      throw new RepositoryException(error.message);
    }
  }

  private async listByPrefix<T>(prefix: string): Promise<T[]> {
    const { data, error } = await this.supabase
      .from(this.config.kvTableName)
      .select("key, value")
      .like("key", `${prefix}%`);

    if (error) {
      this.logger.error("KV list failed", { prefix, error: error.message });
      throw new RepositoryException(error.message);
    }

    return (data ?? []).map((row) => row.value as T);
  }
}
