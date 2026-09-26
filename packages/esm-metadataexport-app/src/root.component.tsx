import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './components/dashboard/home-dashboard.component';

const Root: React.FC = () => (
  <BrowserRouter basename={window.getOpenmrsSpaBase()}>
    <Routes>
      <Route path="metadataexport" element={<Dashboard />} />
    </Routes>
  </BrowserRouter>
);

export default Root;
