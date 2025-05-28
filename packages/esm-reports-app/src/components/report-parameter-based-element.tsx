import React from 'react';
import { TextInput, Select, SelectItem } from '@carbon/react';
import { OpenmrsDatePicker } from '@openmrs/esm-framework';
import styles from './report-parameter-based-element.scss';

interface ReportParameter {
  name: string;
  type: string;
  label: string;
}

interface ReportParameterProps {
  parameter: ReportParameter;
  reportUuid: string;
  reportParameters: Record<string, any>;
  locations: Array<any>;
  handleOnChange: (event: any) => void;
  handleOnDateChange: (fieldName: string, dateValue: Date) => void;
}

const ReportParameterBasedElement: React.FC<ReportParameterProps> = ({
  parameter,
  reportUuid,
  reportParameters,
  locations,
  handleOnChange,
  handleOnDateChange,
}) => {
  switch (parameter.type) {
    case 'java.util.Date':
      return (
        <div key={`${reportUuid}-${parameter.name}`}>
          <OpenmrsDatePicker
            id={parameter.name}
            labelText={parameter.label}
            onChange={(date) => handleOnDateChange(parameter.name, date)}
            value={reportParameters[parameter.name]}
          />
        </div>
      );
    case 'java.lang.String':
    case 'java.lang.Integer':
      return (
        <div key={`${reportUuid}-${parameter.name}`}>
          <TextInput
            id={parameter.name}
            name={parameter.name}
            labelText={parameter.label}
            onChange={handleOnChange}
            value={reportParameters[parameter.name] ?? ''}
          />
        </div>
      );
    case 'org.openmrs.Location':
      return (
        <div key={`${reportUuid}-${parameter.name}`}>
          <Select
            id={parameter.name}
            name={parameter.name}
            labelText={parameter.label}
            onChange={handleOnChange}
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
        <div key={`${reportUuid}-${parameter.name}`}>
          <span className={styles.unknownParameterTypeSpan}>
            {`Unknown parameter type: ${parameter.type} for parameter: ${parameter.label}`}
          </span>
        </div>
      );
  }
};

export default ReportParameterBasedElement;
