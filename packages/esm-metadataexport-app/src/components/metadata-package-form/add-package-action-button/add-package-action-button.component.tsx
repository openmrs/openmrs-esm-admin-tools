import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@carbon/react';
import { Add } from '@carbon/react/icons';
import { useSession, userHasAccess } from '@openmrs/esm-framework';
import { launchPackageFormWorkspace } from '../metadata-package-form-utils';

const AddPackageActionButton: React.FC = () => {
  const { t } = useTranslation();
  const session = useSession();

  const canManage = session.user ? userHasAccess('Manage Metadata Export Packages', session.user) : false;

  const handleLaunchPackageForm = useCallback(() => {
    launchPackageFormWorkspace(t);
  }, [t]);

  if (!canManage) {
    return null;
  }

  return (
    <Button
      onClick={handleLaunchPackageForm}
      size="md"
      kind="primary"
      renderIcon={(props) => <Add size={16} {...props} />}
    >
      {t('newpackage', 'New Package')}
    </Button>
  );
};

export default AddPackageActionButton;
