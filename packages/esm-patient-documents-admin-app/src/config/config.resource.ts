import useSWRImmutable from 'swr/immutable';
import { openmrsFetch, restBaseUrl } from '@openmrs/esm-framework';
import type { SystemSetting, VisitSummarySection } from '../types';

export const sectionsUrl = `${restBaseUrl}/patientdocuments/visitSummary/sections`;

/**
 * Renders a PDF from sample in-memory data, honouring the same enabled/order
 * configuration as the real visit summary
 */
export const previewUrl = `${restBaseUrl}/patientdocuments/visitSummary/preview`;

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

export type VisitSummaryPreviewErrorType = 'notAuthorized' | 'endpointMissing' | 'generationFailed' | 'network';

/**
 * openmrsFetch reads the body off a clone, so the stream is still intact for blob().
 * A body that fails to read is marked so the classifier can tell it apart from a
 * request that never reached the server.
 *
 * Deliberately sends no Accept header: a server without this endpoint reformats its
 * 404 to match `Accept: application/pdf`, fails, and answers 500 with an HTML error
 * page, which hides the "module too old" case. Left unset, an old server returns a
 * JSON 404 and a current one still returns the PDF.
 */
export async function fetchVisitSummaryPreviewPdf(abortController?: AbortController): Promise<Blob> {
  const response = await openmrsFetch(previewUrl, {
    signal: abortController?.signal,
  });
  try {
    return await response.blob();
  } catch (error) {
    throw Object.assign(new Error('Failed to read the visit summary preview PDF response body'), {
      isBlobReadError: true,
      cause: error,
    });
  }
}

/** 404 means the running patientdocuments module predates the preview endpoint. */
export function getVisitSummaryPreviewErrorType(error: unknown): VisitSummaryPreviewErrorType {
  const status = (error as { response?: { status?: number } })?.response?.status;
  if (status === 403) {
    return 'notAuthorized';
  }
  if (status === 404) {
    return 'endpointMissing';
  }
  if (typeof status === 'number') {
    return 'generationFailed';
  }
  if ((error as { isBlobReadError?: boolean })?.isBlobReadError) {
    return 'generationFailed';
  }
  return 'network';
}
