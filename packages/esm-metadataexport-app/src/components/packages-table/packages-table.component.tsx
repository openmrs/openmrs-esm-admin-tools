import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DataTable,
  DataTableSkeleton,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from '@carbon/react';
import {
  CardHeader,
  EmptyCard,
  ErrorState,
  isDesktop,
  useLayoutType,
  useSession,
  userHasAccess,
} from '@openmrs/esm-framework';
import { formatDomainLabel } from '../../domain-lookups/domain-lookups.resource';
import { usePackages } from '../../packages/packages.resource';
import { launchPackageFormWorkspace } from '../metadata-package-form/metadata-package-form-utils';
import ViewPackageActionButton from '../view-metadata-package/view-package-action-button/view-package-action-button.component';
import styles from './packages-table.scss';

/**
 * DO NOT REMOVE THIS COMMENT, IT ADDS TRANSLATIONS FOR THE BUILD STATUSES
 * t('QUEUED', 'Queued')
 * t('RUNNING', 'Running')
 * t('COMPLETED', 'Completed')
 * t('FAILED', 'Failed')
 */

const PackagesTable: React.FC = () => {
  const { t } = useTranslation();
  const layout = useLayoutType();
  const session = useSession();
  const [pageSize, setPageSize] = useState(10);
  const { packages, totalCount, currentPage, goTo, isLoading, error } = usePackages(pageSize);

  const canManage = session.user ? userHasAccess('Manage Metadata Export Packages', session.user) : false;

  const headerTitle = t('packages', 'Packages');

  const headers = useMemo(
    () => [
      { key: 'name', header: t('packageName', 'Package name') },
      { key: 'domains', header: t('domains', 'Domains') },
      { key: 'description', header: t('description', 'Description') },
      { key: 'status', header: t('status', 'Status') },
      { key: 'actions', header: ' ' },
    ],
    [t],
  );

  const rows = useMemo(
    () =>
      packages.map((exportPackage) => ({
        id: exportPackage.uuid,
        name: exportPackage.name,
        // An empty entries list means the package includes every registered domain.
        domains: exportPackage.entries.length
          ? exportPackage.entries.map((entry) => formatDomainLabel(entry.domain)).join(', ')
          : t('allDomains', 'All domains'),
        description: exportPackage.description,
        status: exportPackage.latestBuild ? t(exportPackage.latestBuild.status) : t('noBuilds', 'No builds'),
      })),
    [packages, t],
  );

  const packagesByUuid = useMemo(
    () => new Map(packages.map((exportPackage) => [exportPackage.uuid, exportPackage])),
    [packages],
  );

  // keepPreviousData holds the current page on screen while the next one loads, so only show the
  // skeleton on the initial load; otherwise paging swaps the table for the skeleton and drops focus.
  if (isLoading && !packages.length) {
    return (
      <div className={styles.container}>
        <DataTableSkeleton role="progressbar" columnCount={headers.length} zebra />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <ErrorState error={error} headerTitle={headerTitle} />
      </div>
    );
  }

  if (!packages.length) {
    return (
      <div className={styles.container}>
        <EmptyCard
          displayText={t('packages__lower', 'packages')}
          headerTitle={headerTitle}
          launchForm={canManage ? () => launchPackageFormWorkspace(t) : undefined}
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.widgetCard}>
        <CardHeader title={headerTitle} />
        <DataTable rows={rows} headers={headers} size={isDesktop(layout) ? 'sm' : 'lg'} useZebraStyles>
          {({ rows, headers, getHeaderProps, getRowProps, getTableProps }) => (
            <TableContainer>
              <Table {...getTableProps()}>
                <TableHead>
                  <TableRow>
                    {headers.map((header) => (
                      <TableHeader {...getHeaderProps({ header })} key={header.key}>
                        {header.header}
                      </TableHeader>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow {...getRowProps({ row })} key={row.id}>
                      {row.cells.map((cell) =>
                        cell.info.header === 'actions' ? (
                          <TableCell key={cell.id}>
                            <ViewPackageActionButton exportPackage={packagesByUuid.get(row.id)} />
                          </TableCell>
                        ) : (
                          <TableCell key={cell.id}>{cell.value}</TableCell>
                        ),
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DataTable>
        <Pagination
          forwardText={t('nextPage', 'Next page')}
          backwardText={t('previousPage', 'Previous page')}
          page={currentPage}
          pageSize={pageSize}
          pageSizes={[10, 20, 50, 100]}
          totalItems={totalCount}
          size={isDesktop(layout) ? 'sm' : 'lg'}
          onChange={({ page, pageSize: newPageSize }) => {
            if (newPageSize !== pageSize) {
              setPageSize(newPageSize);
            }
            goTo(page);
          }}
        />
      </div>
    </div>
  );
};

export default PackagesTable;
