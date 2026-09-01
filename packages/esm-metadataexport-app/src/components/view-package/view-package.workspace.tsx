import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { InlineLoading, Link, Tag } from '@carbon/react';
import { Download } from '@carbon/react/icons';
import { type DefaultWorkspaceProps, ErrorState, formatDurationBetween } from '@openmrs/esm-framework';
import { formatDomainLabel } from '../../domain-lookups/domain-lookups.resource';
import { usePackageBuilds } from '../../packages/packages.resource';
import { type ExportBuildStatus, type ExportPackage } from '../../types';
import styles from './view-package.workspace.scss';

interface ViewPackageWorkspaceProps extends DefaultWorkspaceProps {
  exportPackage: ExportPackage;
}

const statusTagType: Record<ExportBuildStatus, 'gray' | 'blue' | 'green' | 'red'> = {
  QUEUED: 'gray',
  RUNNING: 'blue',
  COMPLETED: 'green',
  FAILED: 'red',
};

const ViewPackageWorkspace: React.FC<ViewPackageWorkspaceProps> = ({ exportPackage }) => {
  const { t } = useTranslation();
  const { builds, isLoading, error } = usePackageBuilds(exportPackage.uuid);

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
    </div>
  );
};

export default ViewPackageWorkspace;
