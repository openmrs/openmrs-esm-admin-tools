import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  ButtonSkeleton,
  Column,
  Grid,
  IconButton,
  InlineLoading,
  InlineNotification,
  SkeletonText,
  Tile,
  Toggle,
  Tooltip,
} from '@carbon/react';
import { ArrowDown, ArrowUp, Information } from '@carbon/react/icons';
import { useTranslation } from 'react-i18next';
import { showSnackbar, userHasAccess, useSession } from '@openmrs/esm-framework';
import { PRIVILEGE_MANAGE_GLOBAL_PROPERTIES } from '../constants';
import {
  fetchVisitSummaryPreviewPdf,
  getVisitSummaryPreviewErrorType,
  saveSectionSettings,
  sectionPropertyPrefix,
  useVisitSummarySections,
  type SectionSettingWrite,
  type VisitSummaryPreviewErrorType,
} from './config.resource';
import type { VisitSummarySection } from '../types';
import styles from './visit-summary-config.scss';

type PreviewState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; url: string }
  | { status: 'error'; errorType: VisitSummaryPreviewErrorType };

/**
 * Sections rendered as page furniture by the PDF stylesheet (the footer is
 * fo:static-content stamped on every page), so their list position is
 * meaningless and reordering them must not be offered.
 */
const pinnedBottomSectionKeys = ['footer'];

function isPinnedToBottom(section: VisitSummarySection): boolean {
  return pinnedBottomSectionKeys.includes(section.sectionKey);
}

function sortedByOrder(sections: Array<VisitSummarySection>): Array<VisitSummarySection> {
  const sorted = sections.slice().sort((a, b) => a.order - b.order);
  return [...sorted.filter((section) => !isPinnedToBottom(section)), ...sorted.filter(isPinnedToBottom)];
}

