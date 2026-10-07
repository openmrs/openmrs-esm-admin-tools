import React from 'react';
import { useTranslation } from 'react-i18next';
import { ExtensionSlot, PageHeader, SystemAdministrationPictogram } from '@openmrs/esm-framework';
import styles from './index.scss';

export const SystemAdministrationDashboard = () => {
  const { t } = useTranslation();

  return (
    <div className={styles.systemAdminPage}>
      <div className={styles.breadcrumbsContainer}>
        <ExtensionSlot name="breadcrumbs-slot" />
      </div>
      <PageHeader
        className={styles.pageHeader}
        illustration={<SystemAdministrationPictogram />}
        title={t('systemAdmin', 'System Administration')}
      />
      <div className={styles.cardsView}>
        <ExtensionSlot className={styles.cardLinks} name="system-admin-page-card-link-slot" />
      </div>
    </div>
  );
};
