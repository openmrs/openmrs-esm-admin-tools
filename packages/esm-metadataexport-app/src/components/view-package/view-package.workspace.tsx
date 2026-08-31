import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download } from '@carbon/react/icons';
import { Button, InlineLoading, Link, Tag, Modal, TextArea } from '@carbon/react';
import { useSWRConfig } from 'swr';
import {
  type DefaultWorkspaceProps,
  ErrorState,
  restBaseUrl,
  showSnackbar,
  formatDurationBetween,
} from '@openmrs/esm-framework';
import { formatDomainLabel } from '../../domain-lookups/domain-lookups.resource';
import { deleteBuild, triggerBuild, usePackageBuilds } from '../../packages/packages.resource';
import { type ExportBuildStatus, type ExportPackage } from '../../types';
import styles from './view-package.workspace.scss';

const packagesUrl = `${restBaseUrl}/metadataexport/packages`;
const isPackagesCacheKey = (key: unknown) => typeof key === 'string' && key.startsWith(packagesUrl);

interface ViewPackageWorkspaceProps extends DefaultWorkspaceProps {
  exportPackage: ExportPackage;
}

const statusTagType: Record<ExportBuildStatus, 'gray' | 'blue' | 'green' | 'red'> = {
  QUEUED: 'gray',
  RUNNING: 'blue',
  COMPLETED: 'green',
  FAILED: 'red',
};

