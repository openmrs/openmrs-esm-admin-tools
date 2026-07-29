import React from 'react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { renderWithSwr } from '@tools/test-helpers';
import { waitForLoadingToFinish } from '@tools/index';
import { openmrsFetch, type Session, useConfig, useSession } from '@openmrs/esm-framework';
import OverviewComponent from './overview.component';
import { mockReports, mockSession } from '@mocks/index';
import { useReports } from './reports.resource';

// Mock dependencies
vi.mock('@openmrs/esm-framework', () => ({
  openmrsFetch: vi.fn(),
  useConfig: vi.fn(),
  useSession: vi.fn(),
  useLayoutType: vi.fn(() => 'desktop'),
  isDesktop: vi.fn(() => true),
  userHasAccess: vi.fn(() => true),
  ExtensionSlot: vi.fn(({ name }) => <div data-testid={`extension-slot-${name}`} />),
  navigate: vi.fn(),
  showModal: vi.fn(),
  getGlobalStore: vi.fn(() => ({
    getState: vi.fn(),
    setState: vi.fn(),
    subscribe: vi.fn(),
  })),
}));

const mockUseReports = vi.mocked(useReports);

vi.mock('./reports.resource', () => ({
  useReports: vi.fn(),
  downloadReport: vi.fn(),
  downloadMultipleReports: vi.fn(),
  preserveReport: vi.fn(),
}));

const mockUseSession = vi.mocked(useSession);
const mockOpenmrsFetch = vi.mocked(openmrsFetch);
const mockUseConfig = vi.mocked(useConfig);

describe('OverviewComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSession.mockReturnValue(mockSession.data);
  });

  it('should show View button for Web Preview reports', async () => {
    mockUseConfig.mockReturnValue({
      webPreviewViewReportUrl: 'https://example.com/view/{reportRequestUuid}',
    });

    mockUseReports.mockReturnValue({
      reports: mockReports,
      reportsTotalCount: mockReports.length,
      error: null,
      isValidating: false,
      mutateReports: vi.fn(),
    });

    renderWithSwr(<OverviewComponent />);

    // Wait for the component to render
    await waitFor(() => {
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    const expectedColumnHeaders = [
      /report name/i,
      /status/i,
      /requested by/i,
      /requested on/i,
      /output format/i,
      /actions/i,
    ];

    expectedColumnHeaders.forEach((header) => {
      expect(screen.getByRole('columnheader', { name: new RegExp(header, 'i') })).toBeInTheDocument();
    });

    const allRows = screen.getAllByRole('row');
    expect(allRows.length).toBe(6);
    const rowTexts = allRows.map((row) => row.textContent);

    const expectedRowContents = [
      'Report nameStatusRequested byRequested onOutput formatParametersActions',
      'OPD/IPD ReportFailedRUHINYURAMPUNZI RUHINYURAMPUNZI RUHINYURAMPUNZI2025-11-12 12:00CsvReportRendererstartDate: 2025-05-06, endDate: 2025-05-06, department: Pediatric ServiceDelete',
      'OPD/IPD ReportFailedRUHINYURAMPUNZI RUHINYURAMPUNZI RUHINYURAMPUNZI2025-11-11 12:00CsvReportRendererstartDate: 2025-05-06, endDate: 2025-05-06, department: Pediatric ServiceDelete',
      'OPD/IPD ReportFailedRUHINYURAMPUNZI RUHINYURAMPUNZI RUHINYURAMPUNZI2025-11-10 12:00CsvReportRendererstartDate: 2025-05-06, endDate: 2025-05-06, department: Pediatric ServiceDelete',
      'Generic Encounter ReportCompletedAdmin User2025-11-13 10:30Web PreviewstartDate: 2025-11-01, endDate: 2025-11-13, location: Main ClinicViewPreserveDelete',
      'Patient Demographics ReportCompletedSystem Administrator2025-11-13 09:15Generic Encounter Report.xlslocation: All Locations, ageGroup: AdultDownloadPreserveDelete',
    ];

    expectedRowContents.forEach((expectedContent, index) => {
      expect(rowTexts[index]).toBe(expectedContent);
    });

    const viewButtons = screen.queryAllByText('View');
    expect(viewButtons.length).toBe(1);
  });

  it('should show Download button when webPreviewViewReportUrl is NOT configured', async () => {
    mockUseConfig.mockReturnValue({
      webPreviewViewReportUrl: '', // No URL configured
    });

    mockUseReports.mockReturnValue({
      reports: mockReports,
      reportsTotalCount: mockReports.length,
      error: null,
      isValidating: false,
      mutateReports: vi.fn(),
    });

    renderWithSwr(<OverviewComponent />);

    // Wait for the component to render
    await waitFor(() => {
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    // Validate table headers
    const expectedColumnHeaders = [
      /report name/i,
      /status/i,
      /requested by/i,
      /requested on/i,
      /output format/i,
      /actions/i,
    ];

    expectedColumnHeaders.forEach((header) => {
      expect(screen.getByRole('columnheader', { name: new RegExp(header, 'i') })).toBeInTheDocument();
    });

    // Validate row contents - when webPreviewViewReportUrl is NOT configured:
    // - Failed reports should show Delete button only
    // - Completed reports should show Download button instead of View button
    const allRows = screen.getAllByRole('row');
    expect(allRows.length).toBe(6);
    const rowTexts = allRows.map((row) => row.textContent);

    const expectedRowContents = [
      'Report nameStatusRequested byRequested onOutput formatParametersActions',
      'OPD/IPD ReportFailedRUHINYURAMPUNZI RUHINYURAMPUNZI RUHINYURAMPUNZI2025-11-12 12:00CsvReportRendererstartDate: 2025-05-06, endDate: 2025-05-06, department: Pediatric ServiceDelete',
      'OPD/IPD ReportFailedRUHINYURAMPUNZI RUHINYURAMPUNZI RUHINYURAMPUNZI2025-11-11 12:00CsvReportRendererstartDate: 2025-05-06, endDate: 2025-05-06, department: Pediatric ServiceDelete',
      'OPD/IPD ReportFailedRUHINYURAMPUNZI RUHINYURAMPUNZI RUHINYURAMPUNZI2025-11-10 12:00CsvReportRendererstartDate: 2025-05-06, endDate: 2025-05-06, department: Pediatric ServiceDelete',
      'Generic Encounter ReportCompletedAdmin User2025-11-13 10:30Web PreviewstartDate: 2025-11-01, endDate: 2025-11-13, location: Main ClinicDownloadPreserveDelete',
      'Patient Demographics ReportCompletedSystem Administrator2025-11-13 09:15Generic Encounter Report.xlslocation: All Locations, ageGroup: AdultDownloadPreserveDelete',
    ];

    expectedRowContents.forEach((expectedContent, index) => {
      expect(rowTexts[index]).toBe(expectedContent);
    });

    const downloadButtons = screen.getAllByText('Download');
    expect(downloadButtons.length).toBe(2);

    const viewButtons = screen.queryAllByText('View');
    expect(viewButtons).toHaveLength(0);
  });
});
