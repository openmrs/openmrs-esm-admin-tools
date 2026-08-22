import { type TFunction } from 'i18next';
import { launchWorkspace } from '@openmrs/esm-framework';
import { type ExportPackage } from '../../types/index';

export const launchViewPackageWorkspace = (t: TFunction, exportPackage: ExportPackage) => {
  launchWorkspace('view-package-workspace', {
    workspaceTitle: exportPackage.name,
    exportPackage,
  });
};
