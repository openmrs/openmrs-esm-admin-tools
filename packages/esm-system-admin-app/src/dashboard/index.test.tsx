import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { getConfig } from '@openmrs/esm-config';
import { SystemAdministrationDashboard } from './index.component';

vi.mock('@openmrs/esm-config', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  getConfig: vi.fn(),
}));

vi.mock('@openmrs/esm-translations', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  getCoreTranslation: (key: string) => key,
}));

describe('SystemAdministrationDashboard', () => {
  it('renders the page title, pictogram, and configured implementation name', async () => {
    vi.mocked(getConfig).mockResolvedValue({ implementationName: 'Test Clinic' });

    render(<SystemAdministrationDashboard />);

    expect(screen.getByRole('heading', { name: 'System Administration', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('SystemAdministrationPictogram')).toBeInTheDocument();
    expect(await screen.findByText('Test Clinic')).toBeInTheDocument();
    expect(getConfig).toHaveBeenCalledWith('@openmrs/esm-styleguide');
  });
});
