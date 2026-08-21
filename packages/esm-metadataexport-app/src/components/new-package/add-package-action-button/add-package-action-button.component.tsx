import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@carbon/react';
import { Add } from '@carbon/react/icons';
import { useSession, userHasAccess } from '@openmrs/esm-framework';
import { launchAddNewPackageWorkspace } from '../new-package-utills';

const NewPackageActionButton: React.FC = () => {
  const { t } = useTranslation();
  const session = useSession();

  const canManage = session.user ? userHasAccess('Manage Metadata Export Packages', session.user) : false;

  const handleAddNewPackageWorkspace = useCallback(() => {
    launchAddNewPackageWorkspace(t);
  }, [t]);

  if (!canManage) {
    return null;
  }

  return (
    <Button
      onClick={handleAddNewPackageWorkspace}
      size="md"
      kind="primary"
      renderIcon={(props) => <Add size={16} {...props} />}
    >
      {t('newpackage', 'New Package')}
    </Button>
  );
};

export default NewPackageActionButton;
