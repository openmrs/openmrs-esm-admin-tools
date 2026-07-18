import useSWRImmutable from 'swr/immutable';
import { openmrsFetch, restBaseUrl } from '@openmrs/esm-framework';
import type { SystemSetting, VisitSummarySection } from '../types';

export const sectionsUrl = `${restBaseUrl}/patientdocuments/visitSummary/sections`;

/**
 * Matches the backend convention defined in
 * PatientDocumentsConstants.VISIT_SUMMARY_SECTION_PREFIX.
 */
export const sectionPropertyPrefix = 'report.visitSummary.section.';

export function useVisitSummarySections() {
  const { data, error, isLoading, mutate } = useSWRImmutable<{ data: { results: Array<VisitSummarySection> } }, Error>(
    sectionsUrl,
    openmrsFetch,
  );

  return {
    sections: data?.data?.results,
    error,
    isLoading,
    mutate,
  };
}

/**
 * Returns the global property, or null if it has never been set (a 404 from
 * the systemsetting resource means "unset, defaults apply" and is not an error).
 */
async function getSystemSetting(property: string): Promise<SystemSetting | null> {
  try {
    const response = await openmrsFetch<SystemSetting>(
      `${restBaseUrl}/systemsetting/${property}?v=custom:(uuid,value)`,
    );
    return response.data;
  } catch (error) {
    if ((error as { response?: { status?: number } })?.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

async function setSystemSetting(property: string, value: string, abortController?: AbortController) {
  const existing = await getSystemSetting(property);
  if (existing === null) {
    await openmrsFetch(`${restBaseUrl}/systemsetting`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { property, value },
      signal: abortController?.signal,
    });
  } else if (existing.value !== value) {
    await openmrsFetch(`${restBaseUrl}/systemsetting/${existing.uuid}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { value },
      signal: abortController?.signal,
    });
  }
}

export interface SectionSettingWrite {
  sectionKey: string;
  property: string;
  value: string;
}

/**
 * Writes each setting sequentially and returns the ones that failed, so the
 * caller can report a partial failure and resync against server truth.
 */
export async function saveSectionSettings(
  settings: Array<SectionSettingWrite>,
  abortController?: AbortController,
): Promise<Array<SectionSettingWrite>> {
  const failed: Array<SectionSettingWrite> = [];
  for (const setting of settings) {
    try {
      await setSystemSetting(setting.property, setting.value, abortController);
    } catch (error) {
      failed.push(setting);
    }
  }
  return failed;
}

/**
 * Fetches the visit summary PDF as a blob. Uses window.fetch rather than
 * openmrsFetch because openmrsFetch parses response bodies as text/JSON,
 * which corrupts binary content.
 */
export async function fetchVisitSummaryPdf(visitUuid: string, abortController?: AbortController): Promise<Blob> {
  const url = `${window.openmrsBase}${restBaseUrl}/patientdocuments/visitSummary?visitUuid=${encodeURIComponent(
    visitUuid,
  )}&inline=true`;
  const response = await fetch(url, {
    credentials: 'include',
    headers: { Accept: 'application/pdf' },
    signal: abortController?.signal,
  });
  if (!response.ok) {
    throw new Error(`Failed to generate the visit summary PDF (HTTP ${response.status})`);
  }
  return response.blob();
}
