import React, { useState, useCallback, lazy, Suspense } from 'react';

const AuditLogDetailModal = lazy(() => import('./audit-log-detail-modal.component'));
import { useTranslation } from 'react-i18next';
import {
  DataTable,
  DataTableSkeleton,
  InlineNotification,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  TableToolbar,
  TableToolbarContent,
  Tag,
  Tile,
} from '@carbon/react';
import { formatDatetime, parseDate } from '@openmrs/esm-framework';
import { useAuditLogs } from './audit-log.resource';
import AuditLogFiltersPanel from './audit-log-filters.component';
import type { AuditAction, AuditLogFilters } from './audit-log.types';
import styles from './audit-log-dashboard.scss';

const DEFAULT_FILTERS: AuditLogFilters = {
  userUuid: '',
  action: '',
  startDate: undefined,
  endDate: undefined,
};

const PAGE_SIZES = [10, 25, 50];

const actionTagColors: Record<AuditAction, 'green' | 'blue' | 'red'> = {
  CREATED: 'green',
  UPDATED: 'blue',
  DELETED: 'red',
};

const headers = [
  { key: 'dateCreated', header: 'Date & Time' },
  { key: 'userDisplay', header: 'User' },
  { key: 'action', header: 'Action' },
  { key: 'simpleType', header: 'Object type' },
  { key: 'identifier', header: 'Object ID' },
  { key: 'hasChildLogs', header: 'Child logs' },
];

const AuditLogDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<AuditLogFilters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);

  const startIndex = (page - 1) * pageSize;
  const { logs, totalCount, isLoading, error } = useAuditLogs(filters, startIndex, pageSize);

  const handleFiltersChange = useCallback((updated: AuditLogFilters) => {
    setFilters(updated);
    setPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
    setPageSize(PAGE_SIZES[0]);
  }, []);

  const rows = logs.map((log) => ({
    id: log.uuid,
    dateCreated: formatDatetime(parseDate(log.dateCreated), { mode: 'standard' }),
    userDisplay: log.userDisplay || '—',
    action: (
      <Tag type={actionTagColors[log.action]} size="sm">
        {log.action}
      </Tag>
    ),
    simpleType: log.simpleType,
    identifier: log.identifier,
    hasChildLogs: log.hasChildLogs ? t('yes', 'Yes') : t('no', 'No'),
  }));

  if (isLoading) {
    return <DataTableSkeleton role="progressbar" zebra columnCount={6} rowCount={pageSize} />;
  }

  if (error) {
    return (
      <InlineNotification
        kind="error"
        title={t('errorLoadingLogs', 'Error loading audit logs')}
        subtitle={error.message}
      />
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      <AuditLogFiltersPanel filters={filters} onChange={handleFiltersChange} onClear={handleClearFilters} />

      <DataTable rows={rows} headers={headers} isSortable useZebraStyles>
        {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
          <TableContainer title={t('auditLog', 'Audit Log')}>
            <TableToolbar>
              <TableToolbarContent />
            </TableToolbar>
            <Table {...getTableProps()} aria-label={t('auditLog', 'Audit Log')}>
              <TableHead>
                <TableRow>
                  {headers.map((header) => (
                    <TableHeader key={header.key} {...getHeaderProps({ header })}>
                      {header.header}
                    </TableHeader>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedUuid && (
                  <Suspense fallback={null}>
                    <AuditLogDetailModal uuid={selectedUuid} onClose={() => setSelectedUuid(null)} />
                  </Suspense>
                )}
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={headers.length}>
                      <Tile className={styles.emptyState}>
                        <p>{t('noLogsFound', 'No audit logs found')}</p>
                        <p className={styles.emptyStateMessage}>
                          {t(
                            'noLogsFoundMessage',
                            'No audit logs match the selected filters. Try adjusting your search criteria.',
                          )}
                        </p>
                      </Tile>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow
                      key={row.id}
                      {...getRowProps({ row })}
                      className={styles.clickableRow}
                      onClick={() => setSelectedUuid(row.id)}
                    >
                      {row.cells.map((cell) => (
                        <TableCell key={cell.id}>{cell.value}</TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DataTable>

      {totalCount > pageSize && (
        <Pagination
          page={page}
          pageSize={pageSize}
          pageSizes={PAGE_SIZES}
          totalItems={totalCount}
          onChange={({ page, pageSize }) => {
            setPage(page);
            setPageSize(pageSize);
          }}
        />
      )}
    </div>
  );
};

export default AuditLogDashboard;
