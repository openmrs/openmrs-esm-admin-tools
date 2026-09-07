import React, { useState } from 'react';
import { Button, Checkbox, FormGroup, ModalBody, ModalFooter, ModalHeader } from '@carbon/react';
import { getCoreTranslation } from '@openmrs/esm-framework';
import { useTranslation } from 'react-i18next';

interface ReportExportColumnsModalProps {
  close: () => void;
  columns: Array<{ name: string; label: string }>;
  selectedColumns: Record<string, boolean>;
  onSelectionChange: (selection: Record<string, boolean>) => void;
  onExport: (selection: Record<string, boolean>) => void;
}

const ReportExportColumnsModal: React.FC<ReportExportColumnsModalProps> = ({
  close,
  columns,
  selectedColumns,
  onSelectionChange,
  onExport,
}) => {
  const { t } = useTranslation();
  const [selection, setSelection] = useState(selectedColumns);
  return (
    <>
      <ModalHeader closeModal={close} title={t('selectColumns', 'Select Columns to Export')} />
      <ModalBody>
        <FormGroup legendText={t('availableColumns', 'Available Columns')}>
          {columns.map((column) => (
            <Checkbox
              key={column.name}
              id={column.name}
              labelText={column.label}
              checked={selection[column.name]}
              onChange={() => {
                const next = { ...selection, [column.name]: !selection[column.name] };
                setSelection(next);
                onSelectionChange(next);
              }}
            />
          ))}
        </FormGroup>
      </ModalBody>
      <ModalFooter>
        <Button kind="secondary" onClick={close}>
          {getCoreTranslation('cancel')}
        </Button>
        <Button
          onClick={() => {
            onExport(selection);
            close();
          }}
        >
          {t('export', 'Export')}
        </Button>
      </ModalFooter>
    </>
  );
};
export default ReportExportColumnsModal;
