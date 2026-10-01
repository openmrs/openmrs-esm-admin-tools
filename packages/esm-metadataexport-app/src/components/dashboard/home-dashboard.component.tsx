import React from 'react';
import { useLayoutType, isDesktop } from '@openmrs/esm-framework';
import DashboardView from './dashboard-view.component';
import styles from './home-dashboard.scss';

export default function Dashboard() {
  const layout = useLayoutType();

  return (
    <div className={styles.homePageWrapper}>
      <section className={isDesktop(layout) ? styles.dashboardContainer : styles.dashboardContainerTablet}>
        <DashboardView />
      </section>
    </div>
  );
}
