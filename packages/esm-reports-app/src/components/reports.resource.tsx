import { openmrsFetch, openmrsObservableFetch } from '@openmrs/esm-framework';
import type { FetchResponse } from '@openmrs/esm-framework';
import { type Observable } from 'rxjs';
import useSWR from 'swr';
import type { ReportDefinition } from '../types/report-definition';
import type { ReportDesign } from '../types/report-design';
import type { ReportRequest } from '../types/report-request';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';

interface ReportModel {
  reportName: string;
  status: string;
  requestedBy: string;
  requestedByUserUuid: string;
  requestedOn: string;
  outputFormat: string;
  parameters: any;
  id: string;
  evaluateCompleteDatetime: string;
  schedule: string;
}

interface ScheduledReportModel {
  reportDefinitionUuid: string;
  reportRequestUuid: string;
  name: string;
  schedule: string;
}

export function useLocations() {
  const apiUrl = `/ws/rest/v1/location?tag=Login+Location`;

  const { data } = useSWR<{ data: { results: Array<any> } }, Error>(apiUrl, openmrsFetch);

  return {
    locations: data ? data?.data?.results : [],
  };
}

export function useReports(statuses: string, pageNumber: number, pageSize: number, sortBy?: string): any {
  const reportsUrl =
    `/ws/rest/v1/reportingrest/reportRequest?status=${statuses}&startIndex=${pageNumber}&limit=${pageSize}&totalCount=true` +
    (sortBy ? `&sortBy=${sortBy}` : '');

  const { data, error, isValidating, mutate } = useSWR<{ data: { results: Array<any>; totalCount: number } }, Error>(
    reportsUrl,
    openmrsFetch,
  );

  const reports = data?.data?.results;
  const totalCount = data?.data?.totalCount;
  const reportsArray: Array<any> = reports ? [].concat(...reports.map((report) => mapReportResults(report))) : [];

  return {
    reports: reportsArray,
    reportsTotalCount: totalCount,
    error,
    isValidating: isValidating,
    mutateReports: mutate,
  };
}

export function useReportRequest(reportRequestUuid: string): any {
  const reportsUrl = `/ws/rest/v1/reportingrest/reportRequest/${reportRequestUuid}`;

  const { data, error, isValidating, mutate } = useSWR<{ data: ReportRequest }, Error>(reportsUrl, openmrsFetch);

  return {
    reportRequest: data?.data,
    error,
    isValidating: isValidating,
    mutate,
  };
}

export function useScheduledReports(sortBy?: string): any {
  const scheduledReportsUrl =
    `/ws/rest/v1/reportingrest/reportDefinitionsWithScheduledRequests` + (sortBy ? `?sortBy=${sortBy}` : '');

  const { data, error, isValidating, mutate } = useSWR<{ data: { results: Array<any> } }, Error>(
    scheduledReportsUrl,
    openmrsFetch,
  );

  const scheduledReports = data?.data?.results;
  const scheduledReportsArray: Array<any> = scheduledReports
    ? [].concat(...scheduledReports.map((report) => mapScheduledReportResults(report)))
    : [];

  return {
    scheduledReports: scheduledReportsArray,
    error,
    isValidating: isValidating,
    mutateScheduledReports: mutate,
  };
}

export function useReportDefinitions() {
  const apiUrl = `/ws/rest/v1/reportingrest/reportDefinition?v=full`;

  const { data } = useSWR<{ data: { results: Array<ReportDefinition> } }, Error>(apiUrl, openmrsFetch);

  return {
    reportDefinitions: data ? data?.data?.results : [],
  };
}

export function useReportDefinition(reportDefinitionUuid: string): ReportDefinition {
  const apiUrl = `/ws/rest/v1/reportingrest/reportDefinition/${reportDefinitionUuid}?v=full`;

  const { data } = useSWR<{ data: ReportDefinition }, Error>(apiUrl, openmrsFetch);

  return data?.data;
}

export function useReportDesigns(reportDefinitionUuid: string) {
  const apiUrl = `/ws/rest/v1/reportingrest/reportDesign?reportDefinitionUuid=${reportDefinitionUuid}`;

  const { data, error, isValidating, mutate } = useSWR<{ data: { results: ReportDesign[] } }, Error>(
    reportDefinitionUuid ? apiUrl : null,
    openmrsFetch,
  );

  return {
    reportDesigns: data?.data.results,
    error,
    isValidating: isValidating,
    mutateReportDesigns: mutate,
  };
}

