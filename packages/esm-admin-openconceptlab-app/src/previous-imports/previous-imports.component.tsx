import { formatDatetime, showNotification, usePagination } from '@openmrs/esm-framework';
import {
  Column,
  DataTable,
  DataTableSkeleton,
  Pagination,
  PaginationSkeleton,
  Row,
  SkeletonText,
  Table,
  TableBody,
  TableCell,
  TableExpandedRow,
  TableExpandHeader,
  TableExpandRow,
  TableHead,
  TableHeader,
  TableRow,
} from 'carbon-components-react';
import React, { Fragment, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePreviousImports } from './previous-imports.resource';
import styles from './previous-imports.component.scss';
import { Import } from '../types';
import ImportOverview from './import-overview/import-overview.component';

const PreviousImports: React.FC = () => {
  const { t } = useTranslation();
  const [pageSize, setPageSize] = useState(10);

  const { data: prevImports, isLoading, isError } = usePreviousImports();
  const { results, currentPage, goTo } = usePagination(prevImports, pageSize);

  if (isLoading) {
    return (
      <Row className={styles.tabContentContainer}>
        <Column sm={12} lg={8}>
          <SkeletonText className={styles.productiveHeading03} />
          <DataTableSkeleton showHeader={false} showToolbar={false} rowCount={10} columnCount={3} />
          <PaginationSkeleton />
        </Column>
      </Row>
    );
  }

  if (isError) {
    showNotification({
      kind: 'error',
      description: t('previousImportsFetchError'),
    });
  }

  const headerData = [
    {
      header: t('dateAndTime'),
      key: 'localDateStarted',
    },
    {
      header: t('duration'),
      key: 'importTime',
    },
    {
      header: t('status'),
      key: 'status',
    },
  ];

  const rowData = results?.map((prevImport) => {
    return {
      id: prevImport.uuid,
      localDateStarted: formatDatetime(new Date(prevImport.localDateStarted)),
      importTime: prevImport.importTime,
      status: prevImport.status,
    };
  });

  return (
    !isLoading &&
    !isError && (
      <Row className={styles.tabContentContainer}>
        <Column sm={12} lg={8}>
          <h3 className={styles.productiveHeading03}>{t('previousImports')}</h3>

          <DataTable rows={rowData} headers={headerData} size="short">
            {({ rows, headers, getHeaderProps, getRowProps, getTableProps }) => (
              <Table {...getTableProps()} className={styles.tableBordered}>
                <TableHead>
                  <TableRow>
                    <TableExpandHeader />
                    {headers.map((header, i) => (
                      <TableHeader key={i} {...getHeaderProps({ header })}>
                        {header.header}
                      </TableHeader>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <Fragment key={row.id}>
                      <TableExpandRow {...getRowProps({ row })} className={styles.tableRow}>
                        {row.cells.map((cell) => (
                          <TableCell key={cell.id}>{cell.value}</TableCell>
                        ))}
                      </TableExpandRow>
                      {row.isExpanded && (
                        <TableExpandedRow colSpan={headers.length + 1} className={styles.tableExpandedRow}>
                          <ImportOverview
                            selectedImportObject={prevImports.find((importItem: Import) => importItem.uuid === row.id)}
                          />
                        </TableExpandedRow>
                      )}
                    </Fragment>
                  ))}
                </TableBody>
              </Table>
            )}
          </DataTable>
          <Pagination
            className={styles.pagination}
            size="sm"
            page={currentPage}
            pageSize={pageSize}
            pageSizes={[10, 20, 50, 100]}
            totalItems={prevImports.length}
            onChange={({ page, pageSize }) => {
              goTo(page);
              setPageSize(pageSize);
            }}
          />
        </Column>
      </Row>
    )
  );
};

export default PreviousImports;
