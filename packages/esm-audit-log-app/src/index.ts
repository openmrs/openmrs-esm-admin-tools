import { defineConfigSchema, getSyncLifecycle } from '@openmrs/esm-framework';
import { configSchema } from './config-schema';
import AuditLogDashboard from './audit-log-dashboard.component';
import AuditLogAdminPageLink from './audit-log-admin-page-link.component';

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

export function startupApp() {
  defineConfigSchema('@openmrs/esm-audit-log-app', configSchema);
}

export const auditLogDashboard = getSyncLifecycle(AuditLogDashboard, {
  featureName: 'audit-log-dashboard',
  moduleName: '@openmrs/esm-audit-log-app',
});

export const auditLogAdminPageLink = getSyncLifecycle(AuditLogAdminPageLink, {
  featureName: 'audit-log-admin-page-link',
  moduleName: '@openmrs/esm-audit-log-app',
});