export function runReportObservable(payload: any): Observable<FetchResponse<any>> {
  const abortController = new AbortController();
  return openmrsObservableFetch(`/ws/rest/v1/reportingrest/reportRequest`, {
    signal: abortController.signal,
    method: 'POST',
    headers: {
      'Content-type': 'application/json',
    },
    body: payload,
  });
}

export async function cancelReportRequest(reportRequestUuid: string) {
  const apiUrl = `/ws/rest/v1/reportingrest/reportRequest/${reportRequestUuid}`;

  return openmrsFetch(apiUrl, {
    method: 'DELETE',
  });
}

export async function preserveReport(reportRequestUuid: string) {
  const apiUrl = `/ws/rest/v1/reportingrest/saveReport?reportRequestUuid=${reportRequestUuid}`;

  return openmrsFetch(apiUrl, {
    method: 'POST',
  });
}

export async function downloadReport(reportRequestUuid: string) {
  const apiUrl = `/ws/rest/v1/reportingrest/downloadReport?reportRequestUuid=${reportRequestUuid}`;

  const { data } = await openmrsFetch<any>(apiUrl);

  return data;
}

export async function downloadMultipleReports(reportRequestUuids: string[]) {
  const apiUrl = `/ws/rest/v1/reportingrest/downloadMultipleReports?reportRequestUuids=${reportRequestUuids}`;

  const { data } = await openmrsFetch<any>(apiUrl);

  return data;
}

function mapReportResults(data: any): ReportModel {
  return {
    id: data.uuid,
    reportName: data.parameterizable.name,
    status: data.status,
    requestedBy: data.requestedBy.person.display,
    requestedByUserUuid: data.requestedBy.uuid,
    requestedOn: dayjs(data.requestDate).format('YYYY-MM-DD HH:mm'),
    outputFormat: data.renderingMode.label,
    parameters: convertParametersToString(data),
    evaluateCompleteDatetime: data.evaluateCompleteDatetime
      ? dayjs(data.evaluateCompleteDatetime).format('YYYY-MM-DD HH:mm')
      : undefined,
    schedule: data.schedule,
  };
}

function mapScheduledReportResults(data: any): ScheduledReportModel {
  return {
    reportDefinitionUuid: data.reportDefinition.uuid,
    reportRequestUuid: data.scheduledRequests?.[0]?.uuid,
    name: data.reportDefinition.display,
    schedule: data.scheduledRequests?.[0]?.schedule,
  };
}

function convertParametersToString(data: any): string {
  let finalString = '';
  const parameters = data.parameterizable.parameters;
  if (parameters.length > 0) {
    parameters.forEach((parameter) => {
      let value = data.parameterMappings[parameter.name];
      if (parameter.type === 'java.util.Date') {
        value = dayjs(value).format('YYYY-MM-DD');
      } else if (parameter.type === 'org.openmrs.Location') {
        value = value?.display;
      }
      finalString = finalString + parameter.label + ': ' + value + ', ';
    });

    finalString = finalString.trim();

    if (finalString.charAt(finalString.length - 1) === ',') {
      finalString = finalString.slice(0, -1);
    }
  }

  return finalString;
}

export function useReportData(reportUuid: string, parameters: Record<string, string>) {
  const { t } = useTranslation();
  const [shouldFetch, setShouldFetch] = useState(false);
  const [lastReportUuid, setLastReportUuid] = useState('');

  // Reset shouldFetch when reportUuid changes
  useEffect(() => {
    if (reportUuid !== lastReportUuid) {
      setShouldFetch(false);
      setLastReportUuid(reportUuid);
    }
  }, [reportUuid, lastReportUuid]);

  // Only fetch when shouldFetch is true and we have a reportUuid
  const { data, error, isLoading, mutate } = useSWR(
    shouldFetch && reportUuid ? ['reportData', reportUuid, parameters] : null,
    async () => {
      if (!reportUuid) return null;

      // Build query string only if we have parameters
      let url = `/ws/rest/v1/reportingrest/reportdata/${reportUuid}`;
      if (Object.keys(parameters).length > 0) {
        const queryParams = new URLSearchParams();
        Object.entries(parameters).forEach(([key, value]) => {
          if (value) {
            queryParams.append(key, value);
          }
        });
        url += `?${queryParams.toString()}`;
      }

      const response = await openmrsFetch(url);
      return response.data;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
    },
  );

  return {
    reportData: data,
    error,
    isLoading,
    mutate: () => {
      setShouldFetch(true);
      mutate();
    },
  };
}
