import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import {
  showSnackbar,
  useLayoutType,
  OpenmrsFetchError,
  Workspace2,
  type Workspace2DefinitionProps,
} from '@openmrs/esm-framework';
import { useDomains } from '../../domain-lookups/domain-lookups.resource';
import { createPackage, editPackage, isPackagesCacheKey, usePackage } from '../../packages/packages.resource';
import type { ExportPackageEntry, ExportPackageEntryDto, MetadataDomain } from '../../types';
import DomainSelectionRow from './domain-selection-row/domain-selection-row.component';
import styles from './metadata-package-form.workspace.scss';

type SelectedItemUuidsByDomain = Map<MetadataDomain, Array<string>>;

// A single shared empty list, so a domain without chosen items always gets the same prop value.
const noSelectedItemUuids: Array<string> = [];

function buildPackageEntries(
  selectedDomains: Set<MetadataDomain>,
  selectedItemUuidsByDomain: SelectedItemUuidsByDomain,
  areAllDomainsSelected: boolean,
): Array<ExportPackageEntryDto> {
  const isAnyDomainNarrowedToItems = Array.from(selectedDomains).some((domain) =>
    selectedItemUuidsByDomain.has(domain),
  );
  if (areAllDomainsSelected && !isAnyDomainNarrowedToItems) {
    return [];
  }

  return Array.from(selectedDomains, (domain) => {
    const itemUuids = selectedItemUuidsByDomain.get(domain);
    return itemUuids ? { domain, itemUuids } : { domain };
  });
}

function getSelectedItemUuidsByDomain(entries: Array<ExportPackageEntry>): SelectedItemUuidsByDomain {
  const entriesWithChosenItems = entries.filter((entry) => entry.itemUuids?.length > 0);
  return new Map(entriesWithChosenItems.map((entry) => [entry.domain, entry.itemUuids]));
}

interface PackageFormWorkspaceProps {
  uuid?: string;
}

