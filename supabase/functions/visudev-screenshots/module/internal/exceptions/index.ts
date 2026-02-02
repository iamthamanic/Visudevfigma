export interface ErrorDetailsEntry {
  field?: string;
  message: string;
}

export class ModuleException extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: ErrorDetailsEntry[];

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = "INTERNAL_ERROR",
    details?: ErrorDetailsEntry[],
  ) {
    super(message);
    this.name = "ModuleException";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class ValidationException extends ModuleException {
  constructor(message: string, details?: ErrorDetailsEntry[]) {
    super(message, 400, "VALIDATION_ERROR", details);
    this.name = "ValidationException";
  }
}

export class ExternalApiException extends ModuleException {
  constructor(message: string, statusCode: number = 502) {
    super(message, statusCode, "EXTERNAL_API_ERROR");
    this.name = "ExternalApiException";
  }
}

export class StorageException extends ModuleException {
  constructor(message: string) {
    super(message, 500, "STORAGE_ERROR");
    this.name = "StorageException";
  }
}

export class ServiceException extends ModuleException {
  constructor(message: string, statusCode: number = 500, code: string = "SERVICE_ERROR") {
    super(message, statusCode, code);
    this.name = "ServiceException";
  }
}

export class ConfigException extends ModuleException {
  constructor(message: string) {
    super(message, 500, "CONFIG_ERROR");
    this.name = "ConfigException";
  }
}
