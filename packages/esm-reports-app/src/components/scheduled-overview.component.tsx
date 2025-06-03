import React, { useMemo, useState } from 'react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import {
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
import { ExtensionSlot, isDesktop, useLayoutType, usePagination } from '@openmrs/esm-framework';
import { useScheduledReports } from './reports.resource';
import Overlay from './overlay.component';
import ScheduledOverviewCellContent from './scheduled-overview-cell-content.component';
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZES } from './pagination-constants';
import styles from './reports.scss';

const ScheduledOverviewComponent: React.FC = () => {
  const { t } = useTranslation();
  const layout = useLayoutType();

  // FIXME This needs proper types
  const { scheduledReports, mutateScheduledReports } = useScheduledReports('name');
  const scheduledReportRows = scheduledReports
    ? scheduledReports.map((report) => ({
        id: report.reportRequestUuid ? report.reportRequestUuid : report.reportDefinitionUuid,
        name: report.name,
        status: !!report.reportRequestUuid,
        schedule: report.schedule,
        nextRun: report.schedule,
        actions: {
          reportDefinitionUuid: report.reportDefinitionUuid,
          reportRequestUuid: report.reportRequestUuid,
        },
      }))
    : [];

  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const { currentPage, results, goTo } = usePagination<any>(scheduledReportRows, pageSize);

  const tableHeaders = useMemo(
    () => [
      { key: 'name', header: t('reportName', 'Report name') },
      { key: 'status', header: t('status', 'Status') },
      { key: 'schedule', header: t('schedule', 'Schedule') },
      { key: 'nextRun', header: t('nextRun', 'Next run') },
      { key: 'actions', header: t('actions', 'Actions') },
    ],
    [t],
  );

  return (
    <div>
      <ExtensionSlot name="breadcrumbs-slot" className={styles.breadcrumb} />
      <div className={styles.mainPanelDiv}>
        <div className={styles.reportsLabelDiv}>
          <h3>{t('scheduledReports', 'Scheduld Reports')}</h3>
        </div>
        <div className={styles.mainActionButtonsDiv}></div>
        <DataTable rows={results} headers={tableHeaders} isSortable={false}>
          {({ rows, headers }) => (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    {headers.map((header, index) => (
                      <TableHeader key={header.key ?? `header-${index}`}>{header.header}</TableHeader>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row, index) => (
                    <TableRow key={row.id ?? `row-${index}`} className={styles.tableRow}>
                      {row.cells.map((cell) => (
                        <TableCell
                          key={cell.id}
                          className={classNames({
                            [styles.rowCellEven]: index % 2 === 0,
                            [styles.rowCellOdd]: index % 2 !== 0,
                          })}
                        >
                          <ScheduledOverviewCellContent cell={cell} mutate={mutateScheduledReports} />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DataTable>
        <Pagination
          backwardText={t('previousPage', 'Previous page')}
          forwardText={t('nextPage', 'Next page')}
          page={currentPage}
          pageSize={pageSize}
          pageSizes={DEFAULT_PAGE_SIZES}
          totalItems={scheduledReports?.length}
          size={isDesktop(layout) ? 'sm' : 'lg'}
          onChange={({ pageSize: newPageSize, page: newPage }) => {
            if (newPageSize !== pageSize) {
              setPageSize(newPageSize);
            }

            if (newPage !== currentPage) {
              goTo(newPage);
            }
          }}
        />
      </div>
      <Overlay />
    </div>
  );
};

export default ScheduledOverviewComponent;
