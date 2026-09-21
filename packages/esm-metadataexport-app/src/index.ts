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
export const metadataExportCardLink = getAsyncLifecycle(() => import('./admin-card-link.component'), options);

// Modals
export const deleteMetadataPackageModal = getAsyncLifecycle(
  () => import('./components/view-metadata-package/delete-metadata-package.modal'),
  options,
);

// Workspaces
export const metadataPackageFormWorkspace = getAsyncLifecycle(
  () => import('./components/metadata-package-form/metadata-package-form.workspace'),
  options,
);

export const viewMetadataPackageWorkspace = getAsyncLifecycle(
  () => import('./components/view-metadata-package/view-metadata-package.workspace'),
  options,
);