const ViewPackageWorkspace: React.FC<ViewPackageWorkspaceProps> = ({ exportPackage, closeWorkspace }) => {
  const { t } = useTranslation();
  const { mutate } = useSWRConfig();
  const { builds, isLoading, error, mutate: mutateBuilds } = usePackageBuilds(exportPackage.uuid);
  const [isTriggeringBuild, setIsTriggeringBuild] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');

  const handleTriggerBuild = useCallback(async () => {
    setIsTriggeringBuild(true);
    try {
      await triggerBuild(exportPackage.uuid);
      // Revalidate the builds list so the new build appears without a refresh.
      await mutateBuilds();
      showSnackbar({
        title: t('buildTriggered', 'Build triggered'),
        subtitle: t('buildTriggeredSubtitle', 'A new build was started for {{name}}', { name: exportPackage.name }),
        kind: 'success',
        isLowContrast: true,
      });
    } catch (triggerError) {
      showSnackbar({
        title: t('buildTriggerFailed', 'Failed to trigger build'),
        subtitle: triggerError?.message ?? t('unexpectedError', 'An unexpected error occurred'),
        kind: 'error',
      });
    } finally {
      setIsTriggeringBuild(false);
    }
  }, [exportPackage.uuid, exportPackage.name, mutateBuilds, t]);

  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      await deleteBuild(exportPackage.uuid, deleteReason);
      // Revalidate the packages list so the deleted package drops out of the table.
      await mutate(isPackagesCacheKey);
      showSnackbar({
        title: t('packageDeleted', 'Package deleted'),
        subtitle: t('packageDeletedSubtitle', '{{name}} was deleted', { name: exportPackage.name }),
        kind: 'success',
        isLowContrast: true,
      });
      setIsDeleteModalOpen(false);
      closeWorkspace();
    } catch (deleteError) {
      showSnackbar({
        title: t('packageDeleteFailed', 'Failed to delete package'),
        subtitle: deleteError?.message ?? t('unexpectedError', 'An unexpected error occurred'),
        kind: 'error',
      });
    } finally {
      setIsDeleting(false);
    }
  }, [exportPackage.uuid, exportPackage.name, deleteReason, mutate, closeWorkspace, t]);

  const domainsLabel = useMemo(() => {
    // An empty entries list means the package includes every registered domain.
    const includesEveryDomain = exportPackage.entries.length === 0;
    if (includesEveryDomain) {
      return t('allDomains', 'All domains');
    }

    return exportPackage.entries.map((entry) => formatDomainLabel(entry.domain)).join(', ');
  }, [exportPackage.entries, t]);

  return (
    <div className={styles.container}>
      <div className={styles.body}>
        <section className={styles.actionRow}>
          <Button
            className={styles.triggerButton}
            kind="primary"
            onClick={handleTriggerBuild}
            disabled={isTriggeringBuild || isDeleting}
          >
            {isTriggeringBuild ? (
              <InlineLoading description={t('triggeringBuild', 'Triggering build') + '…'} />
            ) : (
              t('triggerNewBuild', 'Trigger new build')
            )}
          </Button>
          <Button
            kind="danger--tertiary"
            onClick={() => setIsDeleteModalOpen(true)}
            disabled={isDeleting || isTriggeringBuild}
          >
            {isDeleting ? <InlineLoading description={t('deleting', 'Deleting') + '…'} /> : t('delete', 'Delete')}
          </Button>
        </section>
        <section className={styles.section}>
          <span className={styles.sectionLabel}>{t('details', 'Details')}</span>
          <dl className={styles.detailList}>
            <dt className={styles.detailKey}>{t('domains', 'Domains')}</dt>
            <dd className={styles.detailValue}>{domainsLabel}</dd>
          </dl>
        </section>

        <section className={styles.section}>
          <span className={styles.sectionLabel}>{t('builds', 'Builds')}</span>
          {isLoading ? (
            <InlineLoading description={t('loadingBuilds', 'Loading builds…')} />
          ) : error ? (
            <ErrorState error={error} headerTitle={t('builds', 'Builds')} />
          ) : builds.length === 0 ? (
            <p className={styles.emptyBuilds}>{t('noBuildsYet', 'No builds yet')}</p>
          ) : (
            <ul className={styles.buildList}>
              {builds.map((build) => (
                <li key={build.uuid} className={styles.buildItem}>
                  <div className={styles.buildRow}>
                    <span className={styles.buildVersion}>
                      {t('buildVersion', 'Build {{version}}', { version: build.version })}
                    </span>
                    <Tag type={statusTagType[build.status]} size="sm">
                      {build.status}
                    </Tag>
                  </div>
                  <div className={styles.buildRow}>
                    <span className={styles.buildMeta}>
                      {build.dateStarted
                        ? t('startedAgo', 'Started {{time}} ago', { time: formatDurationBetween(build.dateStarted) })
                        : t('notStarted', 'Not started')}
                    </span>
                    {build.dateCompleted && (
                      <span className={styles.buildMeta}>
                        {t('completedAgo', 'Completed {{time}} ago', {
                          time: formatDurationBetween(build.dateCompleted),
                        })}
                      </span>
                    )}
                  </div>
                  {build.downloadUrl && (
                    <Link href={build.downloadUrl} renderIcon={() => <Download size={16} />}>
                      {t('download', 'Download')}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      <Modal
        open={isDeleteModalOpen}
        danger
        modalHeading={t('deletePackage', 'Delete package')}
        primaryButtonText={isDeleting ? t('deleting', 'Deleting') + '…' : t('delete', 'Delete')}
        secondaryButtonText={t('cancel', 'Cancel')}
        primaryButtonDisabled={isDeleting}
        onRequestClose={() => {
          if (!isDeleting) {
            setIsDeleteModalOpen(false);
          }
        }}
        onRequestSubmit={handleDelete}
      >
        <p className={styles.modalBody}>
          {t('deletePackageConfirmation', 'Are you sure you want to delete {{name}}? Please provide a reason.', {
            name: exportPackage.name,
          })}
        </p>
        <TextArea
          labelText={t('reason', 'Reason')}
          placeholder={t('reasonPlaceholder', 'Enter a reason for deleting this package')}
          value={deleteReason}
          onChange={(event) => setDeleteReason(event.target.value)}
          rows={3}
        />
      </Modal>
    </div>
  );
};

export default ViewPackageWorkspace;
