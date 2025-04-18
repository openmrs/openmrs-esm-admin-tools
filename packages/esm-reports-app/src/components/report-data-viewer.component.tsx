import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DataTable,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  Pagination,
  Button,
  Modal,
  Checkbox,
  FormGroup,
} from '@carbon/react';
import { Download } from '@carbon/react/icons';
import { isDesktop, useLayoutType, formatDatetime, getCoreTranslation } from '@openmrs/esm-framework';
import styles from './reports.scss';

interface ReportDataViewerProps {
  reportData: any;
}

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_PAGE_SIZES = [10, 20, 30, 40, 50];

const ReportDataViewer: React.FC<ReportDataViewerProps> = ({ reportData }) => {
  const { t } = useTranslation();
  const layout = useLayoutType();
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [currentPage, setCurrentPage] = useState(1);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<Record<string, boolean>>({});

  // Get the first dataset since we're only handling one dataset for now
  const dataset = useMemo(() => reportData?.dataSets?.[0], [reportData?.dataSets]);
  const columns = useMemo(() => dataset?.metadata?.columns || [], [dataset?.metadata?.columns]);
  const rows = useMemo(() => dataset?.rows || [], [dataset?.rows]);

  // Initialize selected columns when columns change
  React.useEffect(() => {
    const initialSelection = columns.reduce((acc, col) => {
      acc[col.name] = true; // Select all columns by default
      return acc;
    }, {});
    setSelectedColumns(initialSelection);
  }, [columns]);

  const handleColumnToggle = (columnName: string) => {
    setSelectedColumns((prev) => ({
      ...prev,
      [columnName]: !prev[columnName],
    }));
  };

  const formatCellValue = (value: any) => {
    if (Array.isArray(value)) {
      // Handle date arrays [year, month, day, hour, minute, second]
      if (value.length >= 3 && value.length <= 6) {
        const [year, month, day, hour = 0, minute = 0, second = 0] = value;
        const date = new Date(year, month - 1, day, hour, minute, second);
        return formatDatetime(date);
      }
      return value.join(', ');
    }
    if (value instanceof Date) {
      return formatDatetime(value);
    }
    return value?.toString() ?? '';
  };

  const exportToCSV = () => {
    // Filter selected columns
    const selectedColumnNames = Object.entries(selectedColumns)
      .filter(([_, selected]) => selected)
      .map(([name]) => name);

    const selectedColumnsData = columns.filter((col) => selectedColumnNames.includes(col.name));

    // Create CSV header
    const header = selectedColumnsData.map((col) => col.label).join(',');

    // Create CSV rows
    const csvRows = rows.map((row) => {
      return selectedColumnsData
        .map((col) => {
          const value = row[col.name];
          // Handle array values and escape commas
          if (Array.isArray(value)) {
            // Handle date arrays
            if (value.length >= 3 && value.length <= 6) {
              const [year, month, day, hour = 0, minute = 0, second = 0] = value;
              const date = new Date(year, month - 1, day, hour, minute, second);
              return `"${formatDatetime(date)}"`;
            }
            return `"${value.join(' ')}"`;
          }
          // Handle strings with commas
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return value;
        })
        .join(',');
    });

    // Combine header and rows
    const csvContent = [header, ...csvRows].join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${reportData?.definition?.name || 'report'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportModal(false);
  };

  // Calculate pagination
  const totalItems = rows.length;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedRows = rows.slice(startIndex, endIndex);

  // Transform the data into a format that Carbon's DataTable can understand
  const tableRows = paginatedRows.map((row, index) => ({
    id: index.toString(),
    ...row,
  }));

  const tableHeaders = columns.map((column) => ({
    key: column.name,
    header: column.label,
  }));

  return (
    <div className={styles.reportDataViewer}>
      <div className={styles.reportDataViewerHeader}>
        <h3>
          {reportData?.definition?.name || t('reportData', { ns: '@openmrs/esm-reports-app', default: 'Report Data' })}
        </h3>
        <Button
          kind="ghost"
          size="sm"
          renderIcon={Download}
          iconDescription={t('exportCSV', { ns: '@openmrs/esm-reports-app', default: 'Export CSV' })}
          onClick={() => setShowExportModal(true)}
        >
          {t('exportCSV', { ns: '@openmrs/esm-reports-app', default: 'Export CSV' })}
        </Button>
      </div>
      <div className={styles.reportDataViewerContent}>
        <DataTable rows={tableRows} headers={tableHeaders} isSortable>
          {({ rows, headers }) => (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    {headers.map((header) => (
                      <TableHeader key={header.key}>{header.header}</TableHeader>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.length > 0 ? (
                    rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.cells.map((cell) => (
                          <TableCell key={cell.id}>{formatCellValue(cell.value)}</TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={headers.length} className={styles.emptyTableMessage}>
                        {t('noDataAvailable', { ns: '@openmrs/esm-reports-app', default: 'No data available' })}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DataTable>
        <Pagination
          backwardText={t('previousPage', { ns: '@openmrs/esm-reports-app', default: 'Previous page' })}
          forwardText={t('nextPage', { ns: '@openmrs/esm-reports-app', default: 'Next page' })}
          page={currentPage}
          pageSize={pageSize}
          pageSizes={DEFAULT_PAGE_SIZES}
          totalItems={totalItems}
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
      </div>

      <Modal
        open={showExportModal}
        modalHeading={t('selectColumns', { ns: '@openmrs/esm-reports-app', default: 'Select Columns to Export' })}
        primaryButtonText={t('export', { ns: '@openmrs/esm-reports-app', default: 'Export' })}
        secondaryButtonText={getCoreTranslation('cancel')}
        onRequestClose={() => setShowExportModal(false)}
        onRequestSubmit={exportToCSV}
      >
        <FormGroup legendText={t('availableColumns', { ns: '@openmrs/esm-reports-app', default: 'Available Columns' })}>
          {columns.map((column) => (
            <Checkbox
              key={column.name}
              id={column.name}
              labelText={column.label}
              checked={selectedColumns[column.name]}
              onChange={() => handleColumnToggle(column.name)}
            />
          ))}
        </FormGroup>
      </Modal>
    </div>
  );
};

export default ReportDataViewer;
