import type {
  ErdResponseDto,
  MigrationsResponseDto,
  SchemaResponseDto,
  UpdateErdDto,
  UpdateMigrationsDto,
  UpdateSchemaDto,
} from "../dto/index.ts";
import { DataRepository } from "../internal/repositories/data.repository.ts";
import { BaseService } from "./base.service.ts";

export class DataService extends BaseService {
  constructor(private readonly repository: DataRepository) {
    super();
  }

  public getSchema(projectId: string): Promise<SchemaResponseDto> {
    this.logger.info("Fetching schema", { projectId });
    return this.repository.getSchema(projectId);
  }

  public updateSchema(
    projectId: string,
    dto: UpdateSchemaDto,
  ): Promise<SchemaResponseDto> {
    this.logger.info("Updating schema", { projectId });
    return this.repository.updateSchema(projectId, dto);
  }

  public getMigrations(
    projectId: string,
  ): Promise<MigrationsResponseDto> {
    this.logger.info("Fetching migrations", { projectId });
    return this.repository.getMigrations(projectId);
  }

  public updateMigrations(
    projectId: string,
    dto: UpdateMigrationsDto,
  ): Promise<MigrationsResponseDto> {
    this.logger.info("Updating migrations", { projectId });
    return this.repository.updateMigrations(projectId, dto);
  }

  public getErd(projectId: string): Promise<ErdResponseDto> {
    this.logger.info("Fetching ERD", { projectId });
    return this.repository.getErd(projectId);
  }

  public updateErd(
    projectId: string,
    dto: UpdateErdDto,
  ): Promise<ErdResponseDto> {
    this.logger.info("Updating ERD", { projectId });
    return this.repository.updateErd(projectId, dto);
  }
}