const VisitSummaryConfig: React.FC = () => {
  const { t } = useTranslation();
  const session = useSession();
  const { sections, error, isLoading, mutate } = useVisitSummarySections();

  /**
   * Reading the sections only needs Get Global Properties, so a user without
   * Manage Global Properties can reach this page by direct URL even though the
   * admin card link is hidden from them. They get the page read-only rather
   * than editable controls whose every save is rejected by the server.
   */
  const canSave = userHasAccess(PRIVILEGE_MANAGE_GLOBAL_PROPERTIES, session?.user);

  const [localSections, setLocalSections] = useState<Array<VisitSummarySection>>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [preview, setPreview] = useState<PreviewState>({ status: 'idle' });
  const previewUrlRef = useRef<string | null>(null);
  const previewAbortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (sections) {
      setLocalSections(sortedByOrder(sections));
    }
  }, [sections]);

  useEffect(() => {
    return () => {
      previewAbortControllerRef.current?.abort();
      if (previewUrlRef.current) {
        window.URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const serverSections = useMemo(() => (sections ? sortedByOrder(sections) : []), [sections]);

  const orderChanged = useMemo(
    () =>
      localSections.map((section) => section.sectionKey).join(',') !==
      serverSections.map((section) => section.sectionKey).join(','),
    [localSections, serverSections],
  );

  const enabledChanges = useMemo(
    () =>
      localSections.filter((section) => {
        const serverSection = serverSections.find((candidate) => candidate.sectionKey === section.sectionKey);
        return serverSection && serverSection.enabled !== section.enabled;
      }),
    [localSections, serverSections],
  );

  const isDirty = orderChanged || enabledChanges.length > 0;

  const handleMove = useCallback((index: number, delta: number) => {
    setLocalSections((current) => {
      const target = index + delta;
      if (target < 0 || target >= current.length) {
        return current;
      }
      if (isPinnedToBottom(current[index]) || isPinnedToBottom(current[target])) {
        return current;
      }
      const next = current.slice();
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }, []);

  const handleToggle = useCallback((sectionKey: string, checked: boolean) => {
    setLocalSections((current) =>
      current.map((section) => (section.sectionKey === sectionKey ? { ...section, enabled: checked } : section)),
    );
  }, []);

  const handleSave = useCallback(async (): Promise<boolean> => {
    const writes: Array<SectionSettingWrite> = [];

    if (orderChanged) {
      localSections.forEach((section, index) => {
        writes.push({
          sectionKey: section.sectionKey,
          property: `${sectionPropertyPrefix}${section.sectionKey}.order`,
          value: String((index + 1) * 10),
        });
      });
    }

    for (const section of enabledChanges) {
      writes.push({
        sectionKey: section.sectionKey,
        property: `${sectionPropertyPrefix}${section.sectionKey}.enabled`,
        value: String(section.enabled),
      });
    }

    if (writes.length === 0) {
      return true;
    }

    setIsSaving(true);
    try {
      const failed = await saveSectionSettings(writes);
      await mutate();
      if (failed.length > 0) {
        showSnackbar({
          title: t('saveFailedTitle', 'Some settings were not saved'),
          subtitle: t('saveFailedSubtitle', 'Failed to save: {{properties}}. The list has been reloaded.', {
            properties: failed.map((setting) => setting.property).join(', '),
          }),
          kind: 'error',
          isLowContrast: false,
        });
        return false;
      }
      showSnackbar({
        title: t('saveSuccess', 'Visit summary settings saved'),
        kind: 'success',
        isLowContrast: true,
      });
      return true;
    } finally {
      setIsSaving(false);
    }
  }, [enabledChanges, localSections, mutate, orderChanged, t]);

  const runPreview = useCallback(async () => {
    previewAbortControllerRef.current?.abort();
    const abortController = new AbortController();
    previewAbortControllerRef.current = abortController;

    setPreview({ status: 'loading' });
    try {
      const blob = await fetchVisitSummaryPreviewPdf(abortController);
      if (abortController.signal.aborted) {
        return;
      }
      if (previewUrlRef.current) {
        window.URL.revokeObjectURL(previewUrlRef.current);
      }
      const url = window.URL.createObjectURL(blob);
      previewUrlRef.current = url;
      setPreview({ status: 'ready', url });
    } catch (previewError) {
      if (abortController.signal.aborted) {
        return;
      }
      setPreview({ status: 'error', errorType: getVisitSummaryPreviewErrorType(previewError) });
    }
  }, []);

  const handleSaveAndPreview = useCallback(async () => {
    const saved = await handleSave();
    if (saved) {
      await runPreview();
    }
  }, [handleSave, runPreview]);

  if (isLoading) {
    return (
      <Grid className={styles.grid}>
        <Column sm={4} md={8} lg={8}>
          <SkeletonText heading />
          <SkeletonText paragraph lineCount={8} />
          <ButtonSkeleton />
        </Column>
      </Grid>
    );
  }

  if (error) {
    const isForbidden = (error as { response?: { status?: number } })?.response?.status === 403;
    return (
      <Grid className={styles.grid}>
        <Column sm={4} md={8} lg={8}>
          <InlineNotification
            kind="error"
            lowContrast
            hideCloseButton
            title={t('sectionsFetchError', "Couldn't load the visit summary sections")}
            subtitle={
              isForbidden
                ? t(
                    'sectionsFetchForbiddenSubtitle',
                    'Your account lacks the Get Global Properties privilege required to view this page.',
                  )
                : t('sectionsFetchErrorSubtitle', 'Check that the patientdocuments module is installed and up to date.')
            }
          />
          {!isForbidden && (
            <Button kind="tertiary" onClick={() => mutate()} className={styles.retryButton}>
              {t('retry', 'Retry')}
            </Button>
          )}
        </Column>
      </Grid>
    );
  }

  if (localSections.length === 0) {
    return (
      <Grid className={styles.grid}>
        <Column sm={4} md={8} lg={8}>
          <Tile>
            <p className={styles.emptyStateTitle}>{t('noSectionsTitle', 'No sections registered')}</p>
            <p className={styles.emptyStateBody}>
              {t(
                'noSectionsBody',
                'The server returned no visit summary sections. Sections are registered by the patientdocuments module and by modules that extend it.',
              )}
            </p>
          </Tile>
        </Column>
      </Grid>
    );
  }

  const previewErrorMessages: Record<VisitSummaryPreviewErrorType, { title: string; subtitle: string }> = {
    notAuthorized: {
      title: t('previewNotAuthorizedTitle', 'Not authorized'),
      subtitle: t(
        'sectionsFetchForbiddenSubtitle',
        'Your account lacks the Get Global Properties privilege required to view this page.',
      ),
    },
    endpointMissing: {
      title: t('previewEndpointMissingTitle', 'Preview not available on this server'),
      subtitle: t(
        'previewEndpointMissing',
        'The patientdocuments module running on this server is missing or too old to provide the sample preview. Update it and try again.',
      ),
    },
    generationFailed: {
      title: t('previewGenerationFailedTitle', 'PDF generation failed'),
      subtitle: t(
        'previewGenerationFailed',
        'The server could not generate the sample preview. Try again — if the problem persists, check the server logs.',
      ),
    },
    network: {
      title: t('previewNetworkErrorTitle', 'Network error'),
      subtitle: t('previewNetworkError', 'The preview could not be retrieved. Check your network connection.'),
    },
  };

  return (
    <Grid className={styles.grid}>
      <Column sm={4} md={8} lg={8}>
        {!canSave && (
          <InlineNotification
            kind="info"
            lowContrast
            hideCloseButton
            className={styles.readOnlyNotice}
            title={t('readOnlyTitle', 'These settings are read-only for your account')}
            subtitle={t(
              'readOnlySubtitle',
              'You can see the current visit summary sections and their order, but changing them requires the Manage Global Properties privilege. Ask an administrator to grant it.',
            )}
          />
        )}
        <p className={styles.instructions}>
          {t(
            'instructions',
            'Choose which sections appear in the visit summary PDF and the order they appear in. Changes apply after saving.',
          )}
        </p>
        <ol className={styles.sectionList} aria-label={t('sectionListLabel', 'Visit summary sections')}>
          {localSections.map((section, index) => (
            <li className={styles.sectionRow} key={section.sectionKey}>
              <span className={styles.sectionPosition}>{index + 1}</span>
              <span className={styles.reorderButtons}>
                <IconButton
                  kind="ghost"
                  size="sm"
                  align="right"
                  label={t('moveUp', 'Move {{section}} up', { section: section.label })}
                  disabled={!canSave || index === 0 || isSaving || isPinnedToBottom(section)}
                  onClick={() => handleMove(index, -1)}
                >
                  <ArrowUp />
                </IconButton>
                <IconButton
                  kind="ghost"
                  size="sm"
                  align="right"
                  label={t('moveDown', 'Move {{section}} down', { section: section.label })}
                  disabled={
                    !canSave ||
                    index === localSections.length - 1 ||
                    isSaving ||
                    isPinnedToBottom(section) ||
                    isPinnedToBottom(localSections[index + 1])
                  }
                  onClick={() => handleMove(index, 1)}
                >
                  <ArrowDown />
                </IconButton>
              </span>
              <span className={styles.sectionLabel}>{section.label}</span>
              {section.toggleable ? (
                <Toggle
                  id={`section-toggle-${section.sectionKey}`}
                  size="sm"
                  labelText=""
                  aria-label={t('toggleSection', 'Include {{section}}', { section: section.label })}
                  labelA={t('toggleOff', 'Off')}
                  labelB={t('toggleOn', 'On')}
                  toggled={section.enabled}
                  disabled={!canSave || isSaving}
                  onToggle={(checked: boolean) => handleToggle(section.sectionKey, checked)}
                />
              ) : (
                <span className={styles.lockedToggle}>
                  <Toggle
                    id={`section-toggle-${section.sectionKey}`}
                    size="sm"
                    labelText=""
                    aria-label={t('lockedSection', '{{section}} is always included', { section: section.label })}
                    labelA={t('toggleOff', 'Off')}
                    labelB={t('toggleOn', 'On')}
                    toggled
                    disabled
                  />
                  <Tooltip
                    align="top"
                    label={
                      isPinnedToBottom(section)
                        ? t(
                            'pinnedSectionExplanation',
                            'This section is always included and always prints at the bottom of every page',
                          )
                        : t('lockedSectionExplanation', 'This section is always included')
                    }
                  >
                    <button
                      type="button"
                      className={styles.tooltipTrigger}
                      aria-label={
                        isPinnedToBottom(section)
                          ? t(
                              'pinnedSectionExplanation',
                              'This section is always included and always prints at the bottom of every page',
                            )
                          : t('lockedSectionExplanation', 'This section is always included')
                      }
                    >
                      <Information />
                    </button>
                  </Tooltip>
                </span>
              )}
            </li>
          ))}
        </ol>
        <p className={styles.previewHelper}>
          {t(
            'previewHelper',
            'The preview is rendered from sample data with the saved settings. No patient record is used.',
          )}
        </p>
        <div className={styles.actions}>
          <Button kind="primary" disabled={!canSave || !isDirty || isSaving} onClick={handleSave}>
            {isSaving ? <InlineLoading description={t('saving', 'Saving...')} /> : t('saveButton', 'Save')}
          </Button>
          <Button
            kind="secondary"
            disabled={!canSave || isSaving || preview.status === 'loading'}
            onClick={handleSaveAndPreview}
          >
            {t('saveAndPreviewButton', 'Save & preview')}
          </Button>
        </div>
      </Column>
      <Column sm={4} md={8} lg={8}>
        {preview.status === 'idle' && (
          <Tile className={styles.previewPlaceholder}>
            {t('previewPlaceholder', 'The PDF preview will appear here after you select Save & preview.')}
          </Tile>
        )}
        {preview.status === 'loading' && (
          <Tile className={styles.previewPlaceholder}>
            <InlineLoading description={t('generatingPreview', 'Generating preview...')} />
          </Tile>
        )}
        {preview.status === 'error' && (
          <>
            <InlineNotification
              kind="error"
              lowContrast
              hideCloseButton
              title={previewErrorMessages[preview.errorType].title}
              subtitle={previewErrorMessages[preview.errorType].subtitle}
            />
            {/* Retrying cannot grant a privilege the account does not have. */}
            {preview.errorType !== 'notAuthorized' && (
              <Button kind="tertiary" onClick={runPreview} className={styles.retryButton}>
                {t('retry', 'Retry')}
              </Button>
            )}
          </>
        )}
        {preview.status === 'ready' && (
          <object
            data={preview.url}
            type="application/pdf"
            className={styles.previewObject}
            aria-label={t('previewPaneLabel', 'Visit summary PDF preview')}
          >
            <p>
              {t('previewUnsupported', "This browser can't display PDFs inline.")}{' '}
              <a href={preview.url} target="_blank" rel="noopener noreferrer">
                {t('previewOpenInNewTab', 'Open the preview in a new tab')}
              </a>
            </p>
          </object>
        )}
      </Column>
    </Grid>
  );
};

export default VisitSummaryConfig;
