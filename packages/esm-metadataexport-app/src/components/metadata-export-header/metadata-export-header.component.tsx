import React from 'react';
import { PageHeader, PageHeaderContent, StockManagementPictogram } from '@openmrs/esm-framework';
import styles from './metadata-export-header.scss';
import NewPackageActionButton from '../new-package/add-package-action-button/add-package-action-button.component';

export const MetaDataExportHeader: React.FC<{ title: string }> = ({ title }) => {
  return (
    <PageHeader className={styles.header} data-testid="metadata-export-header">
      <PageHeaderContent illustration={<StockManagementPictogram />} title={title} />

      <div className={styles['right-justified-items']}>
        <div className={styles['date-and-location']}>
          <NewPackageActionButton />
        </div>
      </div>
    </PageHeader>
  );
};
