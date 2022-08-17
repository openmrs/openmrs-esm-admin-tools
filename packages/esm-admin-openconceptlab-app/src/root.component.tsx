import { Tab, Tabs, TabList, TabPanels, TabPanel } from '@carbon/react';
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
          <Tabs>
            <TabList className={styles.tabList} contained={true}>
              <Tab>{t('subscription')} </Tab>
              <Tab>{t('import')} </Tab>
              <Tab>{t('previousImports')} </Tab>
            </TabList>
            <TabPanels>
              <TabPanel className={styles.tabPanel}>
                <Subscription />
              </TabPanel>
              <TabPanel className={styles.tabPanel}>
                <Import />
              </TabPanel>
              <TabPanel className={styles.tabPanel} />
            </TabPanels>
          </Tabs>
        </BrowserRouter>
      </main>
    </SWRConfig>
  );
};

export default Root;
