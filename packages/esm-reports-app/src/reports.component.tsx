import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { spaBasePath } from './constants';
import OverviewComponent from './components/overview.component';
import ScheduledOverviewComponent from './components/scheduled-overview.component';
import ReportsDataOverviewComponent from './components/reports-data-overview.component';
import styles from './root.scss';

const RootComponent: React.FC = () => {
  return (
    <div className={styles.container}>
      <BrowserRouter basename={spaBasePath}>
        <Routes>
          {/* TODO: OverviewComponent should be the default route, but is not working at the moment. We will rev */}
          {/* <Route path="/" element={<OverviewComponent />} /> */}
          <Route path="/" element={<ReportsDataOverviewComponent />} />
          <Route path="/scheduled-overview" element={<ScheduledOverviewComponent />} />
          <Route path="/reports-data-overview" element={<ReportsDataOverviewComponent />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default RootComponent;
