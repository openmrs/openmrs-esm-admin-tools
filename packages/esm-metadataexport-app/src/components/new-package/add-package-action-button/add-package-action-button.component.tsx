import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@carbon/react';
import { Add } from '@carbon/react/icons';
import { launchAddNewPackageWorkspace } from '../new-package-utills';
import { useSession } from '@openmrs/esm-framework';

const NewPackageActionButton: React.FC = () => {
  const { t } = useTranslation();
  const session = useSession();

  const canManage = session?.user?.privileges?.some((p) => p.display === 'Manage Metadata Export Packages');

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
