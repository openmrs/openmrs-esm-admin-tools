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
  };
});

const mockSections: Array<VisitSummarySection> = [
  { sectionKey: 'facilityHeader', label: 'Facility header', enabled: true, order: 10, toggleable: false },
  { sectionKey: 'vitals', label: 'Vitals', enabled: true, order: 20, toggleable: true },
  { sectionKey: 'allergies', label: 'Allergies', enabled: false, order: 30, toggleable: true },
];

const mockPdfBlob = new Blob(['%PDF-1.4'], { type: 'application/pdf' });
const mockObjectUrl = 'blob:mock-visit-summary-preview-pdf';

const forbiddenText = 'Your account lacks the Get Global Properties privilege required to view this page.';
const endpointMissingText = /module running on this server is missing or too old/i;
const generationFailedText = /the server could not generate the sample preview/i;
const networkErrorText = /check your network connection/i;

const isPreviewCall = (url: unknown) => String(url).includes('/visitSummary/preview');

const rejectionWithStatus = (status: number) =>
  Object.assign(new Error(`Server responded with ${status}`), { response: { status } });

/**
 * The sections list and the preview both go through openmrsFetch, so the mock has
 * to route on the URL rather than on call order.
 */
function mockFetch({
  sections = mockSections,
  preview = () => Promise.resolve({ blob: () => Promise.resolve(mockPdfBlob) } as unknown as FetchResponse),
}: {
  sections?: Array<VisitSummarySection>;
  preview?: () => Promise<FetchResponse>;
} = {}) {
  mockOpenmrsFetch.mockImplementation((url: string) =>
    isPreviewCall(url) ? preview() : Promise.resolve({ data: { results: sections } } as unknown as FetchResponse),
  );
}

const previewCall = () => mockOpenmrsFetch.mock.calls.find(([url]) => isPreviewCall(url));

