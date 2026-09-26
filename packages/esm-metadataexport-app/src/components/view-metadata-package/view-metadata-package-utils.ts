import { launchWorkspace } from '@openmrs/esm-framework';
import { type ExportPackage } from '../../types/index';

export const launchViewMetadataPackageWorkspace = (exportPackage: ExportPackage) => {
  launchWorkspace('view-metadata-package-workspace', {
    workspaceTitle: exportPackage.name,
    exportPackage,
  });
};
