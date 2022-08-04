import { showNotification, formatDatetime, usePagination } from '@openmrs/esm-framework';
import {
  DataTableSkeleton,
  Link,
  Pagination,
  PaginationSkeleton,
  SkeletonText,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'carbon-components-react';
import React, { Fragment, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getImportDetails } from './import-overview.resource';
import styles from './import-overview.component.scss';
import { Import, ImportItem } from '../../types';

interface ImportOverviewProps {
  selectedImportObject: Import;
}

const ImportOverview: React.FC<ImportOverviewProps> = ({ selectedImportObject }) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState<Boolean>();
  const [pageSize, setPageSize] = useState(5);

  const [selectedImportItems, setSelectedImportItems] = useState<ImportItem[]>();
  const { results, currentPage, goTo } = usePagination(selectedImportItems, pageSize);

  const handleImportDetails = useCallback(async (uuid: string) => {
    const abortController = new AbortController();

    const response = await getImportDetails(uuid, abortController);

    if (response.ok) {
      setSelectedImportItems(response.data.results);
    } else {
      showNotification({
        title: 'Error',
        kind: 'error',
        critical: true,
        description: response.data,
      });
    }
    setIsLoading(false);
    return () => abortController.abort();
  }, []);

  useEffect(() => {
    setIsLoading(true);
    if (selectedImportObject.errorItemsCount > 0) {
      handleImportDetails(selectedImportObject.uuid);
    } else {
      setSelectedImportItems(null);
      setIsLoading(false);
    }
  }, [handleImportDetails, selectedImportObject]);

  if (isLoading) {
    return (
      <div>
        <SkeletonText />
        <SkeletonText />
        <SkeletonText />
        <br />
        <SkeletonText />
        <div style={{ marginLeft: '2rem' }}>
          <SkeletonText />
          <SkeletonText />
          <SkeletonText />
          <SkeletonText />
          <SkeletonText />
          <SkeletonText />
        </div>
        <br />

        <DataTableSkeleton showHeader={false} showToolbar={false} columnCount={2} />
        <PaginationSkeleton />
      </div>
    );
  }

  const headerData = [
    {
      header: 'Concept/Mapping',
      key: 'uuid',
    },
    {
      header: 'Message',
      key: 'errorMessage',
    },
  ];

  return (
    !isLoading && (
      <div>
        <span className={styles.heading01}>{t('startedOn')} </span>
        <span className="body">{formatDatetime(new Date(selectedImportObject.localDateStarted))}</span>
        <br />

        <span className={styles.heading01}>{t('completedOn')} </span>
        <span className="body">{formatDatetime(new Date(selectedImportObject.localDateStopped))}</span>
        <br />

        <span className={styles.heading01}>{t('duration')} </span>
        <span className="body">{selectedImportObject.importTime}</span>
        <br />
        <br />

        <span className={styles.heading01}>{t('result')} </span>
        <br />

        <div className={`body ${styles.indentedContent}`}>
          <span>
            {selectedImportObject.upToDateItemsCount} {t('conceptsUpToDate')}
          </span>
          <br />
          <span>
            {selectedImportObject.addedItemsCount} {t('conceptsAdded')}
          </span>
          <br />
          <span>
            {selectedImportObject.updatedItemsCount} {t('conceptsUpdated')}
          </span>
          <br />
          <span>
            {selectedImportObject.retiredItemsCount} {t('conceptsRetired')}
          </span>
          <br />
          <span>
            {selectedImportObject.errorItemsCount} {t('errorsFound')}
          </span>
          <br />
          <span>
            {selectedImportObject.ignoredErrorsCount} {t('errorsIgnored')}
          </span>
          <br />
        </div>
        <br />
        {selectedImportItems && (
          <div>
            <Table size="short" className={styles.tableBordered}>
              <TableHead>
                <TableRow className={styles.tableHeaderRow}>
                  {headerData.map((header, i) => (
                    <TableHeader key={i} isSortable={true}>
                      {header.header}
                    </TableHeader>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {results.map((row) => (
                  <Fragment>
                    <TableRow className={styles.tableDataRow}>
                      <TableCell>
                        <Link href={row.versionUrl}>
                          {row.type} {row.uuid}
                        </Link>
                      </TableCell>
                      <TableCell>{row.errorMessage}</TableCell>
                    </TableRow>
                  </Fragment>
                ))}
              </TableBody>
            </Table>
            <Pagination
              className={styles.pagination}
              size="sm"
              page={currentPage}
              pageSize={pageSize}
              pageSizes={[5, 10, 20, 50, 100]}
              totalItems={selectedImportItems.length}
              onChange={({ page, pageSize }) => {
                goTo(page);
                setPageSize(pageSize);
              }}
            />
          </div>
        )}
      </div>
    )
  );
};

export default ImportOverview;
