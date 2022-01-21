import React from 'react';
import { BrowserRouter, Route } from 'react-router-dom';
import { SWRConfig } from 'swr';
import Subscription from './subscription/subscription.component';

const Root: React.FC = () => {
  return (
    <SWRConfig>
      <main className="omrs-main-content">
        <BrowserRouter basename={`${window.getOpenmrsSpaBase()}ocl/`}>
          <Route path="/subscription" component={Subscription} />
        </BrowserRouter>
      </main>
    </SWRConfig>
  );
};

export default Root;
