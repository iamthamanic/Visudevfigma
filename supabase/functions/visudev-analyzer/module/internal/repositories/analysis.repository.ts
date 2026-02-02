import { BaseService } from "../../services/base.service.ts";
import type { AnalysisRecord } from "../../dto/index.ts";
import { RepositoryException } from "../exceptions/index.ts";

export class AnalysisRepository extends BaseService {
  public async getAnalysis(id: string): Promise<AnalysisRecord | null> {
    const key = this.buildKey(id);
    const { data, error } = await this.supabase
      .from(this.config.kvTableName)
      .select("value")
      .eq("key", key)
      .maybeSingle();

    if (error) {
      this.logger.error("KV fetch failed", { key, error: error.message });
      throw new RepositoryException(error.message);
    }

    return (data?.value as AnalysisRecord | null) ?? null;
  }

  public async saveAnalysis(id: string, payload: AnalysisRecord): Promise<void> {
    const key = this.buildKey(id);
    const { error } = await this.supabase
      .from(this.config.kvTableName)
      .upsert({ key, value: payload });

    if (error) {
      this.logger.error("KV upsert failed", { key, error: error.message });
      throw new RepositoryException(error.message);
    }
  }

  private buildKey(id: string): string {
    return `analysis:${id}`;
  }
}
