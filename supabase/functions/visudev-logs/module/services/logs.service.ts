import type { CreateLogDto, LogResponseDto } from "../dto/index.ts";
import { LogsRepository } from "../internal/repositories/logs.repository.ts";
import { BaseService } from "./base.service.ts";

export class LogsService extends BaseService {
  constructor(private readonly repository: LogsRepository) {
    super();
  }

  public listLogs(projectId: string): Promise<LogResponseDto[]> {
    this.logger.info("Listing logs", { projectId });
    return this.repository.listLogs(projectId);
  }

  public getLog(projectId: string, logId: string): Promise<LogResponseDto | null> {
    this.logger.info("Fetching log", { projectId, logId });
    return this.repository.getLog(projectId, logId);
  }

  public createLog(projectId: string, payload: CreateLogDto): Promise<LogResponseDto> {
    this.logger.info("Creating log", { projectId });
    return this.repository.createLog(projectId, payload);
  }

  public async deleteLog(projectId: string, logId: string): Promise<void> {
    this.logger.info("Deleting log", { projectId, logId });
    await this.repository.deleteLog(projectId, logId);
  }

  public deleteAllLogs(projectId: string): Promise<number> {
    this.logger.info("Deleting all logs", { projectId });
    return this.repository.deleteAllLogs(projectId);
  }
}
