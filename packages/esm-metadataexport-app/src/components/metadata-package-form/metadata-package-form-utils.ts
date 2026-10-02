import { launchWorkspace2 } from '@openmrs/esm-framework';

export const launchPackageFormWorkspace = (uuid?: string) => {
  launchWorkspace2('metadata-package-form-workspace', { uuid });
};
