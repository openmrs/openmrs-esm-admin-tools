import React from 'react';
import { PageHeader, PageHeaderContent } from '@openmrs/esm-framework';
import styles from './metadata-export-header.scss';
import AddPackageActionButton from '../metadata-package-form/add-package-action-button/add-package-action-button.component';

export const MetaDataExportHeader: React.FC<{ title: string }> = ({ title }) => {
  return (
    <PageHeader className={styles.header} data-testid="metadata-export-header">
      <PageHeaderContent illustration={<></>} title={title} />

      <div className={styles['right-justified-items']}>
        <AddPackageActionButton />
      </div>
    </PageHeader>
  );
};
