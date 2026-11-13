import { Type } from '@openmrs/esm-framework';

export const configSchema = {
  auditLogRestUrl: {
    _type: Type.String,
    _default: '/module/auditlog/rest/auditlogs',
    _description: 'Base URL for the Audit Log REST endpoint.',
  },
  defaultPageSize: {
    _type: Type.Number,
    _default: 10,
    _description: 'Default number of audit log rows per page.',
  },
};

export type Config = {
  auditLogRestUrl: string;
  defaultPageSize: number;
};
