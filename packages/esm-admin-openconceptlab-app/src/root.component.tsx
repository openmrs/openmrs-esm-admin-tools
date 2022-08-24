import { Tab, Tabs, TabList, TabPanels, TabPanel } from '@carbon/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { SWRConfig } from 'swr';
import Subscription from './subscription/subscription.component';
import styles from './root.component.scss';
import Import from './import/import.component';
import PreviousImports from './previous-imports/previous-imports.component';

const Root: React.FC = () => {
  const { t } = useTranslation();
  return (
    <SWRConfig>
      <main className={`omrs-main-content ${styles.main}`}>
        <h3 className={styles.moduleHeader}>{t('moduleTitle', 'OCL Subscription Module')}</h3>
        <Tabs>
          <TabList className={styles.tabList} contained={true}>
            <Tab>{t('subscription', 'Subscription')} </Tab>
            <Tab>{t('import', 'Import')} </Tab>
            <Tab>{t('previousImports', 'Previous Imports')} </Tab>
          </TabList>
          <TabPanels>
            <TabPanel className={styles.tabPanel}>
              <Subscription />
            </TabPanel>
            <TabPanel className={styles.tabPanel}>
              <Import />
            </TabPanel>
            <TabPanel className={styles.tabPanel}>
              <PreviousImports />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </main>
    </SWRConfig>
  );
};

export default Root;
