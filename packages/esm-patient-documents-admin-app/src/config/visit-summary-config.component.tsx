import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  ButtonSkeleton,
  Column,
  Grid,
  IconButton,
  InlineLoading,
  InlineNotification,
  Layer,
  SkeletonText,
  TextInput,
  Tile,
  Toggle,
  Tooltip,
} from '@carbon/react';
import { ArrowDown, ArrowUp, Information } from '@carbon/react/icons';
import { useTranslation } from 'react-i18next';
import { showSnackbar } from '@openmrs/esm-framework';
import {
  fetchVisitSummaryPdf,
  saveSectionSettings,
  sectionPropertyPrefix,
  useVisitSummarySections,
  type SectionSettingWrite,
} from './config.resource';
import type { VisitSummarySection } from '../types';
import styles from './visit-summary-config.scss';

type PreviewState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; url: string }
  | { status: 'error'; message: string };

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
  const { sections, error, isLoading, mutate } = useVisitSummarySections();

  const [localSections, setLocalSections] = useState<Array<VisitSummarySection>>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [preview, setPreview] = useState<PreviewState>({ status: 'idle' });
  const [previewVisitUuid, setPreviewVisitUuid] = useState('');
  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (sections) {
      setLocalSections(sortedByOrder(sections));
    }
  }, [sections]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
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
    setPreview({ status: 'loading' });
    try {
      const blob = await fetchVisitSummaryPdf(previewVisitUuid.trim());
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
      const url = URL.createObjectURL(blob);
      previewUrlRef.current = url;
      setPreview({ status: 'ready', url });
    } catch (previewError) {
      setPreview({
        status: 'error',
        message: previewError instanceof Error ? previewError.message : String(previewError),
      });
    }
  }, [previewVisitUuid]);

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
                : t('sectionsFetchErrorSubtitle', 'Check that the patientdocuments module is running.')
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

  return (
    <Grid className={styles.grid}>
      <Column sm={4} md={8} lg={8}>
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
                  disabled={index === 0 || isSaving || isPinnedToBottom(section)}
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
                  disabled={isSaving}
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
        <Layer className={styles.previewVisitInput}>
          <TextInput
            id="preview-visit-uuid"
            labelText={t('previewVisitUuid', 'Visit UUID for preview')}
            helperText={t(
              'previewVisitUuidHelper',
              'The preview renders the visit summary of this visit with the saved settings.',
            )}
            value={previewVisitUuid}
            disabled={isSaving}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setPreviewVisitUuid(event.target.value)}
          />
        </Layer>
        <div className={styles.actions}>
          <Button kind="primary" disabled={!isDirty || isSaving} onClick={handleSave}>
            {isSaving ? <InlineLoading description={t('saving', 'Saving...')} /> : t('saveButton', 'Save')}
          </Button>
          <Button
            kind="secondary"
            disabled={isSaving || preview.status === 'loading' || previewVisitUuid.trim() === ''}
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
              title={t('previewError', "Couldn't generate the preview")}
              subtitle={preview.message}
            />
            <Button kind="tertiary" onClick={runPreview} className={styles.retryButton}>
              {t('retry', 'Retry')}
            </Button>
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
