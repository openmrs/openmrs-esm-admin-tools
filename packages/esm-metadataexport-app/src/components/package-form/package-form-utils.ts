import { type TFunction } from 'i18next';
import { launchWorkspace } from '@openmrs/esm-framework';

export const launchPackageFormWorkspace = (t: TFunction, uuid?: string) => {
  launchWorkspace('package-form-workspace', {
    workspaceTitle: uuid ? t('editpackage', 'Edit package') : t('newpackage', 'New package'),
    uuid,
  });
};
