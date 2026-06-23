export type AuditEventType = 'ADD' | 'MOD' | 'DEL';

export interface AuditFieldDiff {
  fieldName: string;
  oldValue: string;
  currentValue: string;
  changed: boolean;
}

export interface AuditLogDetail {
  revisionID: number;
  entityType: string;
  eventType: AuditEventType | string;
  changedBy: string;
  // "dd/MM/yyyy HH:mm:ss" GMT — as returned by the auditlogweb module
  changedOn: string;
  // Omitted by the backend unless a non-pagination filter is active.
  changes?: AuditFieldDiff[];
}

export interface AuditLogResponse {
  totalLogs: number;
  currentPage: number;
  totalPages: number;
  logs: AuditLogDetail[];
}

export interface AuditLogFilterState {
  entityType: string;
  username: string;
  startDate: Date | null;
  endDate: Date | null;
}
