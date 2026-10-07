import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download } from '@carbon/react/icons';
import { Button, InlineLoading, Link, Tag } from '@carbon/react';
import { useSWRConfig } from 'swr';
import {
  ErrorState,
  OpenmrsFetchError,
  formatDurationBetween,
  makeUrl,
  restBaseUrl,
  showModal,
  showSnackbar,
  useSession,
  userHasAccess,
  Workspace2,
  type Workspace2DefinitionProps,
} from '@openmrs/esm-framework';
import { formatDomainLabel } from '../../domain-lookups/domain-lookups.resource';
import { isPackagesCacheKey, triggerBuild, usePackageBuilds } from '../../packages/packages.resource';
import type { ExportBuildStatus, ExportPackage } from '../../types';
import styles from './view-metadata-package.workspace.scss';
import { launchPackageFormWorkspace } from '../metadata-package-form/metadata-package-form-utils';

interface ViewPackageWorkspaceProps {
  exportPackage: ExportPackage;
}

const statusTagType: Record<ExportBuildStatus, 'gray' | 'blue' | 'green' | 'red'> = {
  QUEUED: 'gray',
  RUNNING: 'blue',
  COMPLETED: 'green',
  FAILED: 'red',
};

const ViewMetadataPackageWorkspace: React.FC<Workspace2DefinitionProps<ViewPackageWorkspaceProps>> = ({
  workspaceProps,
  closeWorkspace,
}) => {
  const { exportPackage } = workspaceProps;
  const { t } = useTranslation();
  const session = useSession();
  const { mutate: globalMutate } = useSWRConfig();
  const { builds, isLoading, error, mutate: mutateBuilds } = usePackageBuilds(exportPackage.uuid);

  const canManage = session.user ? userHasAccess('Manage Metadata Export Packages', session.user) : false;
  // The build download endpoint requires the Download privilege, independently of Manage.
  const canDownload = session.user ? userHasAccess('Download Metadata Export Packages', session.user) : false;
  const [isTriggeringBuild, setIsTriggeringBuild] = useState(false);

  const handleTriggerBuild = useCallback(async () => {
    setIsTriggeringBuild(true);
    try {
      await triggerBuild(exportPackage.uuid);
      // Revalidate the builds list so the new build appears without a refresh, and the
      // packages list so the table's Status column reflects the newly queued build.
      await Promise.all([mutateBuilds(), globalMutate(isPackagesCacheKey)]);
      showSnackbar({
        title: t('buildTriggered', 'Build triggered'),
        subtitle: t('buildTriggeredSubtitle', 'A new build was started for {{name}}', { name: exportPackage.name }),
        kind: 'success',
        isLowContrast: true,
      });
    } catch (triggerError) {
      const responseBody = triggerError instanceof OpenmrsFetchError ? triggerError.responseBody : null;
      const reason = typeof responseBody === 'object' && responseBody !== null ? responseBody.error : null;
      showSnackbar({
        title: t('buildTriggerFailed', 'Failed to trigger build'),
        subtitle: reason ?? t('unexpectedError', 'An unexpected error occurred'),
        kind: 'error',
      });
    } finally {
      setIsTriggeringBuild(false);
    }
  }, [exportPackage.uuid, exportPackage.name, mutateBuilds, globalMutate, t]);

  // revalidation: usePackageBuilds refreshes while a build is active, so when the
  // set of build statuses changes (e.g. a build finishes) refresh the packages list too, keeping
  const buildStatusVersion = builds.map((build) => `${build.uuid}:${build.status}`).join('|');
  const previousBuildStatusVersion = useRef<string | null>(null);
  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (previousBuildStatusVersion.current !== null && previousBuildStatusVersion.current !== buildStatusVersion) {
      globalMutate(isPackagesCacheKey);
    }
    previousBuildStatusVersion.current = buildStatusVersion;
  }, [buildStatusVersion, isLoading, globalMutate]);

  const launchDeleteModal = useCallback(() => {
    const dispose = showModal('delete-metadata-package-modal', {
      closeModal: () => dispose(),
      exportPackage,
      onDeleted: closeWorkspace,
    });
  }, [exportPackage, closeWorkspace]);

  const domainsLabel = useMemo(() => {
    // An empty entries list means the package includes every registered domain.
    const includesEveryDomain = exportPackage.entries.length === 0;
    if (includesEveryDomain) {
      return t('allDomains', 'All domains');
    }

    return exportPackage.entries.map((entry) => formatDomainLabel(entry.domain)).join(', ');
  }, [exportPackage.entries, t]);

  // Replace this workspace with the edit form so it doesn't reappear with stale package details
  const editPackage = useCallback(async () => {
    if (await closeWorkspace()) {
      launchPackageFormWorkspace(exportPackage.uuid);
    }
  }, [closeWorkspace, exportPackage.uuid]);

  return (
    <Workspace2 title={exportPackage.name}>
      <div className={styles.container}>
        <div className={styles.body}>
          {canManage && (
            <section className={styles.actionRow}>
              <Button
                className={styles.triggerButton}
                kind="primary"
                onClick={handleTriggerBuild}
                disabled={isTriggeringBuild}
              >
                {isTriggeringBuild ? (
                  <InlineLoading description={t('triggeringBuild', 'Triggering build') + '…'} />
                ) : (
                  t('triggerNewBuild', 'Trigger new build')
                )}
              </Button>
              <div className={styles.secondaryActions}>
                <Button
                  className={styles.secondaryButton}
                  kind="secondary"
                  onClick={editPackage}
                  disabled={isTriggeringBuild}
                >
                  {t('edit', 'Edit')}
                </Button>
                <Button
                  className={styles.secondaryButton}
                  kind="danger--tertiary"
                  onClick={launchDeleteModal}
                  disabled={isTriggeringBuild}
                >
                  {t('delete', 'Delete')}
                </Button>
              </div>
            </section>
          )}

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
                        {t(build.status)}
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
                    {build.status === 'FAILED' && build.errorMessage && (
                      <p className={styles.buildError}>{build.errorMessage}</p>
                    )}
                    {canDownload && build.downloadUrl && (
                      <Link
                        href={makeUrl(`${restBaseUrl}/metadataexport/builds/${build.uuid}/download`)}
                        renderIcon={() => <Download size={16} />}
                      >
                        {t('download', 'Download')}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </Workspace2>
  );
};

export default ViewMetadataPackageWorkspace;
