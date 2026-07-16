import { Type } from '@openmrs/esm-framework';
import { PRIVILEGE_VIEW_AUDIT_LOG } from './constants';

export const configSchema = {
  viewPrivilege: {
    _type: Type.String,
    _description:
      'Privilege required to view the audit log. Must match the privilege the auditlogweb backend module registers. Set to an empty string to disable the client-side gate.',
    _default: PRIVILEGE_VIEW_AUDIT_LOG,
  },
};

export interface ConfigObject {
  viewPrivilege: string;
}
