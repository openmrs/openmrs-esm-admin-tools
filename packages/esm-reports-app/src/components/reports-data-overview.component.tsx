import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Select, SelectItem, Button } from '@carbon/react';
import { ExtensionSlot, showSnackbar, OpenmrsDatePicker, getCoreTranslation } from '@openmrs/esm-framework';
import { useReportDefinitions, useReportData } from './reports.resource';
import Overlay from './overlay.component';
import ReportDataViewer from './report-data-viewer.component';
import styles from './reports.scss';
import dayjs from 'dayjs';

const ReportsDataOverviewComponent: React.FC = () => {
  const { t } = useTranslation();
  const [selectedReport, setSelectedReport] = useState('');
  const [reportParameters, setReportParameters] = useState<Record<string, string>>({});

  const { reportDefinitions } = useReportDefinitions();
  const { reportData, error, isLoading, mutate } = useReportData(selectedReport, reportParameters);

  const selectedReportDefinition = useMemo(() => {
    return reportDefinitions?.find((report) => report.uuid === selectedReport);
  }, [selectedReport, reportDefinitions]);

  const handleParameterChange = (parameterName: string, value: Date) => {
    const formattedDate = value ? dayjs(value).format('YYYY-MM-DDTHH:mm:ss.SSSZ') : '';
    setReportParameters((prev) => ({
      ...prev,
      [parameterName]: formattedDate,
    }));
  };

  const handleReportChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newReportUuid = event.target.value;
    if (newReportUuid !== selectedReport) {
      // Clear all parameters first
      setReportParameters({});
      // Then set the new report UUID
      setSelectedReport(newReportUuid);
    }
  };

  const handleFetchReport = () => {
    if (!selectedReport) {
      showSnackbar({
        kind: 'error',
        title: getCoreTranslation('error'),
        subtitle: t('selectReportFirst', { ns: '@openmrs/esm-reports-app', default: 'Please select a report first' }),
      });
      return;
    }

    // Check if the report has parameters in its definition
    const hasParameters = selectedReportDefinition?.parameters?.length > 0;

    if (hasParameters) {
      // Check if all parameters have values
      const missingParameters = selectedReportDefinition?.parameters
        ?.filter((param) => !reportParameters[param.name])
        .map((param) => param.label);

      if (missingParameters?.length > 0) {
        showSnackbar({
          kind: 'error',
          title: getCoreTranslation('error'),
          subtitle: t('missingParameters', {
            ns: '@openmrs/esm-reports-app',
            default: 'Please provide the following parameters: {parameters}',
            parameters: missingParameters.join(', '),
          }),
        });
        return;
      }
    }

    // Only fetch when explicitly requested and parameters are valid
    mutate();
  };

  // Remove the automatic fetch effect
  useEffect(() => {
    if (error) {
      showSnackbar({
        kind: 'error',
        title: getCoreTranslation('error'),
        subtitle:
          error?.message ||
          t('errorFetchingReport', { ns: '@openmrs/esm-reports-app', default: 'Error fetching report' }),
      });
    }
  }, [error, t]);

  useEffect(() => {
    if (reportData) {
      showSnackbar({
        kind: 'success',
        title: t('reportFetched', { ns: '@openmrs/esm-reports-app', default: 'Report fetched successfully' }),
      });
    }
  }, [reportData, t]);

  return (
    <div>
      <ExtensionSlot name="breadcrumbs-slot" className={styles.breadcrumb} />
      <div className={styles.mainPanelDiv}>
        <div className={styles.reportsLabelDiv}>
          <h3>{t('reports', { ns: '@openmrs/esm-reports-app', default: 'Reports' })}</h3>
        </div>
        <div className={styles.filterForm}>
          <div className={styles.formField}>
            <Select
              id="report-select"
              labelText={t('selectReport', { ns: '@openmrs/esm-reports-app', default: 'Select Report' })}
              value={selectedReport}
              onChange={handleReportChange}
            >
              <SelectItem
                text={t('selectReport', { ns: '@openmrs/esm-reports-app', default: 'Select Report' })}
                value=""
              />
              {reportDefinitions?.map((report) => (
                <SelectItem key={report.uuid} text={report.name} value={report.uuid} />
              ))}
            </Select>
          </div>
          {selectedReportDefinition?.parameters?.map((parameter) => (
            <div key={parameter.name + selectedReportDefinition.uuid} className={styles.formField}>
              <OpenmrsDatePicker
                id={parameter.name}
                labelText={parameter.label}
                onChange={(date) => handleParameterChange(parameter.name, date)}
                value={reportParameters[parameter.name]}
              />
            </div>
          ))}
          <div className={styles.formField}>
            <Button onClick={handleFetchReport} disabled={isLoading}>
              {isLoading
                ? getCoreTranslation('loading')
                : t('fetchReport', { ns: '@openmrs/esm-reports-app', default: 'Fetch Report' })}
            </Button>
          </div>
        </div>
        {reportData && (
          <div className={styles.reportDataViewerContainer}>
            <ReportDataViewer reportData={reportData} />
          </div>
        )}
      </div>
      <Overlay />
    </div>
  );
};

export default ReportsDataOverviewComponent;
