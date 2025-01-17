import React, { useEffect, useState } from 'react';
import styles from './run-report/run-report-form.scss';
import { DatePicker, DatePickerInput, Select, SelectItem, TextInput } from '@carbon/react';
import { useLocations } from './reports.resource';
import { isEqual } from 'lodash-es';

interface ReportParameterInputProps {
  parameter: any;
  value: any;
  onChange: (value) => void;
}

function getInitialValue(parameter: any, value: any) {
  if (parameter.type === 'java.util.Date') {
    return new Date(value);
  } else if (parameter.type === 'org.openmrs.Location') {
    return value?.uuid;
  } else {
    return value;
  }
}

const ReportParameterInput: React.FC<ReportParameterInputProps> = ({ parameter, value, onChange }) => {
  const { locations } = useLocations();
  const [valueInternal, setValueInternal] = useState<string | number | Date>(getInitialValue(parameter, value));

  useEffect(() => {
    const newInternalValue = getInitialValue(parameter, value);
    if (!isValueEqual(newInternalValue, valueInternal)) {
      setValueInternal(newInternalValue);
    }
  }, [value]);

  const isValueEqual = (valueA, valueB) => {
    if (parameter.type === 'java.util.Date') {
      return isEqual(new Date(valueA), new Date(valueB));
    } else {
      return isEqual(valueA, valueB);
    }
  };

  useEffect(() => {
    if (parameter.type === 'java.util.Date') {
      onChange(new Date(valueInternal).toLocaleDateString());
    } else {
      onChange(valueInternal);
    }
  }, [valueInternal]);

  const renderParameterElementBasedOnType = () => {
    switch (parameter.type) {
      case 'java.util.Date':
        return (
          <DatePicker
            datePickerType="single"
            name={parameter.name}
            onChange={([dateValue]) => handleOnDateChange(dateValue)}
            className={styles.datePicker}
            value={valueInternal}
          >
            <DatePickerInput id={parameter.name} name={parameter.name} labelText={parameter.label} type="date" />
          </DatePicker>
        );
      case 'java.lang.String':
      case 'java.lang.Integer':
        return (
          <TextInput
            id={parameter.name}
            name={parameter.name}
            labelText={parameter.label}
            className={styles.basicInputElement}
            onChange={(e) => handleOnChange(e)}
            value={valueInternal}
          />
        );
      case 'org.openmrs.Location':
        return (
          <Select
            id={parameter.name}
            name={parameter.name}
            labelText={parameter.label}
            className={styles.basicInputElement}
            onChange={(e) => handleOnChange(e)}
            value={valueInternal}
          >
            <SelectItem value={null} />
            {locations?.length > 0 &&
              locations.map((location) => (
                <SelectItem key={location.uuid} text={location.display} value={location.uuid}>
                  {location.display}
                </SelectItem>
              ))}
          </Select>
        );
      default:
        return (
          <span className={styles.unknownParameterTypeSpan}>
            {`Unknown parameter type: ${parameter.type} for parameter: ${parameter.label}`}
          </span>
        );
    }
  };

  function handleOnChange(event) {
    let eventValue = null;
    if (event.target.type == 'checkbox') {
      eventValue = event.target.checked;
    } else {
      eventValue = event.target.value;
    }

    setValueInternal(eventValue);
  }

  function handleOnDateChange(dateValue) {
    setValueInternal(new Date(dateValue));
  }

  return <div className={styles.runReportInnerDivElement}>{renderParameterElementBasedOnType()}</div>;
};

export default ReportParameterInput;
