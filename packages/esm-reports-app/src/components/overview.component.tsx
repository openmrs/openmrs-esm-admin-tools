import {
  Button,
  Checkbox,
  DataTable,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from '@carbon/react';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { downloadMultipleReports, downloadReport, preserveReport, useReports } from './reports.resource';
import {
  ExtensionSlot,
  isDesktop,
  navigate,
  showModal,
  showToast,
  useLayoutType,
  userHasAccess,
  useSession,
} from '@openmrs/esm-framework';
import { Calendar, Download, Play, Save, TrashCan } from '@carbon/react/icons';
import styles from './reports.scss';
import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZES } from './pagination-constants';
import { closeOverlay, launchOverlay } from '../hooks/useOverlay';
import RunReportForm from './run-report/run-report-form.component';
import Overlay from './overlay.component';
import ReportStatus from './report-status.component';
import { COMPLETED, SAVED } from './report-statuses-constants';
import ReportOverviewButton from './report-overview-button.component';
import { PRIVILEGE_SYSTEM_DEVELOPER } from '../constants';

const OverviewComponent: React.FC = () => {
  const { t } = useTranslation();
  const currentSession = useSession();

  let [checkedReportUuidsArray, setCheckedReportUuidsArray] = useState([]);
  const [downloadReportButtonVisible, setDownloadReportButtonVisible] = useState(false);

  useEffect(() => {
    setDownloadReportButtonVisible(checkedReportUuidsArray.length > 0);
  }, [checkedReportUuidsArray]);

  const tableHeaders = [
    { key: 'reportName', header: t('reportName', 'Report Name') },
    { key: 'status', header: t('status', 'Status') },
    { key: 'requestedBy', header: t('requestedBy', 'Requested by') },
    { key: 'requestedOn', header: t('requestedOn', 'Requested on') },
    { key: 'outputFormat', header: t('outputFormat', 'Output format') },
    { key: 'parameters', header: t('parameters', 'Parameters') },
    { key: 'actions', header: t('actions', 'Actions') },
  ];

  const [currentPage, setCurrentPage] = useState(DEFAULT_PAGE_NUMBER);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const { reports, reportsTotalCount, mutateReports } = useReports('ran', currentPage, pageSize);

  const layout = useLayoutType();

  function getReportStatus(row) {
    return row?.cells.find((cell) => cell.info?.header === 'status')?.value;
  }

  function isCurrentUserTheSameAsReportRequestedByUser(reportRequestUuid: string) {
    const report = reports.find((tableRow) => tableRow.id === reportRequestUuid);
    const requestedByUserUuid = report?.requestedByUserUuid;
    const currentUserUuid = currentSession?.user.uuid;

    return requestedByUserUuid === currentUserUuid;
  }

  function isSystemDeveloperUser() {
    return userHasAccess(PRIVILEGE_SYSTEM_DEVELOPER, currentSession.user);
  }

  function isEligibleReportUser(reportRequestUuid: string) {
    return isCurrentUserTheSameAsReportRequestedByUser(reportRequestUuid) || isSystemDeveloperUser();
  }

  function renderRowCheckbox(row, index) {
    const statusCell = row?.cells.find((cell) => cell.info?.header === 'status');
    const statusValue = statusCell?.value;
    if (statusValue === COMPLETED || statusValue === SAVED) {
      return (
        <td className={index % 2 == 0 ? styles.rowCellEven : styles.rowCellOdd}>
          <Checkbox
            id={`checkbox-${row.id}`}
            onChange={(e) => handleOnCheckboxClick(e)}
            checked={checkedReportUuidsArray.includes(row.id)}
          />
        </td>
      );
    } else {
      return <td className={index % 2 == 0 ? styles.rowCellEven : styles.rowCellOdd}></td>;
    }
  }

  function handleOnCheckboxClick(event) {
    const checkboxElement = event?.target;
    const checkboxId = checkboxElement.id;
    const reportUuid = checkboxId.slice(checkboxId.indexOf('-') + 1);
    const isChecked = checkboxElement?.checked;

    setCheckedReportUuidsArray((prevState) => {
      if (isChecked && !prevState.includes(reportUuid)) {
        return [...prevState, reportUuid];
      } else {
        return prevState.filter((checkedReportUuid) => checkedReportUuid !== reportUuid);
      }
    });
  }

  const handlePreserveReport = useCallback(async (reportRequestUuid: string) => {
    preserveReport(reportRequestUuid)
      .then(() => {
        mutateReports();
        showToast({
          critical: true,
          kind: 'success',
          title: t('preserveReport', 'Preserve report'),
          description: t('reportPreservedSuccessfully', 'Report preserved successfully'),
        });
      })
      .catch((error) => {
        showToast({
          critical: true,
          kind: 'error',
          title: t('preserveReport', 'Preserve report'),
          description: t('reportPreservingErrorMsg', 'Error during report preserving'),
        });
      });
  }, []);

  const launchDeleteReportDialog = (reportRequestUuid: string) => {
    const dispose = showModal('cancel-report-modal', {
      closeModal: () => {
        dispose();
        mutateReports();
      },
      reportRequestUuid,
      modalType: 'delete',
    });
  };

  const handleDownloadReport = useCallback(async (reportRequestUuid: string) => {
    try {
      const response = await downloadReport(reportRequestUuid);
      processAndDownloadFile(response);
      clearReportCheckboxes();
      showToast({
        critical: true,
        kind: 'success',
        title: t('downloadReport', 'Download report'),
        description: t('reportDownloadedSuccessfully', 'Report downloaded successfully'),
      });
    } catch (error) {
      showToast({
        critical: true,
        kind: 'error',
        title: t('downloadReport', 'Download report'),
        description: t('reportDownloadingErrorMsg', 'Error during report downloading'),
      });
    }
  }, []);

  const handleDownloadMultipleReports = useCallback(async (reportRequestUuids) => {
    try {
      const response = await downloadMultipleReports(reportRequestUuids);
      response.forEach((file) => processAndDownloadFile(file));
      clearReportCheckboxes();
      showToast({
        critical: true,
        kind: 'success',
        title: t('downloadReport', 'Download report(s)'),
        description: t('reportDownloadedSuccessfully', 'Report(s) downloaded successfully'),
      });
    } catch (error) {
      showToast({
        critical: true,
        kind: 'error',
        title: t('downloadReport', 'Download report(s)s'),
        description: t('reportDownloadingErrorMsg', 'Error during report(s) downloading'),
      });
    }
  }, []);

  const processAndDownloadFile = (file) => {
    const decodedData = window.atob(file.fileContent);
    const byteArray = new Uint8Array(decodedData.length);
    for (let i = 0; i < decodedData.length; i++) {
      byteArray[i] = decodedData.charCodeAt(i);
    }
    const url = window.URL.createObjectURL(new Blob([byteArray]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', file.filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearReportCheckboxes = () => {
    setCheckedReportUuidsArray([]);
  };

  return (
    <div>
      <ExtensionSlot name="breadcrumbs-slot" className={styles.breadcrumb} />
      <div className={styles.mainPanelDiv}>
        <div className={styles.reportsLabelDiv}>
          <h3>{t('reports', 'Reports')}</h3>
        </div>
        <div className={styles.mainActionButtonsDiv}>
          <Button
            kind="ghost"
            renderIcon={() => <Download size={16} style={{ fill: '#0F62FE' }} className={styles.actionButtonIcon} />}
            iconDescription="Download reports"
            onClick={() => handleDownloadMultipleReports(checkedReportUuidsArray.join(','))}
            className={`${styles.mainActionButton} ${
              downloadReportButtonVisible ? styles.downloadReportsVisible : styles.downloadReportsHidden
            }`}
          >
            {t('downloadReports', 'Download reports')}
          </Button>
          <Button
            kind="ghost"
            renderIcon={() => <Play size={16} style={{ fill: '#0F62FE' }} className={styles.actionButtonIcon} />}
            iconDescription="Run reports"
            onClick={() => {
              launchOverlay(
                t('runReport', 'Run Report'),
                <RunReportForm
                  closePanel={() => {
                    closeOverlay();
                    mutateReports();
                  }}
                />,
              );
            }}
            className={styles.mainActionButton}
          >
            {t('runReports', 'Run reports')}
          </Button>
          <Overlay />
          <Button
            kind="ghost"
            renderIcon={() => <Calendar size={16} style={{ fill: '#0F62FE' }} className={styles.actionButtonIcon} />}
            iconDescription="Report schedule"
            onClick={() => navigate({ to: `\${openmrsSpaBase}/reports/scheduled-overview` })}
            className={styles.mainActionButton}
          >
            {t('reportSchedule', 'Report schedule')}
          </Button>
        </div>
      </div>
      <DataTable rows={reports} headers={tableHeaders} isSortable>
        {({ rows, headers }) => (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <th></th>
                  {headers.map((header) => (
                    <TableHeader>{header.header?.content ?? header.header}</TableHeader>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row, index) => (
                  <TableRow className={styles.tableRow}>
                    {renderRowCheckbox(row, index)}
                    {row.cells.map((cell) => (
                      <TableCell className={index % 2 == 0 ? styles.rowCellEven : styles.rowCellOdd}>
                        {cell.info.header === 'actions' ? (
                          <div>
                            <ReportOverviewButton
                              shouldBeDisplayed={getReportStatus(row) === COMPLETED || getReportStatus(row) === SAVED}
                              label={t('download', 'Download')}
                              icon={() => <Download size={16} className={styles.actionButtonIcon} />}
                              reportRequestUuid={row.id}
                              onClick={() => handleDownloadReport(row.id)}
                            />
                            <ReportOverviewButton
                              shouldBeDisplayed={getReportStatus(row) === COMPLETED && isEligibleReportUser(row.id)}
                              label={t('preserve', 'Preserve')}
                              icon={() => <Save size={16} className={styles.actionButtonIcon} />}
                              reportRequestUuid={row.id}
                              onClick={() => handlePreserveReport(row.id)}
                            />
                            <ReportOverviewButton
                              shouldBeDisplayed={isEligibleReportUser(row.id)}
                              label={t('delete', 'Delete')}
                              icon={() => <TrashCan size={16} className={styles.actionButtonIcon} />}
                              reportRequestUuid={row.id}
                              onClick={() => launchDeleteReportDialog(row.id)}
                            />
                          </div>
                        ) : cell.info.header === 'status' ? (
                          <div>
                            <ReportStatus status={cell.value} />
                          </div>
                        ) : cell.info.header === 'reportName' ? (
                          <div>{cell.value?.content ?? cell.value}</div>
                        ) : (
                          cell.value?.content ?? cell.value
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DataTable>
      {reports.length > 0 ? (
        <Pagination
          backwardText={t('previousPage', 'Previous page')}
          forwardText={t('nextPage', 'Next page')}
          page={currentPage}
          pageSize={pageSize}
          pageSizes={DEFAULT_PAGE_SIZES}
          totalItems={reportsTotalCount}
          size={isDesktop(layout) ? 'sm' : 'lg'}
          onChange={({ pageSize: newPageSize, page: newPage }) => {
            if (newPageSize !== pageSize) {
              setPageSize(newPageSize);
            }

            if (newPage !== currentPage) {
              setCurrentPage(newPage);
            }
          }}
        />
      ) : null}
    </div>
  );
};

export default OverviewComponent;
