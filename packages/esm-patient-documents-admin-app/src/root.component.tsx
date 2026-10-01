import React from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader, PatientDocumentsPictogram } from '@openmrs/esm-framework';
import VisitSummaryConfig from './config/visit-summary-config.component';
import styles from './root.scss';

const Root: React.FC = () => {
  const { t } = useTranslation();
  return (
    <main className={`omrs-main-content ${styles.main}`}>
      <PageHeader
        className={styles.header}
        illustration={<PatientDocumentsPictogram />}
        title={t('moduleTitle', 'Visit Summary Configuration')}
      />
      <VisitSummaryConfig />
    </main>
  );
};

export default Root;
