import React from 'react';
import { useTranslation } from 'react-i18next';
import { ExtensionSlot } from '@openmrs/esm-framework';

import { LinkCard } from './card.component';
import styles from './index.scss';

export const SystemAdministrationDashboard = () => {
  const { t } = useTranslation();

  return (
    <div className={styles.systemAdminPage}>
      <div className={styles.breadcrumbsContainer}>
        <ExtensionSlot name="breadcrumbs-slot" />
      </div>
      <div className={styles.cardsView}>
        <ExtensionSlot className={styles.cardLinks} name="system-admin-page-card-link-slot" />
      </div>
    </div>
  );
};
