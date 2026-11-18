import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  DataTableSkeleton,
  InlineNotification,
  Modal,
  StructuredListBody,
  StructuredListCell,
  StructuredListHead,
  StructuredListRow,
  StructuredListWrapper,
  Tag,
  Tile,
} from '@carbon/react';
import { formatDatetime, parseDate } from '@openmrs/esm-framework';
import { useAuditLogDetail } from './audit-log.resource';
import type { AuditAction } from './audit-log.types';
import styles from './audit-log-detail-modal.scss';

const actionTagColors: Record<AuditAction, 'green' | 'blue' | 'red'> = {
  CREATED: 'green',
  UPDATED: 'blue',
  DELETED: 'red',
};

interface AuditLogDetailModalProps {
  uuid: string;
  onClose: () => void;
}

const AuditLogDetailModal: React.FC<AuditLogDetailModalProps> = ({ uuid, onClose }) => {
  const { t } = useTranslation();
  const { detail, isLoading, error } = useAuditLogDetail(uuid);

  return (
    <Modal open size="lg" passiveModal modalHeading={t('auditLogDetail', 'Audit Log Detail')} onRequestClose={onClose}>
      {isLoading && <DataTableSkeleton columnCount={3} rowCount={4} />}

      {error && (
        <InlineNotification
          kind="error"
          title={t('errorLoadingDetail', 'Error loading detail')}
          subtitle={error.message}
        />
      )}

      {detail && (
        <div className={styles.detailContainer}>
          <section className={styles.metaSection}>
            <StructuredListWrapper>
              <StructuredListBody>
                <StructuredListRow>
                  <StructuredListCell head>{t('dateTime', 'Date & Time')}</StructuredListCell>
                  <StructuredListCell>
                    {formatDatetime(parseDate(detail.dateCreated), { mode: 'standard' })}
                  </StructuredListCell>
                </StructuredListRow>
                <StructuredListRow>
                  <StructuredListCell head>{t('user', 'User')}</StructuredListCell>
                  <StructuredListCell>{detail.userDisplay || '—'}</StructuredListCell>
                </StructuredListRow>
                <StructuredListRow>
                  <StructuredListCell head>{t('action', 'Action')}</StructuredListCell>
                  <StructuredListCell>
                    {detail.action && (
                      <Tag type={actionTagColors[detail.action as AuditAction]} size="sm">
                        {detail.action}
                      </Tag>
                    )}
                  </StructuredListCell>
                </StructuredListRow>
                <StructuredListRow>
                  <StructuredListCell head>{t('objectType', 'Object type')}</StructuredListCell>
                  <StructuredListCell>{detail.simpleType}</StructuredListCell>
                </StructuredListRow>
                <StructuredListRow>
                  <StructuredListCell head>{t('objectId', 'Object ID')}</StructuredListCell>
                  <StructuredListCell>{detail.identifier}</StructuredListCell>
                </StructuredListRow>
              </StructuredListBody>
            </StructuredListWrapper>
          </section>

          {detail.changes && detail.changes.length > 0 && (
            <section className={styles.changesSection}>
              <h5 className={styles.sectionTitle}>{t('fieldChanges', 'Field changes')}</h5>
              <StructuredListWrapper>
                <StructuredListHead>
                  <StructuredListRow head>
                    <StructuredListCell head>{t('field', 'Field')}</StructuredListCell>
                    <StructuredListCell head>{t('oldValue', 'Old value')}</StructuredListCell>
                    <StructuredListCell head>{t('newValue', 'New value')}</StructuredListCell>
                  </StructuredListRow>
                </StructuredListHead>
                <StructuredListBody>
                  {detail.changes.map((change) => (
                    <StructuredListRow key={change.field}>
                      <StructuredListCell>{change.field}</StructuredListCell>
                      <StructuredListCell className={styles.oldValue}>{change.oldValue ?? '—'}</StructuredListCell>
                      <StructuredListCell className={styles.newValue}>{change.newValue ?? '—'}</StructuredListCell>
                    </StructuredListRow>
                  ))}
                </StructuredListBody>
              </StructuredListWrapper>
            </section>
          )}

          {detail.childLogs && detail.childLogs.length > 0 && (
            <section className={styles.childLogsSection}>
              <h5 className={styles.sectionTitle}>{t('childLogs', 'Child logs')}</h5>
              <StructuredListWrapper>
                <StructuredListHead>
                  <StructuredListRow head>
                    <StructuredListCell head>{t('objectType', 'Object type')}</StructuredListCell>
                    <StructuredListCell head>{t('objectId', 'Object ID')}</StructuredListCell>
                    <StructuredListCell head>{t('action', 'Action')}</StructuredListCell>
                  </StructuredListRow>
                </StructuredListHead>
                <StructuredListBody>
                  {detail.childLogs.map((child) => (
                    <StructuredListRow key={child.uuid}>
                      <StructuredListCell>{child.simpleType}</StructuredListCell>
                      <StructuredListCell>{child.identifier}</StructuredListCell>
                      <StructuredListCell>
                        {child.action && (
                          <Tag type={actionTagColors[child.action as AuditAction]} size="sm">
                            {child.action}
                          </Tag>
                        )}
                      </StructuredListCell>
                    </StructuredListRow>
                  ))}
                </StructuredListBody>
              </StructuredListWrapper>
            </section>
          )}

          {(!detail.changes || detail.changes.length === 0) &&
            (!detail.childLogs || detail.childLogs.length === 0) &&
            detail.action !== 'CREATED' && (
              <Tile className={styles.emptyChanges}>
                <p>{t('noChangesRecorded', 'No field changes recorded for this entry.')}</p>
              </Tile>
            )}
        </div>
      )}
    </Modal>
  );
};

export default AuditLogDetailModal;
