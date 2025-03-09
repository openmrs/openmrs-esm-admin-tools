import React, { useCallback, useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';
import { take } from 'rxjs/operators';
import { useTranslation } from 'react-i18next';
import { Button, ButtonSet, DatePicker, DatePickerInput, Form, Select, SelectItem, TextInput } from '@carbon/react';
import { showSnackbar, useLayoutType } from '@openmrs/esm-framework';
import { closeOverlay } from '../../hooks/useOverlay';
import { useLocations, useReportDefinitions, useReportDesigns, runReportObservable } from '../reports.resource';
import styles from './run-report-form.scss';
import dayjs from 'dayjs';

interface RunReportForm {
  closePanel: () => void;
}

const RunReportForm: React.FC<RunReportForm> = ({ closePanel }) => {
  const { t } = useTranslation();
  const [reportUuid, setReportUuid] = useState('');
  const [renderModeUuid, setRenderModeUuid] = useState('');
  const [currentReport, setCurrentReport] = useState(null);
  const [reportParameters, setReportParameters] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isTablet = useLayoutType() === 'tablet';

  const { reportDesigns, mutateReportDesigns } = useReportDesigns(reportUuid);

  const supportedParameterTypes = useMemo(
    () => ['java.util.Date', 'java.lang.String', 'java.lang.Integer', 'org.openmrs.Location'],
    [],
  );

  useEffect(() => {
    mutateReportDesigns();
  }, [mutateReportDesigns, reportUuid]);

  useEffect(() => {
    const paramTypes = currentReport?.parameters.map((param) => param.type);
    const isAnyNotSupportedType = !paramTypes?.every((paramType) => supportedParameterTypes.includes(paramType));
    const allParametersNotEmpty = currentReport?.parameters.every(
      (parameter) => !!reportParameters[parameter.name] && reportParameters[parameter.name] !== 'Invalid Date',
    );

    if (!isAnyNotSupportedType && allParametersNotEmpty && reportUuid !== '' && renderModeUuid !== '') {
      setIsFormValid(true);
    } else {
      setIsFormValid(false);
    }
  }, [reportParameters, reportUuid, renderModeUuid, currentReport?.parameters, supportedParameterTypes]);

  const { reportDefinitions } = useReportDefinitions();
  const { locations } = useLocations();

  function renderParameterElementBasedOnType(parameter: any) {
    switch (parameter.type) {
      case 'java.util.Date':
        return (
          <div className={styles.runReportInnerDivElement}>
            <DatePicker
              datePickerType="single"
              name={parameter.name}
              onChange={([date]) => handleOnDateChange(parameter.name, date)}
              dateFormat="d/m/Y"
              className={styles.datePicker}
            >
              <DatePickerInput id={parameter.name} name={parameter.name} labelText={parameter.label} type="date" />
            </DatePicker>
          </div>
        );
      case 'java.lang.String':
      case 'java.lang.Integer':
        return (
          <div className={styles.runReportInnerDivElement}>
            <TextInput
              id={parameter.name}
              name={parameter.name}
              labelText={parameter.label}
              className={styles.basicInputElement}
              onChange={(e) => handleOnChange(e)}
              value={reportParameters[parameter.name] ?? ''}
            />
          </div>
        );
      case 'org.openmrs.Location':
        return (
          <div className={styles.runReportInnerDivElement}>
            <Select
              id={parameter.name}
              name={parameter.name}
              labelText={parameter.label}
              className={styles.basicInputElement}
              onChange={(e) => handleOnChange(e)}
              value={reportParameters[parameter.name] ?? ''}
            >
              <SelectItem value="" />
              {locations?.map((location) => (
                <SelectItem key={location.uuid} text={location.display} value={location.uuid}>
                  {location.display}
                </SelectItem>
              ))}
            </Select>
          </div>
        );
      default:
        return (
          <div className={styles.runReportInnerDivElement}>
            <span className={styles.unknownParameterTypeSpan}>
              {`Unknown parameter type: ${parameter.type} for parameter: ${parameter.label}`}
            </span>
          </div>
        );
    }
  }

  function handleOnChange(event) {
    const key = event.target.name;
    let value = null;
    if (event.target.type === 'checkbox') {
      value = event.target.checked;
    } else {
      value = event.target.value;
    }

    setReportParameters((state) => ({ ...state, [key]: value }));
  }

  function handleOnDateChange(fieldName, dateValue) {
    const date = dayjs(dateValue).format();
    setReportParameters((state) => ({ ...state, [fieldName]: date }));
  }

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();

      setIsSubmitting(true);

      const reportRequest = {
        uuid: null,
        reportDefinition: {
          parameterizable: {
            uuid: reportUuid,
          },
          parameterMappings: reportParameters,
        },
        renderingMode: {
          argument: renderModeUuid,
        },
        schedule: null,
      };

      runReportObservable(reportRequest)
        .pipe(take(1))
        .subscribe(
          () => {
            // delayed handling because runReport returns before new reports is accessible via GET
            setTimeout(() => {
              showSnackbar({
                kind: 'success',
                title: t('reportRanSuccessfully', 'Report ran successfully'),
              });
              closePanel();
              setIsSubmitting(false);
            }, 500);
          },
          (error) => {
            console.error(error);
            showSnackbar({
              kind: 'error',
              title: t('errorRunningReport', 'Error running report'),
              subtitle: error?.message,
            });
            setIsSubmitting(false);
          },
        );
    },
    [closePanel, reportParameters, reportUuid, renderModeUuid, t],
  );

  return (
    <Form className={styles.desktopRunReport} onSubmit={handleSubmit}>
      <div className={styles.runReportInnerDivElement}>
        <Select
          id="select-report"
          className={styles.basicInputElement}
          labelText={t('selectReportLabel', 'Report')}
          onChange={(e) => {
            setReportUuid(e.target.value);
            setRenderModeUuid('');
            setCurrentReport(reportDefinitions.find((reportDefinition) => reportDefinition.uuid === e.target.value));
            setReportParameters({});
          }}
          value={reportUuid}
        >
          <SelectItem text="" value={''} />
          {reportDefinitions?.map((reportDefinition) => (
            <SelectItem key={reportDefinition.uuid} text={reportDefinition.name} value={reportDefinition.uuid}>
              {reportDefinition.name}
            </SelectItem>
          ))}
        </Select>
      </div>
      <div id="reportParametersDiv">
        {currentReport?.parameters?.map((parameter) => (
          <div key={`param-${parameter.name}`}>{renderParameterElementBasedOnType(parameter)}</div>
        ))}
      </div>
      <div className={styles.outputFormatDiv}>
        <Select
          id="output-format-select"
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
      <div className={styles.buttonsDiv}>
        <ButtonSet className={classNames({ [styles.tablet]: isTablet, [styles.desktop]: !isTablet })}>
          <Button onClick={closeOverlay} kind="secondary" size="xl" className={styles.reportButton}>
            {t('cancel', 'Cancel')}
          </Button>
          <Button
            disabled={!isFormValid || isSubmitting}
            size="xl"
            className={styles.reportButton}
            kind="primary"
            type="submit"
          >
            {t('run', 'Run')}
          </Button>
        </ButtonSet>
      </div>
    </Form>
  );
};

export default RunReportForm;
