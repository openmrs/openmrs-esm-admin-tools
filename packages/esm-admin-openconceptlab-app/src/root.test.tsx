import React from 'react';
import { render, cleanup, screen } from '@testing-library/react';
import Root from './root.component';

describe(`Root component`, () => {
  afterEach(cleanup);
  it(`renders without dying`, () => {
    renderOclSubscriptionModule();
  });

  it(`renders the title and tab containers`, () => {
    renderOclSubscriptionModule();
    expect(screen.getByText('moduleTitle')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'subscription' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'import' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'previousImports' })).toBeInTheDocument();
  });
});

function renderOclSubscriptionModule() {
  render(<Root />);
}
