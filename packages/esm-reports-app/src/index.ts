import { defineConfigSchema, getAsyncLifecycle } from '@openmrs/esm-framework';
import { moduleName } from './constants';
import { configSchema } from './config-schema';

const options = {
  featureName: 'reports',
  moduleName,
};

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

export function startupApp() {
  defineConfigSchema(moduleName, configSchema);
}

export const root = getAsyncLifecycle(() => import('./reports.component'), options);

export const reportsLink = getAsyncLifecycle(() => import('./reports-link'), options);

export const overview = getAsyncLifecycle(() => import('./components/overview.component'), options);

export const scheduledOverview = getAsyncLifecycle(() => import('./components/scheduled-overview.component'), options);

export const runReport = getAsyncLifecycle(() => import('./components/run-report/run-report-form.component'), options);

export const cancelReportModal = getAsyncLifecycle(
  () => import('./components/run-report/cancel-report-modal.component'),
  options,
);

export const reportExportColumnsModal = getAsyncLifecycle(
  () => import('./components/report-export-columns.modal'),
  options,
);
