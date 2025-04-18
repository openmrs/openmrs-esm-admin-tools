import { getAsyncLifecycle, registerBreadcrumbs } from '@openmrs/esm-framework';

const moduleName = '@openmrs/esm-reports-app';

const options = {
  featureName: 'reports',
  moduleName,
};

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

export function startupApp() {
  registerBreadcrumbs([
    {
      title: 'Home',
      path: `${window.openmrsBase}`,
    },
    {
      path: `${window.spaBase}/system-administration`,
      title: () =>
        Promise.resolve(
          window.i18next.t('systemAdmin', { ns: '@openmrs/esm-reports-app', default: 'System Administration' }),
        ),
      parent: `${window.spaBase}/home`,
    },
    {
      title: () => Promise.resolve(window.i18next.t('reports', { ns: '@openmrs/esm-reports-app', default: 'Reports' })),
      path: `${window.spaBase}/reports`,
      parent: `${window.spaBase}/system-administration`,
    },
    {
      title: () =>
        Promise.resolve(
          window.i18next.t('scheduledReports', { ns: '@openmrs/esm-reports-app', default: 'Scheduled Reports' }),
        ),
      path: `${window.spaBase}/reports/scheduled-overview`,
      parent: `${window.spaBase}/reports`,
    },
    {
      title: () =>
        Promise.resolve(
          window.i18next.t('reportsDataOverview', { ns: '@openmrs/esm-reports-app', default: 'Reports Data Overview' }),
        ),
      path: `${window.spaBase}/reports/reports-data-overview`,
      parent: `${window.spaBase}/reports`,
    },
  ]);
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
