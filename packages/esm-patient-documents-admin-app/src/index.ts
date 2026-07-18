import { getAsyncLifecycle, defineConfigSchema } from '@openmrs/esm-framework';
import { configSchema } from './config-schema';

const moduleName = '@openmrs/esm-patient-documents-admin-app';

const options = {
  featureName: 'patient-documents-admin',
  moduleName,
};

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

export function startupApp() {
  defineConfigSchema(moduleName, configSchema);
}

export const root = getAsyncLifecycle(() => import('./root.component'), options);

export const visitSummaryConfigCardLink = getAsyncLifecycle(() => import('./admin-card-link.component'), options);
