import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { basePath } from './constants';
import AuditLogOverview from './components/audit-log-overview.component';

const RootComponent: React.FC = () => {
  return (
    <BrowserRouter basename={`${window.getOpenmrsSpaBase().slice(0, -1)}${basePath}`}>
      <Routes>
        <Route path="/" element={<AuditLogOverview />} />
      </Routes>
    </BrowserRouter>
  );
};

export default RootComponent;
