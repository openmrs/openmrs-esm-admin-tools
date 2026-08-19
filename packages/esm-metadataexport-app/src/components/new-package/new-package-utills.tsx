import { type TFunction } from 'i18next';
import { launchWorkspace } from '@openmrs/esm-framework';

export const launchAddNewPackageWorkspace = (t: TFunction) => {
  launchWorkspace('new-package-workspace', {
    workspaceTitle: t('newPackage', 'New package'),
  });
};
