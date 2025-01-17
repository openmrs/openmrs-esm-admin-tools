import React, { useCallback, useEffect, useState } from 'react';
import { first } from 'rxjs/operators';
import styles from './edit-scheduled-report-form.scss';
import SimpleCronEditor from '../simple-cron-editor/simple-cron-editor.component';
import {
  useReportDefinition,
  useReportDesigns,
  useReportRequest,
  runReportObservable,
  RunReportRequest,
} from '../reports.resource';
import ReportParameterInput from '../report-parameter-input.component';
import { Button, ButtonSet, Form, Select, SelectItem, Stack } from '@carbon/react';
import { useTranslation } from 'react-i18next';
import { showToast, useLayoutType } from '@openmrs/esm-framework';

interface EditScheduledReportForm {
  reportDefinitionUuid: string;
  reportRequestUuid: string;
  closePanel: () => void;
}

const EditScheduledReportForm: React.FC<EditScheduledReportForm> = ({
  reportDefinitionUuid,
  reportRequestUuid,
  closePanel,
}) => {
  const { t } = useTranslation();
  const isTablet = useLayoutType() === 'tablet';

  const reportDefinition = useReportDefinition(reportDefinitionUuid);
  const { reportDesigns } = useReportDesigns(reportDefinitionUuid);
  const { reportRequest } = useReportRequest(reportRequestUuid);

  const [reportParameters, setReportParameters] = useState({});
  const [renderModeUuid, setRenderModeUuid] = useState<string>();
  const [initialCron, setInitialCron] = useState<string>();
  const [schedule, setSchedule] = useState<string>();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittable, setIsSubmittable] = useState(false);
  const [ignoreChanges, setIgnoreChanges] = useState(true);

  useEffect(() => {
    setInitialCron(reportRequest?.schedule);
    setRenderModeUuid(reportRequest?.renderingMode?.argument);
  }, [reportRequest]);

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();

      setIsSubmitting(true);

      const runReportRequest: RunReportRequest = {
        existingRequestUuid: reportRequestUuid,
        reportDefinitionUuid,
        renderModeUuid,
        reportParameters,
        schedule,
      };

      const abortController = new AbortController();
      runReportObservable(runReportRequest, abortController)
        .pipe(first())
        .subscribe(
          () => {
            showToast({
              critical: true,
              kind: 'success',
              title: t('reportScheduled', 'Report scheduled'),
              description: t('reportScheduledSuccessfullyMsg', 'Report scheduled successfully'),
            });
            closePanel();
            setIsSubmitting(false);
          },
          (error) => {
            console.error(error);
            showToast({
              critical: true,
              kind: 'error',
              title: t('reportScheduledErrorMsg', 'Failed to schedule a report'),
              description: t('reportScheduledErrorMsg', 'Failed to schedule a report'),
            });
            closePanel();
            setIsSubmitting(false);
          },
        );
    },
    [closePanel, renderModeUuid, reportRequestUuid, reportRequestUuid, reportParameters, schedule],
  );

  const handleOnChange = () => {
    setIgnoreChanges((prevState) => !prevState);
  };

  const handleCronEditorChange = (cron: string, isValid: boolean) => {
    setSchedule(isValid ? cron : null);
  };

  useEffect(() => {
    setIsSubmittable(!!schedule && !!renderModeUuid);
  }, [schedule, renderModeUuid]);

  return (
    <Form className={styles.desktopEditSchedule} onChange={handleOnChange} onSubmit={handleSubmit}>
      <Stack gap={8} className={styles.container}>
        <SimpleCronEditor initialCron={initialCron} onChange={handleCronEditorChange} />
        {reportDefinition &&
          reportDefinition.parameters.map((parameter) => (
            <ReportParameterInput
              parameter={parameter}
              value={reportRequest?.parameterMappings[parameter.name]}
              onChange={(parameterValue) => {
                setReportParameters((state) => ({
                  ...state,
                  [parameter.name]: parameterValue,
                }));
              }}
            />
          ))}
        <div className={styles.outputFormatDiv}>
          <Select
            className={styles.basicInputElement}
            labelText={t('outputFormat', 'Output format')}
            onChange={(e) => setRenderModeUuid(e.target.value)}
            value={renderModeUuid}
          >
            <SelectItem value={null} />
            {reportDesigns &&
              reportDesigns.map((reportDesign) => (
                <SelectItem key={reportDesign.uuid} text={reportDesign.name} value={reportDesign.uuid}>
                  {reportDesign.name}
                </SelectItem>
              ))}
          </Select>
        </div>
      </Stack>
      <div className={styles.buttonsDiv}>
        <ButtonSet className={isTablet ? styles.tablet : styles.desktop}>
          <Button className={styles.button} kind="secondary" onClick={closePanel}>
            {t('cancel', 'Cancel')}
          </Button>
          <Button className={styles.button} disabled={isSubmitting || !isSubmittable} kind="primary" type="submit">
            {t('save', 'Save')}
          </Button>
        </ButtonSet>
      </div>
    </Form>
  );
};

export default EditScheduledReportForm;
