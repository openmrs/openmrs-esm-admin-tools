import { formatDatetime } from '@openmrs/esm-framework';
import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './import-overview.component.scss';
import { Import } from '../../types';
import ImportItems from './import-items.component';

interface ImportOverviewProps {
  selectedImportObject: Import;
}

const ImportOverview: React.FC<ImportOverviewProps> = ({ selectedImportObject }) => {
  const { t } = useTranslation();

  return (
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
      {selectedImportObject.errorItemsCount != 0 && <ImportItems importUuid={selectedImportObject.uuid} />}
    </div>
  );
};

export default ImportOverview;
