import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DataTable,
  DataTableSkeleton,
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
import { useAllPackages } from '../../packages/packages.resource';
import { launchAddNewPackageWorkspace } from '../new-package/new-package-utils';
import ViewPackageActionButton from '../view-package/view-package-action-button/view-package-action-button.component';
import styles from './packages-table.scss';

const PackagesTable: React.FC = () => {
  const { t } = useTranslation();
  const layout = useLayoutType();
  const session = useSession();
  const { packages, isLoading, error } = useAllPackages();

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
        status: exportPackage.latestBuild ? t(exportPackage.latestBuild.status) : t('noBuilds', 'NO BUILDS'),
      })),
    [packages, t],
  );

  if (isLoading) {
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
          launchForm={canManage ? () => launchAddNewPackageWorkspace(t) : undefined}
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
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
                          <ViewPackageActionButton exportPackage={packages.find((p) => p.uuid === row.id)} />
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
    </div>
  );
};

export default PackagesTable;
