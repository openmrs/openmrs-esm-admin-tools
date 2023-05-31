import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { SystemAdministrationDashbord } from './dashboard/index.component';

const RootComponent: React.FC = () => {
  return (
    <BrowserRouter basename={`${window.spaBase}/system-administration`}>
      <Routes>
        <Route path="/" element={<SystemAdministrationDashbord />} />
      </Routes>
    </BrowserRouter>
  );
};

export default RootComponent;
