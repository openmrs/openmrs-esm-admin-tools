import React, { useCallback, useEffect, useState } from 'react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
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
import { Calendar, Download, Play, Save, TrashCan } from '@carbon/react/icons';
import { downloadMultipleReports, downloadReport, preserveReport, useReports } from './reports.resource';
import {
  ExtensionSlot,
  isDesktop,
  navigate,
  showModal,
  showSnackbar,
  useLayoutType,
  userHasAccess,
  useSession,
} from '@openmrs/esm-framework';
import { closeOverlay, launchOverlay } from '../hooks/useOverlay';
import { COMPLETED, RAN_REPORT_STATUSES, SAVED } from './report-statuses-constants';
import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZES } from './pagination-constants';
import { PRIVILEGE_SYSTEM_DEVELOPER } from '../constants';
import Overlay from './overlay.component';
import ReportOverviewButton from './report-overview-button.component';
import ReportStatus from './report-status.component';
import RunReportForm from './run-report/run-report-form.component';
import styles from './reports.scss';

const OverviewComponent: React.FC = () => {
  const { t } = useTranslation();
  const currentSession = useSession();

  let [checkedReportUuidsArray, setCheckedReportUuidsArray] = useState([]);
  const [downloadReportButtonVisible, setDownloadReportButtonVisible] = useState(false);

  useEffect(() => {
    setDownloadReportButtonVisible(checkedReportUuidsArray.length > 0);
  }, [checkedReportUuidsArray]);

  const tableHeaders = [
    { key: 'reportName', header: t('reportName', 'Report name') },
    { key: 'status', header: t('status', 'Status') },
    { key: 'requestedBy', header: t('requestedBy', 'Requested by') },
    { key: 'requestedOn', header: t('requestedOn', 'Requested on') },
    { key: 'outputFormat', header: t('outputFormat', 'Output format') },
    { key: 'parameters', header: t('parameters', 'Parameters') },
    { key: 'actions', header: t('actions', 'Actions') },
  ];

  const [currentPage, setCurrentPage] = useState(DEFAULT_PAGE_NUMBER);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const { reports, reportsTotalCount, mutateReports } = useReports(
    RAN_REPORT_STATUSES.join(','),
    currentPage,
    pageSize,
  );

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
        <td className={classNames({ [styles.rowCellEven]: index % 2 === 0, [styles.rowCellOdd]: index % 2 !== 0 })}>
          <Checkbox
            id={`checkbox-${row.id}`}
            onChange={(e) => handleOnCheckboxClick(e)}
            checked={checkedReportUuidsArray.includes(row.id)}
          />
        </td>
      );
    } else {
      return (
        <td
          className={classNames({ [styles.rowCellEven]: index % 2 === 0, [styles.rowCellOdd]: index % 2 !== 0 })}
        ></td>
      );
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

  const handlePreserveReport = useCallback(
    async (reportRequestUuid: string) => {
      preserveReport(reportRequestUuid)
        .then(() => {
          mutateReports();
          showSnackbar({
            kind: 'success',
            title: t('preserveReport', 'Preserve report'),
            subtitle: t('reportPreservedSuccessfully', 'Report preserved successfully'),
          });
        })
        .catch(() => {
          showSnackbar({
            kind: 'error',
            title: t('preserveReport', 'Preserve report'),
            subtitle: t('reportPreservingErrorMsg', 'Error during report preserving'),
          });
        });
    },
    [mutateReports, t],
  );

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

  const handleDownloadReport = useCallback(
    async (reportRequestUuid: string) => {
      try {
        const response = await downloadReport(reportRequestUuid);
        processAndDownloadFile(response);
        clearReportCheckboxes();
        showSnackbar({
          kind: 'success',
          title: t('reportDownloaded', 'Report downloaded'),
          subtitle: t('reportDownloadedSuccessfully', 'Report downloaded successfully'),
        });
      } catch (error) {
        showSnackbar({
          kind: 'error',
          title: t('errorDownloadingReport', 'Error downloading report'),
          subtitle: error?.message,
        });
      }
    },
    [t],
  );

  const handleDownloadMultipleReports = useCallback(
    async (reportRequestUuids) => {
      try {
        const response = await downloadMultipleReports(reportRequestUuids);
        response.forEach((file) => processAndDownloadFile(file));
        clearReportCheckboxes();
        showSnackbar({
          kind: 'success',
          title: t('reportsDownloaded', 'Reports downloaded'),
          subtitle: t('reportsDownloadedSuccessfully', 'Reports downloaded successfully'),
        });
      } catch (error) {
        showSnackbar({
          kind: 'error',
          title: t('errorDownloadingReports', 'Error downloading reports'),
          subtitle: error?.message,
        });
      }
    },
    [t],
  );

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
            className={classNames(styles.mainActionButton, {
              [styles.downloadReportsVisible]: downloadReportButtonVisible,
              [styles.downloadReportsHidden]: !downloadReportButtonVisible,
            })}
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
            className={styles.mainActionButton}
            iconDescription="Report schedule"
            kind="ghost"
            onClick={() => navigate({ to: `\${openmrsSpaBase}/reports/scheduled-overview` })}
            renderIcon={() => <Calendar size={16} style={{ fill: '#0F62FE' }} className={styles.actionButtonIcon} />}
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
                      <TableCell
                        key={cell.id}
                        className={classNames({
                          [styles.rowCellEven]: index % 2 === 0,
                          [styles.rowCellOdd]: index % 2 !== 0,
                        })}
                      >
                        {cell.info.header === 'actions' ? (
                          <div>
                            <ReportOverviewButton
                              icon={() => <Download size={16} className={styles.actionButtonIcon} />}
                              label={t('download', 'Download')}
                              onClick={() => handleDownloadReport(row.id)}
                              reportRequestUuid={row.id}
                              shouldBeDisplayed={getReportStatus(row) === COMPLETED || getReportStatus(row) === SAVED}
                            />
                            <ReportOverviewButton
                              icon={() => <Save size={16} className={styles.actionButtonIcon} />}
                              label={t('preserve', 'Preserve')}
                              onClick={() => handlePreserveReport(row.id)}
                              reportRequestUuid={row.id}
                              shouldBeDisplayed={getReportStatus(row) === COMPLETED && isEligibleReportUser(row.id)}
                            />
                            <ReportOverviewButton
                              icon={() => <TrashCan size={16} className={styles.actionButtonIcon} />}
                              label={t('delete', 'Delete')}
                              onClick={() => launchDeleteReportDialog(row.id)}
                              reportRequestUuid={row.id}
                              shouldBeDisplayed={isEligibleReportUser(row.id)}
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
          onChange={({ pageSize: newPageSize, page: newPage }) => {
            if (newPageSize !== pageSize) {
              setPageSize(newPageSize);
            }

            if (newPage !== currentPage) {
              setCurrentPage(newPage);
            }
          }}
          page={currentPage}
          pageSize={pageSize}
          pageSizes={DEFAULT_PAGE_SIZES}
          size={isDesktop(layout) ? 'sm' : 'lg'}
          totalItems={reportsTotalCount}
        />
      ) : null}
    </div>
  );
};

export default OverviewComponent;
