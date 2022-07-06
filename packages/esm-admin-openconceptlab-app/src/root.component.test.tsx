import React from 'react';
import { render, cleanup, screen } from '@testing-library/react';
import Root from './root.component';

describe(`<Root />`, () => {
  afterEach(cleanup);
  it(`renders without dying`, () => {
    renderOclSubscriptionModule();
  });

  it(`renders the title and tab containers`, () => {
    renderOclSubscriptionModule();
    expect(screen.getByText(/OCL Subscription Module/i)).toBeInTheDocument();
    expect(screen.getByText(/Subscription/i)).toBeInTheDocument();
    expect(screen.getByText(/Import/i)).toBeInTheDocument();
    expect(screen.getByText(/Previous Imports/i)).toBeInTheDocument();
  });
});

function renderOclSubscriptionModule() {
  render(<Root />);
}
