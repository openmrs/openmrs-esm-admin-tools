import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetaDataExportHeader } from './metadata-export-header.component';

describe('MetaDataExportHeader', () => {
  it('renders the provided title', () => {
    render(<MetaDataExportHeader title="Metadata export packages" />);

    expect(screen.getByText('Metadata export packages')).toBeInTheDocument();
  });

  it('renders the page header container', () => {
    render(<MetaDataExportHeader title="Metadata export packages" />);

    expect(screen.getByTestId('metadata-export-header')).toBeInTheDocument();
  });
});
