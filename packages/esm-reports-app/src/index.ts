/**
 * This is the entrypoint file of the application. It communicates the
 * important features of this microfrontend to the app shell. It
 * connects the app shell to the React application(s) that make up this
 * microfrontend.
 */
import { getAsyncLifecycle, defineConfigSchema, registerBreadcrumbs } from '@openmrs/esm-framework';
import { configSchema } from './config-schema';

const moduleName = '@openmrs/esm-reports-app';

const options = {
  featureName: 'reports',
  moduleName,
};

/**
 * This tells the app shell how to obtain translation files: that they
 * are JSON files in the directory `../translations` (which you should
 * see in the directory structure).
 */
export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

/**
 * This function performs any setup that should happen at microfrontend
 * load-time (such as defining the config schema) and then returns an
 * object which describes how the React application(s) should be
 * rendered.
 */
export function startupApp() {
  defineConfigSchema(moduleName, configSchema);

  registerBreadcrumbs([
    {
      title: 'Home',
      path: `${window.openmrsBase}`,
    },
    {
      path: `${window.spaBase}/system-administration`,
      title: () => Promise.resolve(window.i18next.t('systemAdmin', 'System Administration')),
      parent: `${window.spaBase}/home`,
    },
    {
      title: () => Promise.resolve(window.i18next.t('reports', 'Reports')),
      path: `${window.spaBase}/reports`,
      parent: `${window.spaBase}/system-administration`,
    },
    {
      title: () => Promise.resolve(window.i18next.t('scheduledReports', 'Scheduled Reports')),
      path: `${window.spaBase}/reports/scheduled-overview`,
      parent: `${window.spaBase}/reports`,
    },
  ]);
}

/**
 * This named export tells the app shell that the default export of `root.component.tsx`
 * should be rendered when the route matches `root`. The full route
 * will be `openmrsSpaBase() + 'root'`, which is usually
 * `/openmrs/spa/root`.
 */

export const root = getAsyncLifecycle(() => import('./reports.component'), options);

export const reportsLink = getAsyncLifecycle(() => import('./reports-link'), options);

export const overview = getAsyncLifecycle(() => import('./components/overview.component'), options);

export const scheduledOverview = getAsyncLifecycle(() => import('./components/scheduled-overview.component'), options);

export const runReport = getAsyncLifecycle(() => import('./components/run-report/run-report-form.component'), options);

export const cancelReportModal = getAsyncLifecycle(
  () => import('./components/run-report/cancel-report-modal.component'),
  options,
);
