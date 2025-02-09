import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import styles from './root.scss';
import OverviewComponent from './components/overview.component';
import ScheduledOverviewComponent from './components/scheduled-overview.component';
import { spaBasePath } from './constants';

const RootComponent: React.FC = () => {
  return (
    <div className={styles.container}>
      <BrowserRouter basename={spaBasePath}>
        <Routes>
          <Route path="/" element={<OverviewComponent />} />
          <Route path="/scheduled-overview" element={<ScheduledOverviewComponent />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default RootComponent;