describe('VisitSummaryConfig', () => {
  beforeEach(() => {
    mockSaveSectionSettings.mockResolvedValue([]);
    window.URL.createObjectURL = vi.fn(() => mockObjectUrl);
    window.URL.revokeObjectURL = vi.fn();
  });

  it('renders the sections sorted by order, with locked sections disabled', async () => {
    mockFetch();
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
    mockOpenmrsFetch.mockRejectedValue(rejectionWithStatus(403));
    renderWithSwr(<VisitSummaryConfig />);

    expect(await screen.findByText(forbiddenText)).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
  });

  it('shows a distinct empty state when the server returns no sections', async () => {
    mockFetch({ sections: [] });
    renderWithSwr(<VisitSummaryConfig />);

    expect(await screen.findByText('No sections registered')).toBeVisible();
    expect(screen.queryByText("Couldn't load the visit summary sections")).not.toBeInTheDocument();
  });

  it('saves an enabled change as the matching global property write', async () => {
    const user = userEvent.setup();
    mockFetch();
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
    mockFetch({ sections: sectionsWithFooter });
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
    mockFetch();
    renderWithSwr(<VisitSummaryConfig />);

    await user.click(await screen.findByRole('button', { name: 'Move Vitals down' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(mockSaveSectionSettings).toHaveBeenCalledWith([
      { sectionKey: 'facilityHeader', property: 'report.visitSummary.section.facilityHeader.order', value: '10' },
      { sectionKey: 'allergies', property: 'report.visitSummary.section.allergies.order', value: '20' },
      { sectionKey: 'vitals', property: 'report.visitSummary.section.vitals.order', value: '30' },
    ]);
  });

  it('offers the preview without asking for a visit uuid', async () => {
    mockFetch();
    renderWithSwr(<VisitSummaryConfig />);

    expect(await screen.findByRole('button', { name: 'Save & preview' })).toBeEnabled();
    expect(screen.queryByLabelText(/visit uuid/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('requests the sample preview on a relative path with no visit uuid and renders the returned blob', async () => {
    const user = userEvent.setup();
    mockFetch();
    renderWithSwr(<VisitSummaryConfig />);

    await user.click(await screen.findByRole('button', { name: 'Save & preview' }));

    const previewFrame = await screen.findByLabelText('Visit summary PDF preview');
    expect(previewFrame).toHaveAttribute('data', mockObjectUrl);

    const [requestUrl, requestInit] = previewCall();
    expect(requestUrl).toBe('/ws/rest/v1/patientdocuments/visitSummary/preview');
    expect(requestUrl).not.toContain('visitUuid');
    // openmrsFetch prepends the OpenMRS base itself; an absolute path would double it.
    expect(requestUrl).not.toContain(window.openmrsBase);
    // No Accept header: it makes an old server reformat its 404 into a 500 HTML page,
    // which would misreport a too-old module as a generation failure.
    expect((requestInit as RequestInit).headers).toBeUndefined();
    expect((requestInit as RequestInit).signal).toBeInstanceOf(AbortSignal);
    expect(window.URL.createObjectURL).toHaveBeenCalledWith(mockPdfBlob);
  });

  it('saves the pending changes before requesting the preview', async () => {
    const user = userEvent.setup();
    mockFetch();
    renderWithSwr(<VisitSummaryConfig />);

    await user.click(await screen.findByRole('switch', { name: 'Include Vitals' }));
    await user.click(screen.getByRole('button', { name: 'Save & preview' }));

    await screen.findByLabelText('Visit summary PDF preview');

    expect(mockSaveSectionSettings).toHaveBeenCalledWith([
      { sectionKey: 'vitals', property: 'report.visitSummary.section.vitals.enabled', value: 'false' },
    ]);
    const previewCallIndex = mockOpenmrsFetch.mock.calls.findIndex(([url]) => isPreviewCall(url));
    expect(mockSaveSectionSettings.mock.invocationCallOrder[0]).toBeLessThan(
      mockOpenmrsFetch.mock.invocationCallOrder[previewCallIndex],
    );
  });

  it('does not request the preview when the save fails', async () => {
    const user = userEvent.setup();
    mockFetch();
    mockSaveSectionSettings.mockResolvedValue([
      { sectionKey: 'vitals', property: 'report.visitSummary.section.vitals.enabled', value: 'false' },
    ]);
    renderWithSwr(<VisitSummaryConfig />);

    await user.click(await screen.findByRole('switch', { name: 'Include Vitals' }));
    await user.click(screen.getByRole('button', { name: 'Save & preview' }));

    expect(previewCall()).toBeUndefined();
    expect(screen.queryByLabelText('Visit summary PDF preview')).not.toBeInTheDocument();
  });

  it('shows the permission message without a retry when the preview returns 403', async () => {
    const user = userEvent.setup();
    mockFetch({ preview: () => Promise.reject(rejectionWithStatus(403)) });
    renderWithSwr(<VisitSummaryConfig />);

    await user.click(await screen.findByRole('button', { name: 'Save & preview' }));

    expect(await screen.findByText('Not authorized')).toBeVisible();
    expect(screen.getByText(forbiddenText)).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Visit summary PDF preview')).not.toBeInTheDocument();
  });

  it('reports an outdated backend, not a generic failure, when the preview returns 404', async () => {
    const user = userEvent.setup();
    mockFetch({ preview: () => Promise.reject(rejectionWithStatus(404)) });
    renderWithSwr(<VisitSummaryConfig />);

    await user.click(await screen.findByRole('button', { name: 'Save & preview' }));

    expect(await screen.findByText(endpointMissingText)).toBeVisible();
    expect(screen.getByText('Preview not available on this server')).toBeVisible();
    expect(screen.queryByText(generationFailedText)).not.toBeInTheDocument();
    expect(screen.queryByText(forbiddenText)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeEnabled();
  });

  it('shows a distinct retryable failure when the preview returns 500', async () => {
    const user = userEvent.setup();
    mockFetch({ preview: () => Promise.reject(rejectionWithStatus(500)) });
    renderWithSwr(<VisitSummaryConfig />);

    await user.click(await screen.findByRole('button', { name: 'Save & preview' }));

    expect(await screen.findByText(generationFailedText)).toBeVisible();
    expect(screen.getByText('PDF generation failed')).toBeVisible();
    expect(screen.queryByText(endpointMissingText)).not.toBeInTheDocument();
    expect(screen.queryByText(networkErrorText)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeEnabled();
  });

  it('reports a generation failure, not a network error, when the response body cannot be read', async () => {
    const user = userEvent.setup();
    mockFetch({
      preview: () =>
        Promise.resolve({
          blob: () => Promise.reject(new TypeError('Failed to read response body')),
        } as unknown as FetchResponse),
    });
    renderWithSwr(<VisitSummaryConfig />);

    await user.click(await screen.findByRole('button', { name: 'Save & preview' }));

    expect(await screen.findByText(generationFailedText)).toBeVisible();
    expect(screen.queryByText(networkErrorText)).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Visit summary PDF preview')).not.toBeInTheDocument();
  });

  it('shows the network error when the preview request never reaches the server', async () => {
    const user = userEvent.setup();
    mockFetch({ preview: () => Promise.reject(new TypeError('Failed to fetch')) });
    renderWithSwr(<VisitSummaryConfig />);

    await user.click(await screen.findByRole('button', { name: 'Save & preview' }));

    expect(await screen.findByText(networkErrorText)).toBeVisible();
    expect(screen.getByText('Network error')).toBeVisible();
    expect(screen.queryByText(generationFailedText)).not.toBeInTheDocument();
    expect(screen.queryByText(endpointMissingText)).not.toBeInTheDocument();
  });

  it('retries the preview after a failure and renders the PDF on success', async () => {
    const user = userEvent.setup();
    const preview = vi
      .fn()
      .mockRejectedValueOnce(rejectionWithStatus(500))
      .mockResolvedValueOnce({ blob: () => Promise.resolve(mockPdfBlob) } as unknown as FetchResponse);
    mockFetch({ preview });
    renderWithSwr(<VisitSummaryConfig />);

    await user.click(await screen.findByRole('button', { name: 'Save & preview' }));
    await screen.findByText(generationFailedText);

    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByLabelText('Visit summary PDF preview')).toHaveAttribute('data', mockObjectUrl);
    expect(screen.queryByText(generationFailedText)).not.toBeInTheDocument();
  });

  it('revokes the preview object URL on unmount', async () => {
    const user = userEvent.setup();
    mockFetch();
    const { unmount } = renderWithSwr(<VisitSummaryConfig />);

    await user.click(await screen.findByRole('button', { name: 'Save & preview' }));
    await screen.findByLabelText('Visit summary PDF preview');

    unmount();

    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith(mockObjectUrl);
  });
});
