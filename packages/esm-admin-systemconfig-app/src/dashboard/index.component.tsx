import React from 'react';
import { useTranslation } from 'react-i18next';
import { ExtensionSlot } from '@openmrs/esm-framework';

import { LinkCard } from './card.component';

import styles from './index.scss';

export const SystemAdministrationDashbord = () => {
  const { t } = useTranslation();

  return (
    <div className={styles.systemAdminPage}>
      <div className={styles.breadcrumbsContainer}>
        <ExtensionSlot extensionSlotName="breadcrumbs-slot" />
      </div>
      <div className={styles.cardsView}>
        <LinkCard header={t('config', 'Configurations')} viewLink="/openmrs/admin">
          {t('legacyAdmin', 'Legacy Admin')}
        </LinkCard>
        <LinkCard header={t('manageConcepts', 'Manage Concepts')} viewLink={`${window.spaBase}/ocl`}>
          {t('openConceptLab', 'Open Concept Lab')}
        </LinkCard>
        <LinkCard header={t('manageCohorts', 'Manage Cohorts')} viewLink={`${window.spaBase}/cohort-builder`}>
          {t('cohortBuilder', 'Cohort Builder')}
        </LinkCard>
        <LinkCard header={t('manageForms', 'Manage Forms')} viewLink={`${window.spaBase}/form-builder`}>
          {t('formBuilder', 'Form Builder')}
        </LinkCard>
      </div>
    </div>
  );
};
