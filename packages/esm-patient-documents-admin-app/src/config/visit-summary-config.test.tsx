import React from 'react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/react';
import { type FetchResponse, openmrsFetch } from '@openmrs/esm-framework';
import { renderWithSwr } from '@tools/test-helpers';
import { saveSectionSettings } from './config.resource';
import VisitSummaryConfig from './visit-summary-config.component';
import type { VisitSummarySection } from '../types';

const mockOpenmrsFetch = vi.mocked(openmrsFetch);
const mockSaveSectionSettings = vi.mocked(saveSectionSettings);

vi.mock('./config.resource', async () => {
  const originalModule = (await vi.importActual('./config.resource')) as object;

  return {
    ...originalModule,
    saveSectionSettings: vi.fn(),
    fetchVisitSummaryPdf: vi.fn(),
  };
});

const mockSections: Array<VisitSummarySection> = [
  { sectionKey: 'facilityHeader', label: 'Facility header', enabled: true, order: 10, toggleable: false },
  { sectionKey: 'vitals', label: 'Vitals', enabled: true, order: 20, toggleable: true },
  { sectionKey: 'allergies', label: 'Allergies', enabled: false, order: 30, toggleable: true },
];

describe('VisitSummaryConfig', () => {
  beforeEach(() => {
    mockSaveSectionSettings.mockResolvedValue([]);
  });

  it('renders the sections sorted by order, with locked sections disabled', async () => {
    mockOpenmrsFetch.mockResolvedValue({ data: { results: mockSections } } as unknown as FetchResponse);
    renderWithSwr(<VisitSummaryConfig />);

    const rows = await screen.findAllByRole('listitem');
    expect(rows[0]).toHaveTextContent('Facility header');
    expect(rows[1]).toHaveTextContent('Vitals');
    expect(rows[2]).toHaveTextContent('Allergies');

    expect(screen.getByRole('switch', { name: 'Facility header is always included' })).toBeDisabled();
    expect(screen.getByRole('switch', { name: 'Include Vitals' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('shows the error state with a retry action when the fetch fails', async () => {
    mockOpenmrsFetch.mockRejectedValue(new Error('Internal server error'));
    renderWithSwr(<VisitSummaryConfig />);

    expect(await screen.findByText("Couldn't load the visit summary sections")).toBeVisible();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeEnabled();
  });

  it('shows a permission message without retry when the server returns 403', async () => {
    mockOpenmrsFetch.mockRejectedValue(Object.assign(new Error('Access denied'), { response: { status: 403 } }));
    renderWithSwr(<VisitSummaryConfig />);

    expect(
      await screen.findByText('Your account lacks the Get Global Properties privilege required to view this page.'),
    ).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
  });

  it('shows a distinct empty state when the server returns no sections', async () => {
    mockOpenmrsFetch.mockResolvedValue({ data: { results: [] } } as unknown as FetchResponse);
    renderWithSwr(<VisitSummaryConfig />);

    expect(await screen.findByText('No sections registered')).toBeVisible();
    expect(screen.queryByText("Couldn't load the visit summary sections")).not.toBeInTheDocument();
  });

  it('saves an enabled change as the matching global property write', async () => {
    const user = userEvent.setup();
    mockOpenmrsFetch.mockResolvedValue({ data: { results: mockSections } } as unknown as FetchResponse);
    renderWithSwr(<VisitSummaryConfig />);

    await user.click(await screen.findByRole('switch', { name: 'Include Vitals' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(mockSaveSectionSettings).toHaveBeenCalledWith([
      { sectionKey: 'vitals', property: 'report.visitSummary.section.vitals.enabled', value: 'false' },
    ]);
  });

  it('pins the footer to the bottom with its reorder arrows disabled', async () => {
    const sectionsWithFooter: Array<VisitSummarySection> = [
      // Deliberately gives the footer a low order value: pinning must win over sorting.
      { sectionKey: 'footer', label: 'Footer', enabled: true, order: 5, toggleable: false },
      { sectionKey: 'vitals', label: 'Vitals', enabled: true, order: 20, toggleable: true },
      { sectionKey: 'allergies', label: 'Allergies', enabled: true, order: 30, toggleable: true },
    ];
    mockOpenmrsFetch.mockResolvedValue({ data: { results: sectionsWithFooter } } as unknown as FetchResponse);
    renderWithSwr(<VisitSummaryConfig />);

    const rows = await screen.findAllByRole('listitem');
    expect(rows[0]).toHaveTextContent('Vitals');
    expect(rows[1]).toHaveTextContent('Allergies');
    expect(rows[2]).toHaveTextContent('Footer');

    expect(screen.getByRole('button', { name: 'Move Footer up' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Move Footer down' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Move Allergies down' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Move Allergies up' })).toBeEnabled();
  });

  it('saves a reorder as renumbered order global properties', async () => {
    const user = userEvent.setup();
    mockOpenmrsFetch.mockResolvedValue({ data: { results: mockSections } } as unknown as FetchResponse);
    renderWithSwr(<VisitSummaryConfig />);

    await user.click(await screen.findByRole('button', { name: 'Move Vitals down' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(mockSaveSectionSettings).toHaveBeenCalledWith([
      { sectionKey: 'facilityHeader', property: 'report.visitSummary.section.facilityHeader.order', value: '10' },
      { sectionKey: 'allergies', property: 'report.visitSummary.section.allergies.order', value: '20' },
      { sectionKey: 'vitals', property: 'report.visitSummary.section.vitals.order', value: '30' },
    ]);
  });
});
