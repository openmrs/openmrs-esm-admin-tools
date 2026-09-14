import { type TFunction } from 'i18next';
import { launchWorkspace } from '@openmrs/esm-framework';

export const launchAddNewPackageWorkspace = (t: TFunction, uuid?: string) => {
  launchWorkspace('new-package-workspace', {
    workspaceTitle: uuid ? t('editpackage', 'Edit package') : t('newpackage', 'New package'),
    uuid,
  });
};
