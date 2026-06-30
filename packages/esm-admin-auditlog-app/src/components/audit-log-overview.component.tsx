import React, { Fragment, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  Button,
  DataTable,
  DataTableSkeleton,
  InlineLoading,
  InlineNotification,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableExpandedRow,
  TableExpandHeader,
  TableExpandRow,
  TableHead,
  TableHeader,
  TableRow,
  Tile,
} from '@carbon/react';
import {
  isDesktop,
  type FetchError,
  useConfig,
  useLayoutType,
  useSession,
  userHasAccess,
} from '@openmrs/esm-framework';
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZES } from '../constants';
import type { ConfigObject } from '../config-schema';
import type { AuditLogFilterState } from '../types';
import { useAuditLogs } from './audit-log.resource';
import AuditLogFilters from './audit-log-filters.component';
import AuditLogEventTag from './audit-log-event-tag.component';
import AuditLogDiff from './audit-log-diff.component';
import styles from './audit-log-overview.scss';

// Writes a query param when the value is truthy, removes it otherwise — keeps the URL tidy.
function setOrDelete(params: URLSearchParams, key: string, value?: string | null) {
  if (value) {
    params.set(key, value);
  } else {
    params.delete(key);
  }
}

const AuditLogOverview: React.FC = () => {
  const { t } = useTranslation();
  const session = useSession();
  const { viewPrivilege } = useConfig<ConfigObject>();
  const layout = useLayoutType();
  const responsiveSize = isDesktop(layout) ? 'sm' : 'lg';

  // Filter and pagination state live in the URL so it survives refresh and is shareable.
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo<AuditLogFilterState>(
    () => ({
      entityType: searchParams.get('entityType') ?? '',
      username: searchParams.get('username') ?? '',
      startDate: searchParams.get('startDate') ? dayjs(searchParams.get('startDate')).toDate() : null,
      endDate: searchParams.get('endDate') ? dayjs(searchParams.get('endDate')).toDate() : null,
    }),
    [searchParams],
  );

  // Carbon Pagination is 1-based; backend is 0-based.
  const uiPage = Number(searchParams.get('page')) || 1;
  const pageSize = Number(searchParams.get('size')) || DEFAULT_PAGE_SIZE;
  const backendPage = uiPage - 1;

  const { logs, totalLogs, isLoading, isValidating, error, mutate, hasActiveFilter } = useAuditLogs(
    filters,
    backendPage,
    pageSize,
  );

  const hasFilters =
    Boolean(filters.entityType) ||
    Boolean(filters.username?.trim()) ||
    Boolean(filters.startDate) ||
    Boolean(filters.endDate);

  const updateParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          mutate(next);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const handleFilterChange = useCallback(
    (updated: Partial<AuditLogFilterState>) => {
      updateParams((params) => {
        if ('entityType' in updated) setOrDelete(params, 'entityType', updated.entityType);
        if ('username' in updated) setOrDelete(params, 'username', updated.username?.trim());
        if ('startDate' in updated) {
          setOrDelete(params, 'startDate', updated.startDate ? dayjs(updated.startDate).format('YYYY-MM-DD') : '');
        }
        if ('endDate' in updated) {
          setOrDelete(params, 'endDate', updated.endDate ? dayjs(updated.endDate).format('YYYY-MM-DD') : '');
        }
        // Any filter change resets to the first page.
        params.delete('page');
      });
    },
    [updateParams],
  );

  const handleClearFilters = useCallback(() => {
    updateParams((params) => {
      params.delete('entityType');
      params.delete('username');
      params.delete('startDate');
      params.delete('endDate');
      params.delete('page');
    });
  }, [updateParams]);

  // Empty viewPrivilege disables the gate for deployments that don't register the privilege.
  if (viewPrivilege && session && !userHasAccess(viewPrivilege, session.user)) {
    return (
      <div className={styles.container}>
        <Tile className={styles.permissionDenied}>
          <p>{t('noPermission', 'You do not have permission to view audit logs.')}</p>
        </Tile>
      </div>
    );
  }

  const tableHeaders = [
    { key: 'entityType', header: t('entityType', 'Entity type') },
    { key: 'eventType', header: t('event', 'Event') },
    { key: 'changedBy', header: t('changedBy', 'Changed by') },
    { key: 'changedOn', header: t('dateTime', 'Date & time') },
  ];

  // revisionID alone isn't unique per row; counter handles genuine duplicates.
  const keyOccurrences = new Map<string, number>();
  const tableRows = logs.map((log) => {
    const baseKey = `${log.revisionID}-${log.entityType}-${log.changedOn}`;
    const occurrence = keyOccurrences.get(baseKey) ?? 0;
    keyOccurrences.set(baseKey, occurrence + 1);
    return {
      id: occurrence === 0 ? baseKey : `${baseKey}-${occurrence}`,
      entityType: log.entityType?.split('.').pop() ?? log.entityType,
      eventType: log.eventType,
      changedBy: log.changedBy,
      changedOn: log.changedOn,
      _original: log,
    };
  });
  const originalById = new Map(tableRows.map((r) => [r.id, r._original]));

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h3 className={styles.title}>{t('auditLogs', 'Audit Logs')}</h3>
        <p className={styles.subtitle}>{t('trackAllChanges', 'Track all changes made across the system')}</p>
      </header>

      <AuditLogFilters
        filters={filters}
        onChange={handleFilterChange}
        onClearAll={handleClearFilters}
        hasActiveFilters={hasFilters}
      />

      {error && (
        <div className={styles.errorRow}>
          <InlineNotification
            kind="error"
            lowContrast
            title={t('errorLoadingLogs', 'Error loading audit logs')}
            subtitle={
              (error as unknown as FetchError)?.response?.status === 404
                ? t('moduleNotInstalled', 'The auditlogweb module is not installed on this server.')
                : t('tryAgain', 'Please try again.')
            }
          />
          <Button kind="ghost" size="sm" onClick={() => mutate()}>
            {t('retry', 'Retry')}
          </Button>
        </div>
      )}

      {!hasFilters && !error && (
        <Tile className={styles.emptyState}>
          <p className={styles.emptyTitle}>{t('searchPromptTitle', 'Search the audit log')}</p>
          <p className={styles.emptyBody}>
            {t('searchPromptBody', 'Filter by entity type, user, or date range to view changes.')}
          </p>
        </Tile>
      )}

      {hasFilters && isLoading && (
        <DataTableSkeleton
          role="progressbar"
          showHeader={false}
          showToolbar={false}
          rowCount={pageSize}
          columnCount={tableHeaders.length + 1}
          compact={isDesktop(layout)}
        />
      )}

      {hasFilters && !isLoading && !error && (
        <DataTable rows={tableRows} headers={tableHeaders} size={responsiveSize} useZebraStyles={false}>
          {({ rows, headers, getHeaderProps, getRowProps, getTableProps, getExpandHeaderProps }) => (
            <TableContainer className={styles.tableContainer}>
              {isValidating && (
                <div className={styles.tableToolbar}>
                  <InlineLoading className={styles.inlineLoading} description={t('updating', 'Updating…')} />
                </div>
              )}

              {logs.length === 0 ? (
                <Tile className={styles.emptyState}>
                  <p className={styles.emptyTitle}>{t('noLogsTitle', 'No audit logs to display')}</p>
                  <p className={styles.emptyBody}>
                    {t('noLogsFiltered', 'No audit logs match the current filters. Try adjusting or clearing them.')}
                  </p>
                </Tile>
              ) : (
                <Table {...getTableProps()} className={styles.table}>
                  <TableHead>
                    <TableRow>
                      <TableExpandHeader {...getExpandHeaderProps()} />
                      {headers.map((header) => (
                        <TableHeader key={header.key} {...getHeaderProps({ header })}>
                          {header.header}
                        </TableHeader>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row) => {
                      const original = originalById.get(row.id);
                      return (
                        <Fragment key={row.id}>
                          <TableExpandRow {...getRowProps({ row })}>
                            {row.cells.map((cell) => (
                              <TableCell key={cell.id}>
                                {cell.info.header === 'eventType' ? (
                                  <AuditLogEventTag eventType={cell.value} />
                                ) : (
                                  cell.value
                                )}
                              </TableCell>
                            ))}
                          </TableExpandRow>
                          {row.isExpanded && (
                            <TableExpandedRow colSpan={headers.length + 1} className={styles.expandedRow}>
                              <AuditLogDiff changes={original?.changes ?? []} hasActiveFilter={hasActiveFilter} />
                            </TableExpandedRow>
                          )}
                        </Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              )}

              {logs.length > 0 && (
                <Pagination
                  className={styles.pagination}
                  page={uiPage}
                  pageSize={pageSize}
                  pageSizes={DEFAULT_PAGE_SIZES}
                  totalItems={totalLogs}
                  size={responsiveSize}
                  onChange={({ page, pageSize: newSize }) => {
                    updateParams((params) => {
                      setOrDelete(params, 'page', page > 1 ? String(page) : '');
                      setOrDelete(params, 'size', newSize !== DEFAULT_PAGE_SIZE ? String(newSize) : '');
                    });
                  }}
                />
              )}
            </TableContainer>
          )}
        </DataTable>
      )}
    </div>
  );
};

export default AuditLogOverview;
