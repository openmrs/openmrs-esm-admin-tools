import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import OverviewComponent from './components/overview.component';
import ScheduledOverviewComponent from './components/scheduled-overview.component';
import ReportsDataOverviewComponent from './components/reports-data-overview.component';
import styles from './root.scss';
import { basePath } from './constants';

const RootComponent: React.FC = () => {
  return (
    <div className={styles.container}>
      <BrowserRouter basename={`${window.getOpenmrsSpaBase().slice(0, -1)}${basePath}`}>
        <Routes>
          <Route path="/" element={<OverviewComponent />} />
          <Route path="/scheduled-overview" element={<ScheduledOverviewComponent />} />
          <Route path="/reports-data-overview" element={<ReportsDataOverviewComponent />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default RootComponent;
