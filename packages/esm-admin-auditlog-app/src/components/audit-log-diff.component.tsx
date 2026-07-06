import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  StructuredListBody,
  StructuredListCell,
  StructuredListHead,
  StructuredListRow,
  StructuredListWrapper,
} from '@carbon/react';
import type { AuditFieldDiff } from '../types';
import styles from './audit-log-diff.scss';

interface AuditLogDiffProps {
  changes: AuditFieldDiff[];
}

const AuditLogDiff: React.FC<AuditLogDiffProps> = ({ changes }) => {
  const { t } = useTranslation();

  // Keep entries where changed is absent or true; skip only explicit false.
  const visibleChanges = changes.filter((change) => change.changed !== false);

  if (visibleChanges.length === 0) {
    return (
      <p className={styles.noChanges}>
        {t('noFieldChangesRecorded', 'No field-level changes recorded for this revision.')}
      </p>
    );
  }

  return (
    <div className={styles.diffWrapper}>
      <p className={styles.diffTitle}>{t('changeDetails', 'Change details')}</p>
      <StructuredListWrapper>
        <StructuredListHead>
          <StructuredListRow head>
            <StructuredListCell head>{t('field', 'Field')}</StructuredListCell>
            <StructuredListCell head>{t('previousValue', 'Previous value')}</StructuredListCell>
            <StructuredListCell head>{t('newValue', 'New value')}</StructuredListCell>
          </StructuredListRow>
        </StructuredListHead>
        <StructuredListBody>
          {visibleChanges.map((change, idx) => (
            <StructuredListRow key={`${change.fieldName}-${idx}`}>
              <StructuredListCell>{change.fieldName}</StructuredListCell>
              <StructuredListCell>
                <span className={styles.oldValue}>{change.oldValue !== '' ? change.oldValue : '—'}</span>
              </StructuredListCell>
              <StructuredListCell>
                <span className={styles.newValue}>{change.currentValue !== '' ? change.currentValue : '—'}</span>
              </StructuredListCell>
            </StructuredListRow>
          ))}
        </StructuredListBody>
      </StructuredListWrapper>
    </div>
  );
};

export default AuditLogDiff;
