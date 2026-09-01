import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@carbon/react';
import { ArrowRight } from '@carbon/react/icons';
import { useSession, userHasAccess } from '@openmrs/esm-framework';
import { launchViewPackageWorkspace } from '../view-package-utils';
import { type ExportPackage } from '../../../types/index';

interface ViewPackageActionButtonProps {
  exportPackage: ExportPackage;
}

const ViewPackageActionButton: React.FC<ViewPackageActionButtonProps> = ({ exportPackage }) => {
  const { t } = useTranslation();
  const session = useSession();

  const canView = session.user ? userHasAccess('Get Metadata Export Packages', session.user) : false;

  const handleView = useCallback(() => {
    launchViewPackageWorkspace(t, exportPackage);
  }, [t, exportPackage]);

  return (
    <Button
      disabled={!canView}
      onClick={handleView}
      size="md"
      kind="ghost"
      renderIcon={(props) => <ArrowRight size={16} {...props} />}
    >
      {t('view', 'View')}
    </Button>
  );
};

export default ViewPackageActionButton;
