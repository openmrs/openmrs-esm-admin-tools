import { defineConfigSchema, getAsyncLifecycle, registerBreadcrumbs } from '@openmrs/esm-framework';
import { getFixedT } from 'i18next';
import { basePath, moduleName } from './constants';
import { configSchema } from './config-schema';

const options = {
  featureName: 'audit-log',
  moduleName,
};

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

export function startupApp() {
  const t = getFixedT(undefined, moduleName);

  // The system-administration breadcrumb is registered by esm-system-admin-app;
  // we only add our own leaf, pointing at it as the parent.
  registerBreadcrumbs([
    {
      title: () => Promise.resolve(t('auditLogs', 'Audit Logs')),
      path: `${window.getOpenmrsSpaBase()}${basePath.slice(1)}`,
      parent: `${window.getOpenmrsSpaBase()}system-administration`,
    },
  ]);

  defineConfigSchema(moduleName, configSchema);
}

export const root = getAsyncLifecycle(() => import('./root.component'), options);
export const auditLogLink = getAsyncLifecycle(() => import('./audit-log-link.component'), options);
