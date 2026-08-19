import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  ButtonSet,
  Checkbox,
  CheckboxSkeleton,
  Form,
  InlineLoading,
  InlineNotification,
  Stack,
  TextArea,
  TextInput,
} from '@carbon/react';
import { useSWRConfig } from 'swr';
import { type DefaultWorkspaceProps, restBaseUrl, showSnackbar, useLayoutType } from '@openmrs/esm-framework';
import { formatDomainLabel, useDomains } from '../../domain-lookups/domain-lookups.resource';
import { createPackage } from '../../packages/packages.resource';
import styles from './new-package.workspace.scss';

const packagesUrl = `${restBaseUrl}/metadataexport/packages`;
const isPackagesCacheKey = (key: unknown) => typeof key === 'string' && key.startsWith(packagesUrl);

const NewPackageWorkspace: React.FC<DefaultWorkspaceProps> = ({
  closeWorkspace,
  closeWorkspaceWithSavedChanges,
  promptBeforeClosing,
}) => {
  const { t } = useTranslation();
  const { mutate } = useSWRConfig();
  const isTablet = useLayoutType() === 'tablet';
  const { domains, isLoading, error } = useDomains();

  const [packageName, setPackageName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDomains, setSelectedDomains] = useState<Set<string>>(new Set());

  const allSelected = domains.length > 0 && selectedDomains.size === domains.length;
  const someSelected = selectedDomains.size > 0 && !allSelected;

  const toggleSelectAll = useCallback(
    (checked: boolean) => {
      setSelectedDomains(checked ? new Set(domains) : new Set());
    },
    [domains],
  );

  const toggleDomain = useCallback((domain: string, checked: boolean) => {
    setSelectedDomains((previous) => {
      const next = new Set(previous);
      if (checked) {
        next.add(domain);
      } else {
        next.delete(domain);
      }
      return next;
    });
  }, []);

  const hasUnsavedChanges = packageName.trim().length > 0 || description.trim().length > 0 || selectedDomains.size > 0;

  useEffect(() => {
    promptBeforeClosing(() => hasUnsavedChanges);
  }, [hasUnsavedChanges, promptBeforeClosing]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setIsSubmitting(true);

      // An explicit empty array tells the server to include every registered domain.
      const entries = allSelected ? [] : Array.from(selectedDomains, (domain) => ({ domain }));

      try {
        await createPackage({ name: packageName.trim(), description: description.trim(), entries });
        // Revalidate the packages list so the table shows the new package without a refresh.
        await mutate(isPackagesCacheKey);
        showSnackbar({
          title: t('packageCreated', 'Package created'),
          subtitle: t('packageCreatedSubtitle', '{{name}} was created successfully', { name: packageName.trim() }),
          kind: 'success',
          isLowContrast: true,
        });
        // Bypass the "unsaved changes" prompt now that the package is persisted.
        closeWorkspaceWithSavedChanges();
      } catch (submitError) {
        showSnackbar({
          title: t('packageCreationFailed', 'Failed to create package'),
          subtitle: submitError instanceof Error ? submitError.message : String(submitError),
          kind: 'error',
          isLowContrast: false,
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [allSelected, closeWorkspaceWithSavedChanges, description, mutate, packageName, selectedDomains, t],
  );

  const isSubmitDisabled = packageName.trim().length === 0 || selectedDomains.size === 0 || isSubmitting;

  return (
    <Form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.grid}>
        <Stack gap={6}>
          <section className={styles.section}>
            <TextInput
              id="packageName"
              labelText={t('packageName', 'Package name')}
              placeholder={t('packageNamePlaceholder', 'e.g. Core reference data')}
              value={packageName}
              onChange={(event) => setPackageName(event.target.value)}
            />
          </section>

          <section className={styles.section}>
            <TextArea
              id="packageDescription"
              labelText={t('description', 'Description')}
              placeholder={t('descriptionPlaceholder', 'Briefly describe what this package contains')}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </section>

          <section className={styles.section}>
            <span className={styles.sectionLabel}>{t('domains', 'Domains')}</span>

            {error ? (
              <InlineNotification
                kind="error"
                lowContrast
                title={t('errorLoadingDomains', 'Error loading domains')}
                subtitle={error?.message}
              />
            ) : isLoading ? (
              <div className={styles.domainList}>
                {Array.from({ length: 8 }, (_, index) => (
                  <CheckboxSkeleton key={index} />
                ))}
              </div>
            ) : (
              <>
                <Checkbox
                  id="select-all-domains"
                  className={styles.selectAll}
                  labelText={t('selectAll', 'Select all')}
                  checked={allSelected}
                  indeterminate={someSelected}
                  onChange={(_event, { checked }) => toggleSelectAll(checked)}
                />
                <div className={styles.domainList}>
                  {domains.map((domain) => (
                    <Checkbox
                      key={domain}
                      id={`domain-${domain}`}
                      labelText={formatDomainLabel(domain)}
                      checked={selectedDomains.has(domain)}
                      onChange={(_event, { checked }) => toggleDomain(domain, checked)}
                    />
                  ))}
                </div>
              </>
            )}
          </section>
        </Stack>
      </div>

      <ButtonSet className={isTablet ? styles.tabletButtonSet : styles.desktopButtonSet}>
        <Button className={styles.button} kind="secondary" onClick={() => closeWorkspace()}>
          {t('cancel', 'Cancel')}
        </Button>
        <Button className={styles.button} kind="primary" type="submit" disabled={isSubmitDisabled}>
          {isSubmitting ? (
            <InlineLoading description={t('creating', 'Creating') + '…'} />
          ) : (
            t('createPackage', 'Create package')
          )}
        </Button>
      </ButtonSet>
    </Form>
  );
};

export default NewPackageWorkspace;
