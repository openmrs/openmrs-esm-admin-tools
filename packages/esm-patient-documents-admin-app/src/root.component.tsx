import React from 'react';
import { useTranslation } from 'react-i18next';
import VisitSummaryConfig from './config/visit-summary-config.component';
import styles from './root.scss';

const Root: React.FC = () => {
  const { t } = useTranslation();
  return (
    <main className={`omrs-main-content ${styles.main}`}>
      <h3 className={styles.moduleHeader}>{t('moduleTitle', 'Visit Summary Configuration')}</h3>
      <VisitSummaryConfig />
    </main>
  );
};

export default Root;
