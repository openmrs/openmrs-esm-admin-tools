import { getAsyncLifecycle, defineConfigSchema } from '@openmrs/esm-framework';
import { configSchema } from './config-schema';
import { moduleName } from './constants';

const options = {
  featureName: 'metadataexport',
  moduleName,
};

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

export function startupApp() {
  defineConfigSchema(moduleName, configSchema);
}

// Root component
export const root = getAsyncLifecycle(() => import('./root.component'), options);

// Extensions

// Modals

// Workspaces
export const newPackageWorkspace = getAsyncLifecycle(
  () => import('./components/new-package/new-package.workspace'),
  options,
);
