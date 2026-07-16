export const moduleName = '@openmrs/esm-auditlog-app';
export const basePath = '/audit-logs';
export const PRIVILEGE_VIEW_AUDIT_LOG = 'View Audit Log';

// Zero-based to match the auditlogweb backend
export const DEFAULT_PAGE_NUMBER = 0;
export const DEFAULT_PAGE_SIZE = 20;
export const DEFAULT_PAGE_SIZES = [10, 20, 50];

// How many recent revisions to sample when discovering which entity types exist
// in the audit data (used to populate the searchable entity-type filter options).
export const ENTITY_TYPE_SAMPLE_SIZE = 500;

// auditlogweb uses dd/MM/yyyy — NOT ISO-8601
export const DATE_FILTER_FORMAT = 'DD/MM/YYYY';
export const DATE_DISPLAY_FORMAT = 'DD/MM/YYYY HH:mm:ss';

// Simple class names — AuditDao matches on Class.getSimpleName().equalsIgnoreCase(entityType).
export const ENTITY_TYPES: Array<{ label: string; value: string }> = [
  { label: 'Patient', value: 'Patient' },
  { label: 'Encounter', value: 'Encounter' },
  { label: 'Observation', value: 'Obs' },
  { label: 'Visit', value: 'Visit' },
  { label: 'Order', value: 'Order' },
  { label: 'User', value: 'User' },
];