const MetadataPackageFormWorkspace: React.FC<Workspace2DefinitionProps<PackageFormWorkspaceProps>> = ({
  workspaceProps,
  closeWorkspace,
}) => {
  const uuid = workspaceProps?.uuid;
  const { t } = useTranslation();
  const { mutate } = useSWRConfig();
  const isTablet = useLayoutType() === 'tablet';
  const isEditMode = Boolean(uuid);
  const { domains, isLoading, error } = useDomains();

  const [packageName, setPackageName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDomains, setSelectedDomains] = useState<Set<string>>(new Set());

  const [selectedItemUuidsByDomain, setSelectedItemUuidsByDomain] = useState<SelectedItemUuidsByDomain>(new Map());

  const allSelected = domains.length > 0 && selectedDomains.size === domains.length;
  const someSelected = selectedDomains.size > 0 && !allSelected;

  const { exportPackage, isLoading: isLoadingPackage, error: packageError } = usePackage(uuid ?? '');

  // An empty list removes the domain from the map, so it goes back to exporting all of its items.
  const setSelectedItemUuidsForDomain = useCallback((domain: MetadataDomain, itemUuids: Array<string>) => {
    setSelectedItemUuidsByDomain((previousSelection) => {
      const nextSelection = new Map(previousSelection);
      if (itemUuids.length > 0) {
        nextSelection.set(domain, itemUuids);
      } else {
        nextSelection.delete(domain);
      }
      return nextSelection;
    });
  }, []);

  const toggleSelectAll = useCallback(
    (checked: boolean) => {
      setSelectedDomains(checked ? new Set(domains) : new Set());
      if (!checked) {
        setSelectedItemUuidsByDomain(new Map());
      }
    },
    [domains],
  );

  const toggleDomain = useCallback(
    (domain: string, checked: boolean) => {
      setSelectedDomains((previous) => {
        const next = new Set(previous);
        if (checked) {
          next.add(domain);
        } else {
          next.delete(domain);
        }
        return next;
      });

      if (!checked) {
        setSelectedItemUuidsForDomain(domain, []);
      }
    },
    [setSelectedItemUuidsForDomain],
  );

  const hasUnsavedChanges = packageName.trim().length > 0 || description.trim().length > 0 || selectedDomains.size > 0;

  // Seed the form from the fetched package exactly once, so a later SWR revalidation
  // of the package or domain list doesn't clobber the user's in-progress edits.
  // An empty entries list means the package includes every registered domain.
  const hasPrefilledFromPackage = useRef(false);
  useEffect(() => {
    if (!isEditMode || hasPrefilledFromPackage.current || !exportPackage) {
      return;
    }
    // Wait for the domain list before expanding an "all domains" package.
    if (exportPackage.entries.length === 0 && domains.length === 0) {
      return;
    }
    hasPrefilledFromPackage.current = true;
    setPackageName(exportPackage.name);
    setDescription(exportPackage.description ?? '');
    setSelectedDomains(
      exportPackage.entries.length === 0
        ? new Set(domains)
        : new Set(exportPackage.entries.map((entry) => entry.domain)),
    );
    setSelectedItemUuidsByDomain(getSelectedItemUuidsByDomain(exportPackage.entries));
  }, [isEditMode, exportPackage, domains]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setIsSubmitting(true);

      const entries = buildPackageEntries(selectedDomains, selectedItemUuidsByDomain, allSelected);
      const payload = { name: packageName.trim(), description: description.trim(), entries };

      try {
        const name = packageName.trim();

        if (isEditMode && uuid) {
          await editPackage(uuid, payload);
          // Revalidate the packages list so the table reflects the change without a refresh.
          await mutate(isPackagesCacheKey);
          showSnackbar({
            title: t('packageUpdated', 'Package updated'),
            subtitle: t('packageUpdatedSubtitle', '{{name}} was updated successfully', { name }),
            kind: 'success',
            isLowContrast: true,
          });
        } else {
          await createPackage(payload);
          // Revalidate the packages list so the table reflects the change without a refresh.
          await mutate(isPackagesCacheKey);
          showSnackbar({
            title: t('packageCreated', 'Package created'),
            subtitle: t('packageCreatedSubtitle', '{{name}} was created successfully', { name }),
            kind: 'success',
            isLowContrast: true,
          });
        }
        // Bypass the "unsaved changes" prompt now that the package is persisted.
        closeWorkspace({ discardUnsavedChanges: true });
      } catch (submitError) {
        const responseBody = submitError instanceof OpenmrsFetchError ? submitError.responseBody : null;
        const reason =
          typeof responseBody === 'object' && responseBody !== null
            ? Object.values(responseBody.fieldErrors ?? {})[0] ?? responseBody.error
            : null;
        const subtitle = reason ?? t('unexpectedError', 'An unexpected error occurred');

        if (isEditMode) {
          showSnackbar({
            title: t('packageUpdateFailed', 'Failed to update package'),
            subtitle,
            kind: 'error',
            isLowContrast: false,
          });
        } else {
          showSnackbar({
            title: t('packageCreationFailed', 'Failed to create package'),
            subtitle,
            kind: 'error',
            isLowContrast: false,
          });
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      allSelected,
      closeWorkspace,
      description,
      isEditMode,
      mutate,
      packageName,
      selectedDomains,
      selectedItemUuidsByDomain,
      t,
      uuid,
    ],
  );

  const isSubmitDisabled = packageName.trim().length === 0 || selectedDomains.size === 0 || isSubmitting;
  const title = isEditMode ? t('editPackage', 'Edit package') : t('newPackage', 'New package');

  if (isEditMode && isLoadingPackage) {
    return (
      <Workspace2 title={title}>
        <div className={styles.form}>
          <InlineLoading description={t('loadingPackage', 'Loading package…')} />
        </div>
      </Workspace2>
    );
  }

  if (packageError) {
    return (
      <Workspace2 title={title} hasUnsavedChanges={hasUnsavedChanges}>
        <div className={styles.form}>
          <InlineNotification
            kind="error"
            lowContrast
            title={t('errorLoadingPackage', 'Error loading package')}
            subtitle={packageError.message}
          />
        </div>
      </Workspace2>
    );
  }

  return (
    <Workspace2 title={title} hasUnsavedChanges={hasUnsavedChanges}>
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
                      <DomainSelectionRow
                        key={domain}
                        domain={domain}
                        isDomainSelected={selectedDomains.has(domain)}
                        selectedItemUuids={selectedItemUuidsByDomain.get(domain) ?? noSelectedItemUuids}
                        packageFormTitle={title}
                        onDomainSelectedChange={toggleDomain}
                        onSelectedItemUuidsChange={setSelectedItemUuidsForDomain}
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
              <InlineLoading description={(isEditMode ? t('saving', 'Saving') : t('creating', 'Creating')) + '…'} />
            ) : isEditMode ? (
              t('saveChanges', 'Save changes')
            ) : (
              t('createPackage', 'Create package')
            )}
          </Button>
        </ButtonSet>
      </Form>
    </Workspace2>
  );
};

export default MetadataPackageFormWorkspace;
