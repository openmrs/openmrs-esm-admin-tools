import { launchWorkspace2 } from '@openmrs/esm-framework';
import { type ExportPackage } from '../../types/index';

export const launchViewMetadataPackageWorkspace = (exportPackage: ExportPackage) => {
  launchWorkspace2('view-metadata-package-workspace', { exportPackage });
};
