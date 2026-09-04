import { launchWorkspace } from '@openmrs/esm-framework';
import { type ExportPackage } from '../../types/index';

export const launchViewPackageWorkspace = (exportPackage: ExportPackage) => {
  launchWorkspace('view-package-workspace', {
    workspaceTitle: exportPackage.name,
    exportPackage,
  });
};
