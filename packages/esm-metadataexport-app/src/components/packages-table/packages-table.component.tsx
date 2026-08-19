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
import { CardHeader, EmptyCard, ErrorState, isDesktop, useLayoutType } from '@openmrs/esm-framework';
import { formatDomainLabel } from '../../domain-lookups/domain-lookups.resource';
import { useAllPackages } from '../../packages/packages.resource';
import { launchAddNewPackageWorkspace } from '../new-package/new-package-utills';
import styles from './packages-table.component.scss';

const PackagesTable: React.FC = () => {
  const { t } = useTranslation();
  const layout = useLayoutType();
  const { packages, isLoading, error } = useAllPackages();

  const headerTitle = t('packages', 'Packages');

  const headers = useMemo(
    () => [
      { key: 'name', header: t('packageName', 'Package name') },
      { key: 'domains', header: t('domains', 'Domains') },
      { key: 'description', header: t('description', 'Description') },
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
      })),
    [packages, t],
  );

  if (isLoading) {
    return <DataTableSkeleton role="progressbar" columnCount={headers.length} zebra />;
  }

  if (error) {
    return <ErrorState error={error} headerTitle={headerTitle} />;
  }

  if (!packages.length) {
    return (
      <EmptyCard
        displayText={t('packages', 'packages')}
        headerTitle={headerTitle}
        launchForm={() => launchAddNewPackageWorkspace(t)}
      />
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
                    {row.cells.map((cell) => (
                      <TableCell key={cell.id}>{cell.value}</TableCell>
                    ))}
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
