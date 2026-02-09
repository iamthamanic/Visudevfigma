import { BaseService } from "../../services/base.service.ts";
import { RepositoryException } from "../exceptions/index.ts";

export class AuthRepository extends BaseService {
  public async getValue<T>(key: string): Promise<T | null> {
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

  public async setValue<T>(key: string, value: T): Promise<void> {
    const { error } = await this.supabase.from(this.config.kvTableName).upsert({
      key,
      value,
    });

    if (error) {
      this.logger.error("KV upsert failed", { key, error: error.message });
      throw new RepositoryException(error.message);
    }
  }

  public async deleteValue(key: string): Promise<void> {
    const { error } = await this.supabase.from(this.config.kvTableName).delete()
      .eq("key", key);

    if (error) {
      this.logger.error("KV delete failed", { key, error: error.message });
      throw new RepositoryException(error.message);
    }
  }
}
