import React from 'react';
import { useTranslation } from 'react-i18next';
import { MetaDataExportHeader } from '../metadata-export-header/metadata-export-header.component';
import PackagesTable from '../packages-table/packages-table.component';

const DashboardView: React.FC = () => {
  const { t } = useTranslation();
  return (
    <>
      <MetaDataExportHeader title={t('metadataexport', 'Metadata Export')} />
      <PackagesTable />
    </>
  );
};

export default DashboardView;
