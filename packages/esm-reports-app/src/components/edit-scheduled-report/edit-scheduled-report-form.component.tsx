import React, { useCallback, useEffect, useState } from 'react';
import { take } from 'rxjs/operators';
import styles from './edit-scheduled-report-form.scss';
import SimpleCronEditor from '../simple-cron-editor/simple-cron-editor.component';
import { useReportDefinition, useReportDesigns, useReportRequest, runReportObservable } from '../reports.resource';
import ReportParameterInput from '../report-parameter-input.component';
import { Button, ButtonSet, Form, Select, SelectItem, Stack } from '@carbon/react';
import { useTranslation } from 'react-i18next';
import { showSnackbar, useLayoutType } from '@openmrs/esm-framework';
import classNames from 'classnames';

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
  const [renderModeUuid, setRenderModeUuid] = useState();
  const [initialCron, setInitialCron] = useState();
  const [schedule, setSchedule] = useState('');

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

      const scheduleRequest = {
        uuid: reportRequestUuid ? reportRequestUuid : null,
        reportDefinition: {
          parameterizable: {
            uuid: reportDefinitionUuid,
          },
          parameterMappings: reportParameters,
        },
        renderingMode: {
          argument: renderModeUuid,
        },
        schedule,
      };

      runReportObservable(scheduleRequest)
        .pipe(take(1))
        .subscribe(
          () => {
            showSnackbar({
              kind: 'success',
              title: t('reportScheduled', 'Report scheduled'),
              subtitle: t('reportScheduledSuccessfullyMsg', 'Report scheduled successfully'),
            });
            closePanel();
            setIsSubmitting(false);
          },
          () => {
            showSnackbar({
              kind: 'error',
              title: t('reportScheduledErrorMsg', 'Failed to schedule a report'),
              subtitle: t('reportScheduledErrorMsg', 'Failed to schedule a report'),
            });
            closePanel();
            setIsSubmitting(false);
          },
        );
    },
    [closePanel, renderModeUuid, reportRequestUuid, reportParameters, schedule],
  );

  const handleOnChange = () => {
    setIgnoreChanges((prevState) => !prevState);
  };

  const handleCronEditorChange = (cron: string, isValid: boolean) => {
    setSchedule(isValid ? cron : '');
  };

  useEffect(() => {
    setIsSubmittable(!!schedule && !!renderModeUuid);
  }, [schedule, renderModeUuid]);

  return (
    <Form className={styles.desktopEditSchedule} onChange={handleOnChange} onSubmit={handleSubmit}>
      <Stack gap={8} className={styles.container}>
        <SimpleCronEditor initialCron={initialCron} onChange={handleCronEditorChange} />
        {reportDefinition?.parameters.map((parameter) => (
          <ReportParameterInput
            key={`${reportDefinition.name}-${parameter.name}-param-input`}
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
            <SelectItem text="" value={''} />
            {reportDesigns?.map((reportDesign) => (
              <SelectItem key={reportDesign.uuid} text={reportDesign.name} value={reportDesign.uuid}>
                {reportDesign.name}
              </SelectItem>
            ))}
          </Select>
        </div>
      </Stack>
      <div className={styles.buttonsDiv}>
        <ButtonSet className={classNames({ [styles.tablet]: isTablet, [styles.desktop]: !isTablet })}>
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
