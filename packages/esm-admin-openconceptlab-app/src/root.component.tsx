import { Tab, Tabs } from '@carbon/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { BrowserRouter } from 'react-router-dom';
import { SWRConfig } from 'swr';
import Subscription from './subscription/subscription.component';
import styles from './root.component.scss';
import Import from './import/import.component';

const Root: React.FC = () => {
  const { t } = useTranslation();
  return (
    <SWRConfig>
      <main className={`omrs-main-content ${styles.main}`}>
        <h3 className={styles.moduleHeader}>{t('moduleTitle')}</h3>
        <BrowserRouter basename={`${window.getOpenmrsSpaBase()}ocl`}>
          <Tabs className={styles.tabs} type="container">
            <Tab label={t('subscription')}>
              <Subscription />
            </Tab>
            <Tab label={t('import')}>
              <Import />
            </Tab>
            <Tab label={t('previousImports')} />
          </Tabs>
        </BrowserRouter>
      </main>
    </SWRConfig>
  );
};

export default Root;
