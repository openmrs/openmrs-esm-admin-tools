export type AuditAction = 'CREATED' | 'UPDATED' | 'DELETED';

export interface AuditLogEntry {
  uuid: string;
  type: string;
  simpleType: string;
  identifier: string;
  action: AuditAction;
  userUuid: string;
  userDisplay: string;
  dateCreated: string;
  hasChildLogs: boolean;
}

export interface AuditLogPageResponse {
  results: AuditLogEntry[];
  startIndex: number;
  limit: number;
  resultsCount: number;
}

export interface AuditLogFilters {
  userUuid: string;
  action: string;
  startDate: string | undefined;
  endDate: string | undefined;
}

export interface AuditLogFieldChange {
  field: string;
  oldValue: string | null;
  newValue: string | null;
}

export interface AuditLogDetail extends AuditLogEntry {
  changes: AuditLogFieldChange[];
  childLogs: AuditLogEntry[];
}
